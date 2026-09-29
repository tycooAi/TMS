package com.transport.tms.governance.system.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "system_feature_flags")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FeatureFlag {

    @Id
    @Column(nullable = false, length = 64)
    private String flagKey;

    @Column(nullable = false, length = 128)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(length = 64)
    @Builder.Default
    private String category = "OPERATIONS";

    @Column(nullable = false)
    @Builder.Default
    private Boolean enabled = true;

    @Column(length = 128)
    private String updatedBy;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}
