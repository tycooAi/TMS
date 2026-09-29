package com.transport.tms.governance.system.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "backup_records")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BackupRecord {

    @Id
    @Column(nullable = false, length = 64)
    private String id;

    @Column(nullable = false, length = 255)
    private String backupName;

    @Column(nullable = false, length = 32)
    private String backupType; // MANUAL, PRE_DEPLOYMENT, SCHEDULED_WEEKLY, SCHEDULED_MONTHLY

    @Column(nullable = false, columnDefinition = "TEXT")
    private String filePath;

    @Column(nullable = false)
    @Builder.Default
    private Long fileSizeBytes = 0L;

    @Column(length = 64)
    private String checksumSha256;

    @Column(nullable = false, length = 32)
    @Builder.Default
    private String status = "COMPLETED"; // COMPLETED, FAILED, VERIFIED, RESTORED

    @Column(columnDefinition = "TEXT")
    private String entityCountsJson;

    @Column(nullable = false, length = 128)
    private String createdBy;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    private LocalDateTime verifiedAt;

    private LocalDateTime restoredAt;

    @Column(columnDefinition = "TEXT")
    private String notes;
}
