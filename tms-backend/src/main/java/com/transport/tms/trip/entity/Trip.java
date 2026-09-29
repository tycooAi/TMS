package com.transport.tms.trip.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "trips")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Trip {

    @Id
    @Column(length = 32)
    private String id; // e.g. TRP-01483

    @Column(nullable = false)
    private LocalDate date;

    @Column(nullable = false, length = 32)
    private String customerId;

    @Column(nullable = false, length = 128)
    private String customerName;

    @Column(nullable = false, length = 32)
    private String customerPhone;

    @Column(nullable = false, length = 32)
    private String vehicleRegistration;

    @Column(nullable = false, length = 32)
    @Builder.Default
    private String vehicleOwnership = "OWN";

    @Column(nullable = false, length = 32)
    private String driverId;

    @Column(nullable = false, length = 128)
    private String driverName;

    @Column(nullable = false, length = 32)
    private String driverPhone;

    @Column(nullable = false, length = 128)
    private String material;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal quantity;

    @Column(nullable = false, length = 32)
    @Builder.Default
    private String unit = "Ton";

    @Column(nullable = false, length = 128)
    private String source;

    @Column(length = 64)
    private String sourceBillNo;

    @Column(nullable = false, length = 128)
    private String loadingLocation;

    @Column(nullable = false, length = 128)
    private String deliveryLocation;

    private LocalDateTime loadingDateTime;
    private LocalDateTime departureDateTime;
    private LocalDateTime deliveryDateTime;

    @Column(precision = 12, scale = 2)
    private BigDecimal unloadQuantity;

    @Column(length = 32)
    private String unloadUnit;

    @Column(precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal shortage = BigDecimal.ZERO;

    @Column(precision = 12, scale = 2)
    private BigDecimal openingKm;

    @Column(precision = 12, scale = 2)
    private BigDecimal closingKm;

    @Column(precision = 12, scale = 2)
    private BigDecimal tripKm;

    // Rate frozen at time of creation (Historical Rate Preservation)
    @Column(nullable = false, precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal appliedRate = BigDecimal.ZERO;

    @Column(precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal billingRate = BigDecimal.ZERO;

    @Column(precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal transportRate = BigDecimal.ZERO;

    @Column(precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal purchaseRate = BigDecimal.ZERO;

    @Column(precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal perKmRate = BigDecimal.ZERO;

    @Column(nullable = false, length = 32)
    @Builder.Default
    private String rateUnit = "Ton";

    @Column(nullable = false, precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal totalAmount = BigDecimal.ZERO; // quantity * appliedRate (Worker cannot view this)

    @Column(nullable = false, length = 32)
    @Builder.Default
    private String status = "DELIVERED"; // NO_LOAD, DRAFT, SUBMITTED, ASSIGNED, LOADED, RUNNING, DELIVERED, PAYMENT_PENDING, COMPLETED, CANCELLED

    @Column(nullable = false)
    @Builder.Default
    private Integer progress = 7;

    @Column(nullable = false)
    @Builder.Default
    private Boolean isNoLoad = false;

    private String noLoadReason;

    @Column(nullable = false, length = 128)
    private String enteredBy;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(columnDefinition = "TEXT")
    private String deliveryProof;

    @Column(length = 32)
    private String invoiceId;

    @Version
    @Column(nullable = false)
    private Long version;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(nullable = false)
    private LocalDateTime updatedAt;
}
