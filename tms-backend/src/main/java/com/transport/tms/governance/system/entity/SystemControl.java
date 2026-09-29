package com.transport.tms.governance.system.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "system_control")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SystemControl {

    @Id
    @Column(nullable = false)
    private Integer id;

    @Column(nullable = false, length = 32)
    @Builder.Default
    private String systemState = "ONLINE"; // ONLINE, MAINTENANCE, SHUTDOWN

    @Column(length = 255)
    private String maintenanceTitle;

    @Column(columnDefinition = "TEXT")
    private String maintenanceMessage;

    private LocalDateTime expectedRecoveryTime;

    @Column(columnDefinition = "TEXT")
    private String shutdownReason;

    @Column(length = 128)
    private String shutdownBy;

    private LocalDateTime shutdownAt;

    @Builder.Default
    private Boolean allowAdminBypass = true;

    @Builder.Default
    private Boolean allowWorkerTrips = true;

    @Builder.Default
    private Boolean allowAccountsPayments = true;

    @Builder.Default
    private Boolean lockSensitiveOps = false;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    @Column(length = 128)
    private String updatedBy;
}
