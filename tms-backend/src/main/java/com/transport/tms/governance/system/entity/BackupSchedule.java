package com.transport.tms.governance.system.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "backup_schedules")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BackupSchedule {

    @Id
    @Column(nullable = false, length = 32)
    private String id; // WEEKLY, MONTHLY

    @Column(nullable = false, length = 32)
    private String scheduleType;

    @Column(nullable = false)
    @Builder.Default
    private Boolean enabled = true;

    @Builder.Default
    private Integer dayOfWeek = 7; // 1 = Monday, 7 = Sunday

    @Builder.Default
    private Integer dayOfMonth = 1; // 1-31

    @Column(length = 16)
    @Builder.Default
    private String executionTime = "02:00";

    @Column(nullable = false)
    @Builder.Default
    private Integer retentionCount = 4;

    @Column(length = 128)
    @Builder.Default
    private String destination = "LOCAL_SNAPSHOT_STORE";

    private LocalDateTime lastRunAt;

    private LocalDateTime nextRunAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    @Column(length = 128)
    @Builder.Default
    private String updatedBy = "SYSTEM";
}
