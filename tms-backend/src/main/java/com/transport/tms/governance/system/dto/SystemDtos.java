package com.transport.tms.governance.system.dto;

import com.transport.tms.governance.system.entity.BackupRecord;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.Map;

public class SystemDtos {

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SystemStateChangeRequest {
        private String systemState; // ONLINE, MAINTENANCE, SHUTDOWN
        private String confirmationText; // "SHUTDOWN" required for shutdown
        private String reason;
        private String maintenanceTitle;
        private String maintenanceMessage;
        private LocalDateTime expectedRecoveryTime;
        private Boolean allowAdminBypass;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class EmergencyToggleRequest {
        private Boolean allowWorkerTrips;
        private Boolean allowAccountsPayments;
        private Boolean lockSensitiveOps;
        private String reason;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class BackupCreateRequest {
        private String backupType; // MANUAL, PRE_DEPLOYMENT, SCHEDULED_WEEKLY, SCHEDULED_MONTHLY
        private String notes;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class BackupRestoreRequest {
        private String confirmationText; // "RESTORE" required
        private String reason;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SystemHealthDto {
        private String backendStatus;
        private String databaseStatus;
        private String apiStatus;
        private String backupStatus;
        private String storageStatus;
        private String auditStatus;
        private String systemState;
        private String environment;
        private String appVersion;
        private String dbVersion;
        private String activeDbPool;
        private String jvmMemory;
        private Long uptimeSeconds;
        private Map<String, Long> tableCounts;
        private Long totalBackups;
        private BackupRecord lastBackup;
        private LocalDateTime lastRecovery;
        private Integer activeSessionsCount;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class BackupScheduleUpdateRequest {
        private Boolean enabled;
        private Integer dayOfWeek;
        private Integer dayOfMonth;
        private String executionTime;
        private Integer retentionCount;
        private String destination;
    }
}
