package com.transport.tms.governance.system.service;

import com.transport.tms.common.exception.Exceptions.BadRequestException;
import com.transport.tms.common.exception.Exceptions.ResourceNotFoundException;
import com.transport.tms.governance.audit.service.AuditService;
import com.transport.tms.governance.system.dto.SystemDtos;
import com.transport.tms.governance.system.entity.BackupRecord;
import com.transport.tms.governance.system.entity.SystemControl;
import com.transport.tms.governance.system.repository.BackupRecordRepository;
import com.transport.tms.governance.system.repository.SystemControlRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.lang.management.ManagementFactory;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class SystemControlService {

    private final SystemControlRepository systemControlRepository;
    private final BackupRecordRepository backupRecordRepository;
    private final AuditService auditService;
    private final JdbcTemplate jdbcTemplate;

    @Transactional
    public SystemControl getSystemControl() {
        return systemControlRepository.findById(1).orElseGet(() -> {
            SystemControl defaultControl = SystemControl.builder()
                    .id(1)
                    .systemState("ONLINE")
                    .maintenanceTitle("System Maintenance")
                    .maintenanceMessage("The system is currently undergoing scheduled maintenance. Please check back shortly.")
                    .allowAdminBypass(true)
                    .allowWorkerTrips(true)
                    .allowAccountsPayments(true)
                    .lockSensitiveOps(false)
                    .updatedBy("SYSTEM")
                    .build();
            return systemControlRepository.save(defaultControl);
        });
    }

    @Transactional
    public SystemControl updateSystemState(SystemDtos.SystemStateChangeRequest request, String performedBy) {
        String targetState = request.getSystemState() != null ? request.getSystemState().toUpperCase().trim() : "ONLINE";

        if (!List.of("ONLINE", "MAINTENANCE", "SHUTDOWN").contains(targetState)) {
            throw new BadRequestException("Invalid system state. Must be ONLINE, MAINTENANCE, or SHUTDOWN");
        }

        if ("SHUTDOWN".equals(targetState)) {
            if (request.getConfirmationText() == null || !"SHUTDOWN".equalsIgnoreCase(request.getConfirmationText().trim())) {
                throw new BadRequestException("Global shutdown requires explicit confirmation phrase 'SHUTDOWN'");
            }
        }

        SystemControl control = getSystemControl();
        String previousState = control.getSystemState();

        control.setSystemState(targetState);
        control.setUpdatedBy(performedBy != null ? performedBy : "ADMIN");
        control.setUpdatedAt(LocalDateTime.now());

        if (request.getAllowAdminBypass() != null) {
            control.setAllowAdminBypass(request.getAllowAdminBypass());
        }

        if ("SHUTDOWN".equals(targetState)) {
            control.setShutdownReason(request.getReason() != null ? request.getReason() : "Emergency system shutdown invoked by Administrator");
            control.setShutdownBy(performedBy != null ? performedBy : "ADMIN");
            control.setShutdownAt(LocalDateTime.now());
        } else if ("MAINTENANCE".equals(targetState)) {
            if (request.getMaintenanceTitle() != null && !request.getMaintenanceTitle().isBlank()) {
                control.setMaintenanceTitle(request.getMaintenanceTitle());
            }
            if (request.getMaintenanceMessage() != null && !request.getMaintenanceMessage().isBlank()) {
                control.setMaintenanceMessage(request.getMaintenanceMessage());
            }
            control.setExpectedRecoveryTime(request.getExpectedRecoveryTime());
        } else if ("ONLINE".equals(targetState)) {
            control.setShutdownReason(null);
            control.setShutdownBy(null);
            control.setShutdownAt(null);
            control.setExpectedRecoveryTime(null);
        }

        SystemControl saved = systemControlRepository.save(control);

        // Record Audit
        String auditAction = switch (targetState) {
            case "SHUTDOWN" -> "ADMIN → SHUT DOWN SYSTEM";
            case "MAINTENANCE" -> "ADMIN → ENABLED MAINTENANCE MODE";
            default -> "ADMIN → RETURNED SYSTEM ONLINE";
        };

        auditService.recordAudit(
                "SYSTEM_CONTROL",
                "1",
                auditAction,
                "systemState",
                previousState,
                targetState,
                request.getReason() != null ? request.getReason() : "System state transitioned to " + targetState,
                performedBy != null ? performedBy : "ADMIN",
                null
        );

        log.warn("SYSTEM CONTROL STATE CHANGED: {} -> {} by {}", previousState, targetState, performedBy);
        return saved;
    }

    @Transactional
    public SystemControl updateEmergencyToggles(SystemDtos.EmergencyToggleRequest request, String performedBy) {
        SystemControl control = getSystemControl();

        if (request.getAllowWorkerTrips() != null) {
            control.setAllowWorkerTrips(request.getAllowWorkerTrips());
        }
        if (request.getAllowAccountsPayments() != null) {
            control.setAllowAccountsPayments(request.getAllowAccountsPayments());
        }
        if (request.getLockSensitiveOps() != null) {
            control.setLockSensitiveOps(request.getLockSensitiveOps());
        }

        control.setUpdatedBy(performedBy != null ? performedBy : "ADMIN");
        control.setUpdatedAt(LocalDateTime.now());
        SystemControl saved = systemControlRepository.save(control);

        auditService.recordAudit(
                "SYSTEM_CONTROL",
                "1",
                "ADMIN → UPDATED EMERGENCY TOGGLES",
                "emergencyToggles",
                null,
                String.format("trips=%s, payments=%s, lockSensitive=%s",
                        saved.getAllowWorkerTrips(), saved.getAllowAccountsPayments(), saved.getLockSensitiveOps()),
                request.getReason() != null ? request.getReason() : "Emergency operational toggles adjusted",
                performedBy != null ? performedBy : "ADMIN",
                null
        );

        return saved;
    }

    @Transactional(readOnly = true)
    public SystemDtos.SystemHealthDto getSystemHealth() {
        SystemControl control = getSystemControl();

        String dbVersion = "PostgreSQL";
        String databaseStatus = "ONLINE";
        try {
            String ver = jdbcTemplate.queryForObject("SELECT version()", String.class);
            if (ver != null && ver.contains("PostgreSQL")) {
                dbVersion = ver.split(",")[0].trim();
            }
        } catch (Exception e) {
            log.error("Database health check failed", e);
            databaseStatus = "OFFLINE";
        }

        // Table counts
        Map<String, Long> tableCounts = new HashMap<>();
        String[] tables = {"trips", "invoices", "payments", "customers", "vehicles", "drivers", "audit_logs", "users"};
        for (String table : tables) {
            try {
                Long count = jdbcTemplate.queryForObject("SELECT count(*) FROM " + table, Long.class);
                tableCounts.put(table, count != null ? count : 0L);
            } catch (Exception e) {
                tableCounts.put(table, -1L);
            }
        }

        // Memory & Uptime
        Runtime runtime = Runtime.getRuntime();
        long usedMemoryMb = (runtime.totalMemory() - runtime.freeMemory()) / (1024 * 1024);
        long maxMemoryMb = runtime.maxMemory() / (1024 * 1024);
        String jvmMemory = usedMemoryMb + " MB / " + maxMemoryMb + " MB";
        long uptimeSeconds = ManagementFactory.getRuntimeMXBean().getUptime() / 1000;

        // Backups
        List<BackupRecord> backups = backupRecordRepository.findAllByOrderByCreatedAtDesc();
        BackupRecord lastBackup = backups.isEmpty() ? null : backups.get(0);
        LocalDateTime lastRecovery = backups.stream()
                .filter(b -> b.getRestoredAt() != null)
                .map(BackupRecord::getRestoredAt)
                .max(LocalDateTime::compareTo)
                .orElse(null);

        return SystemDtos.SystemHealthDto.builder()
                .backendStatus("ONLINE")
                .databaseStatus(databaseStatus)
                .apiStatus("ONLINE")
                .backupStatus("HEALTHY")
                .storageStatus("HEALTHY")
                .auditStatus("ONLINE")
                .systemState(control.getSystemState())
                .environment("Production-Grade Enterprise Architecture")
                .appVersion("1.0.0 (Enterprise Control Center)")
                .dbVersion(dbVersion)
                .activeDbPool("HikariCP-1 (10 max, 2 min idle)")
                .jvmMemory(jvmMemory)
                .uptimeSeconds(uptimeSeconds)
                .tableCounts(tableCounts)
                .totalBackups((long) backups.size())
                .lastBackup(lastBackup)
                .lastRecovery(lastRecovery)
                .activeSessionsCount(1)
                .build();
    }
}
