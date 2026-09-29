package com.transport.tms.trip.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public class TripDto {

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CreateTripRequest {
        @NotNull(message = "Trip date is required")
        private LocalDate date;

        @NotBlank(message = "Customer ID is required")
        private String customerId;

        @NotBlank(message = "Vehicle registration is required")
        private String vehicleRegistration;

        @NotBlank(message = "Driver ID is required")
        private String driverId;

        @NotBlank(message = "Material is required")
        private String material;

        @NotNull(message = "Quantity is required")
        private BigDecimal quantity;

        private String unit;

        @NotBlank(message = "Source is required")
        private String source;

        private String sourceBillNo;

        @NotBlank(message = "Loading location is required")
        private String loadingLocation;

        @NotBlank(message = "Delivery location is required")
        private String deliveryLocation;

        private LocalDateTime loadingDateTime;
        private LocalDateTime departureDateTime;
        private LocalDateTime deliveryDateTime;

        private BigDecimal unloadQuantity;
        private String unloadUnit;
        private BigDecimal shortage;
        private BigDecimal openingKm;
        private BigDecimal closingKm;
        private BigDecimal tripKm;

        private Boolean isNoLoad;
        private String noLoadReason;
        private String notes;
        private String deliveryProof;
        private String status;

        private BigDecimal billingRate;
        private BigDecimal transportRate;
        private BigDecimal purchaseRate;
        private BigDecimal perKmRate;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class FullTripDto {
        private String id;
        private LocalDate date;
        private String customerId;
        private String customerName;
        private String customerPhone;
        private String vehicleRegistration;
        private String vehicleOwnership;
        private String driverId;
        private String driverName;
        private String driverPhone;
        private String material;
        private BigDecimal quantity;
        private String unit;
        private String source;
        private String sourceBillNo;
        private String loadingLocation;
        private String deliveryLocation;
        private LocalDateTime loadingDateTime;
        private LocalDateTime departureDateTime;
        private LocalDateTime deliveryDateTime;
        private BigDecimal unloadQuantity;
        private String unloadUnit;
        private BigDecimal shortage;
        private BigDecimal openingKm;
        private BigDecimal closingKm;
        private BigDecimal tripKm;
        // Financial fields
        private BigDecimal appliedRate;
        private BigDecimal billingRate;
        private BigDecimal transportRate;
        private BigDecimal purchaseRate;
        private BigDecimal perKmRate;
        private String rateUnit;
        private BigDecimal totalAmount;
        private String status;
        private Integer progress;
        private Boolean isNoLoad;
        private String noLoadReason;
        private String enteredBy;
        private String notes;
        private String deliveryProof;
        private String invoiceId;
        private Long version;
        private LocalDateTime createdAt;
    }

    // STRICT ZERO FINANCIAL EXPOSURE FOR WORKERS
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class WorkerTripDto {
        private String id;
        private LocalDate date;
        private String customerId;
        private String customerName;
        private String customerPhone;
        private String vehicleRegistration;
        private String vehicleOwnership;
        private String driverId;
        private String driverName;
        private String driverPhone;
        private String material;
        private BigDecimal quantity;
        private String unit;
        private String source;
        private String sourceBillNo;
        private String loadingLocation;
        private String deliveryLocation;
        private LocalDateTime loadingDateTime;
        private LocalDateTime departureDateTime;
        private LocalDateTime deliveryDateTime;
        private BigDecimal unloadQuantity;
        private String unloadUnit;
        private BigDecimal shortage;
        private BigDecimal openingKm;
        private BigDecimal closingKm;
        private BigDecimal tripKm;
        private String status;
        private Integer progress;
        private Boolean isNoLoad;
        private String noLoadReason;
        private String enteredBy;
        private String notes;
        private String deliveryProof;
        private BigDecimal billingRate;
        private BigDecimal transportRate;
        private BigDecimal purchaseRate;
        private BigDecimal perKmRate;
        private BigDecimal appliedRate;
        private LocalDateTime createdAt;
    }
}
