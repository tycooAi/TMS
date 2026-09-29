package com.transport.tms.governance.system.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.transport.tms.common.exception.Exceptions.BadRequestException;
import com.transport.tms.common.exception.Exceptions.ResourceNotFoundException;
import com.transport.tms.governance.audit.service.AuditService;
import com.transport.tms.governance.system.dto.SystemDtos;
import com.transport.tms.governance.system.entity.BackupRecord;
import com.transport.tms.governance.system.entity.BackupSchedule;
import com.transport.tms.governance.system.repository.BackupRecordRepository;
import com.transport.tms.governance.system.repository.BackupScheduleRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.*;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.security.MessageDigest;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class BackupService {

    private final BackupRecordRepository backupRecordRepository;
    private final BackupScheduleRepository backupScheduleRepository;
    private final AuditService auditService;
    private final JdbcTemplate jdbcTemplate;
    private final ObjectMapper objectMapper;

    @Value("${spring.datasource.username:postgres}")
    private String dbUsername;

    @Value("${spring.datasource.password:root}")
    private String dbPassword;

    private static final String BACKUP_DIR = "backups";
    private static final String PG_BIN_PATH = "C:\\Program Files\\PostgreSQL\\18\\bin";

    @Transactional
    public BackupRecord createBackup(SystemDtos.BackupCreateRequest request, String performedBy) {
        String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss"));
        String backupId = "BKP-" + timestamp;
        String backupType = request.getBackupType() != null ? request.getBackupType().toUpperCase() : "MANUAL";
        String fileName = "tms_snapshot_" + timestamp + ".sql";

        Path storageDir = Paths.get(BACKUP_DIR).toAbsolutePath();
        try {
            Files.createDirectories(storageDir);
        } catch (IOException e) {
            log.error("Failed to create backup directory", e);
            throw new RuntimeException("Storage failure creating backup folder: " + e.getMessage());
        }

        File targetFile = storageDir.resolve(fileName).toFile();
        boolean dumpSuccess = false;

        // Try PostgreSQL pg_dump first
        String pgDumpExe = Paths.get(PG_BIN_PATH, "pg_dump.exe").toString();
        if (new File(pgDumpExe).exists()) {
            try {
                ProcessBuilder pb = new ProcessBuilder(
                        pgDumpExe,
                        "-U", dbUsername,
                        "-d", "tms_db",
                        "--no-owner",
                        "--inserts",
                        "-f", targetFile.getAbsolutePath()
                );
                pb.environment().put("PGPASSWORD", dbPassword);
                Process process = pb.start();
                int exitCode = process.waitFor();
                if (exitCode == 0 && targetFile.length() > 0) {
                    dumpSuccess = true;
                    log.info("Successfully executed pg_dump to {}", targetFile.getAbsolutePath());
                } else {
                    log.warn("pg_dump exited with code {}", exitCode);
                }
            } catch (Exception ex) {
                log.warn("pg_dump invocation failed: {}", ex.getMessage());
            }
        }

        // Portable table export fallback if pg_dump not usable
        if (!dumpSuccess) {
            log.info("Generating SQL data dump via JDBC export fallback...");
            try (PrintWriter writer = new PrintWriter(new FileWriter(targetFile))) {
                writer.println("-- TransFlow TMS Database Snapshot Dump");
                writer.println("-- Generated At: " + LocalDateTime.now());
                writer.println("-- Backup ID: " + backupId);
                writer.println();

                String[] tables = {
                        "users", "roles", "permissions", "role_permissions",
                        "customers", "vehicles", "drivers", "sources", "materials", "locations", "fuel_stations",
                        "configured_rates", "trips", "trip_status_history", "invoices", "invoice_items",
                        "cash_bank_accounts", "payments", "payment_allocations", "contra_transfers",
                        "financial_transactions", "diesel_logs", "vehicle_expenses", "worker_wages", "wage_advances",
                        "correction_requests", "correction_request_items", "audit_logs", "system_feature_flags", "system_control"
                };

                for (String table : tables) {
                    writer.println("-- Table: " + table);
                    try {
                        List<Map<String, Object>> rows = jdbcTemplate.queryForList("SELECT * FROM " + table);
                        for (Map<String, Object> row : rows) {
                            StringBuilder cols = new StringBuilder();
                            StringBuilder vals = new StringBuilder();
                            for (Map.Entry<String, Object> entry : row.entrySet()) {
                                if (cols.length() > 0) {
                                    cols.append(", ");
                                    vals.append(", ");
                                }
                                cols.append(entry.getKey());
                                Object v = entry.getValue();
                                if (v == null) {
                                    vals.append("NULL");
                                } else if (v instanceof Number || v instanceof Boolean) {
                                    vals.append(v);
                                } else {
                                    vals.append("'").append(v.toString().replace("'", "''")).append("'");
                                }
                            }
                            writer.println("INSERT INTO " + table + " (" + cols + ") VALUES (" + vals + ") ON CONFLICT DO NOTHING;");
                        }
                    } catch (Exception ex) {
                        log.warn("Table {} export note: {}", table, ex.getMessage());
                    }
                    writer.println();
                }
                dumpSuccess = true;
            } catch (Exception ex) {
                log.error("Failed to generate SQL export", ex);
                throw new RuntimeException("Database backup failed: " + ex.getMessage());
            }
        }

        // Entity counts summary
        Map<String, Long> entityCounts = new HashMap<>();
        String[] coreTables = {"trips", "invoices", "payments", "customers", "vehicles", "drivers", "audit_logs"};
        for (String table : coreTables) {
            try {
                Long count = jdbcTemplate.queryForObject("SELECT count(*) FROM " + table, Long.class);
                entityCounts.put(table, count != null ? count : 0L);
            } catch (Exception ignored) {}
        }
        String countsJson = "{}";
        try {
            countsJson = objectMapper.writeValueAsString(entityCounts);
        } catch (Exception ignored) {}

        // SHA-256 Checksum
        String checksum = calculateSha256(targetFile);

        BackupRecord record = BackupRecord.builder()
                .id(backupId)
                .backupName("Snapshot " + timestamp + " (" + backupType + ")")
                .backupType(backupType)
                .filePath(targetFile.getAbsolutePath())
                .fileSizeBytes(targetFile.length())
                .checksumSha256(checksum)
                .status("COMPLETED")
                .entityCountsJson(countsJson)
                .createdBy(performedBy != null ? performedBy : "ADMIN")
                .createdAt(LocalDateTime.now())
                .notes(request.getNotes() != null ? request.getNotes() : "Full database snapshot point")
                .build();

        BackupRecord saved = backupRecordRepository.save(record);

        auditService.recordAudit(
                "BACKUP",
                backupId,
                "ADMIN → CREATED BACKUP",
                "status",
                null,
                "COMPLETED",
                "Created backup type " + backupType + " (" + (targetFile.length() / 1024) + " KB)",
                performedBy != null ? performedBy : "ADMIN",
                null
        );

        log.info("Backup {} completed successfully at {}", backupId, targetFile.getAbsolutePath());
        return saved;
    }

    @Transactional
    public BackupRecord verifyBackup(String backupId, String verifiedBy) {
        BackupRecord record = backupRecordRepository.findById(backupId)
                .orElseThrow(() -> new ResourceNotFoundException("BackupRecord", "id", backupId));

        File file = new File(record.getFilePath());
        if (!file.exists()) {
            record.setStatus("FAILED");
            backupRecordRepository.save(record);
            throw new BadRequestException("Backup physical file not found on disk at " + record.getFilePath());
        }

        String currentChecksum = calculateSha256(file);
        if (currentChecksum.equalsIgnoreCase(record.getChecksumSha256())) {
            record.setStatus("VERIFIED");
            record.setVerifiedAt(LocalDateTime.now());
        } else {
            record.setStatus("FAILED");
            log.error("Checksum mismatch for backup {}: recorded={}, current={}", backupId, record.getChecksumSha256(), currentChecksum);
        }

        BackupRecord saved = backupRecordRepository.save(record);

        auditService.recordAudit(
                "BACKUP",
                backupId,
                "ADMIN → VERIFIED BACKUP",
                "status",
                "COMPLETED",
                record.getStatus(),
                "Verified checksum sha256 integrity: " + record.getStatus(),
                verifiedBy != null ? verifiedBy : "ADMIN",
                null
        );

        return saved;
    }

    @Transactional
    public BackupRecord restoreBackup(String backupId, SystemDtos.BackupRestoreRequest request, String restoredBy) {
        if (request.getConfirmationText() == null || !"RESTORE".equalsIgnoreCase(request.getConfirmationText().trim())) {
            throw new BadRequestException("Destructive restore requires explicit confirmation phrase 'RESTORE'");
        }

        BackupRecord record = backupRecordRepository.findById(backupId)
                .orElseThrow(() -> new ResourceNotFoundException("BackupRecord", "id", backupId));

        File file = new File(record.getFilePath());
        if (!file.exists()) {
            throw new BadRequestException("Cannot restore: Physical backup snapshot file not found on disk");
        }

        // Automatic safety snapshot prior to restore
        log.info("Creating pre-restore rollback safety snapshot...");
        try {
            SystemDtos.BackupCreateRequest rollbackReq = new SystemDtos.BackupCreateRequest("PRE_RESTORE_ROLLBACK", "Automatic rollback point created before restoring " + backupId);
            createBackup(rollbackReq, "SYSTEM_SAFETY_ENGINE");
        } catch (Exception e) {
            log.warn("Safety rollback warning: {}", e.getMessage());
        }

        // Execute Restore using psql or JDBC
        String psqlExe = Paths.get(PG_BIN_PATH, "psql.exe").toString();
        boolean restoreSuccess = false;
        if (new File(psqlExe).exists()) {
            try {
                ProcessBuilder pb = new ProcessBuilder(
                        psqlExe,
                        "-U", dbUsername,
                        "-d", "tms_db",
                        "-f", file.getAbsolutePath()
                );
                pb.environment().put("PGPASSWORD", dbPassword);
                Process process = pb.start();
                int exitCode = process.waitFor();
                if (exitCode == 0) {
                    restoreSuccess = true;
                    log.info("Successfully executed psql restore from {}", file.getAbsolutePath());
                } else {
                    log.warn("psql restore returned exit code {}", exitCode);
                }
            } catch (Exception e) {
                log.warn("psql restore execution failed: {}", e.getMessage());
            }
        }

        if (!restoreSuccess) {
            log.info("Restoring via SQL script line execution fallback...");
            try (BufferedReader reader = new BufferedReader(new FileReader(file))) {
                String line;
                StringBuilder statement = new StringBuilder();
                while ((line = reader.readLine()) != null) {
                    line = line.trim();
                    if (line.isEmpty() || line.startsWith("--") || line.startsWith("/*")) continue;
                    statement.append(line).append(" ");
                    if (line.endsWith(";")) {
                        try {
                            jdbcTemplate.execute(statement.toString());
                        } catch (Exception ex) {
                            // ignore conflict or foreign key order issues during line restore
                        }
                        statement.setLength(0);
                    }
                }
                restoreSuccess = true;
            } catch (Exception ex) {
                log.error("Failed to restore SQL script", ex);
                throw new RuntimeException("Restore failed: " + ex.getMessage());
            }
        }

        record.setRestoredAt(LocalDateTime.now());
        record.setStatus("RESTORED");
        BackupRecord saved = backupRecordRepository.save(record);

        auditService.recordAudit(
                "BACKUP",
                backupId,
                "ADMIN → RESTORED BACKUP",
                "restoredAt",
                null,
                record.getRestoredAt().toString(),
                request.getReason() != null ? request.getReason() : "Point-in-time recovery to snapshot " + record.getBackupName(),
                restoredBy != null ? restoredBy : "ADMIN",
                null
        );

        log.warn("DATABASE RESTORE COMPLETED for backup {} by {}", backupId, restoredBy);
        return saved;
    }

    @Transactional
    public void deleteBackup(String backupId, String deletedBy) {
        long count = backupRecordRepository.count();
        if (count <= 1) {
            throw new BadRequestException("Safety rule violation: Cannot delete the only available recovery point. At least one backup must be retained.");
        }

        BackupRecord record = backupRecordRepository.findById(backupId)
                .orElseThrow(() -> new ResourceNotFoundException("BackupRecord", "id", backupId));

        File file = new File(record.getFilePath());
        if (file.exists()) {
            file.delete();
        }

        backupRecordRepository.delete(record);

        auditService.recordAudit(
                "BACKUP",
                backupId,
                "ADMIN → DELETED BACKUP",
                "deleted",
                backupId,
                null,
                "Backup deleted under retention policy",
                deletedBy != null ? deletedBy : "ADMIN",
                null
        );
    }

    @Transactional(readOnly = true)
    public List<BackupRecord> getAllBackups() {
        return backupRecordRepository.findAllByOrderByCreatedAtDesc();
    }

    @Transactional(readOnly = true)
    public List<BackupSchedule> getAllSchedules() {
        return backupScheduleRepository.findAllByOrderByScheduleTypeAsc();
    }

    @Transactional
    public BackupSchedule updateSchedule(String id, SystemDtos.BackupScheduleUpdateRequest request, String performedBy) {
        BackupSchedule schedule = backupScheduleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("BackupSchedule", "id", id));

        if (request.getEnabled() != null) schedule.setEnabled(request.getEnabled());
        if (request.getDayOfWeek() != null) schedule.setDayOfWeek(request.getDayOfWeek());
        if (request.getDayOfMonth() != null) schedule.setDayOfMonth(request.getDayOfMonth());
        if (request.getExecutionTime() != null) schedule.setExecutionTime(request.getExecutionTime());
        if (request.getRetentionCount() != null) schedule.setRetentionCount(request.getRetentionCount());
        if (request.getDestination() != null) schedule.setDestination(request.getDestination());

        schedule.setUpdatedBy(performedBy != null ? performedBy : "ADMIN");
        schedule.setUpdatedAt(LocalDateTime.now());
        BackupSchedule saved = backupScheduleRepository.save(schedule);

        auditService.recordAudit(
                "BACKUP_SCHEDULE",
                id,
                "ADMIN → CHANGED BACKUP SCHEDULE",
                "schedule",
                null,
                "enabled=" + saved.getEnabled() + ", retention=" + saved.getRetentionCount() + ", time=" + saved.getExecutionTime(),
                "Updated schedule configuration for " + id,
                performedBy != null ? performedBy : "ADMIN",
                null
        );

        return saved;
    }

    public File getBackupFile(String backupId) {
        BackupRecord record = backupRecordRepository.findById(backupId)
                .orElseThrow(() -> new ResourceNotFoundException("BackupRecord", "id", backupId));
        File file = new File(record.getFilePath());
        if (!file.exists()) {
            throw new ResourceNotFoundException("BackupFile", "path", record.getFilePath());
        }
        return file;
    }

    private String calculateSha256(File file) {
        try (InputStream is = new FileInputStream(file)) {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] buffer = new byte[8192];
            int read;
            while ((read = is.read(buffer)) > 0) {
                digest.update(buffer, 0, read);
            }
            byte[] hash = digest.digest();
            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) hexString.append('0');
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (Exception e) {
            log.error("Failed to calculate SHA-256 for {}", file.getAbsolutePath(), e);
            return "00000000000000000000000000000000";
        }
    }
}
