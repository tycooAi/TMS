package com.transport.tms.finance.invoice.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public class InvoiceDto {

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ManualItemRequest {
        private String tripId;
        private String description;
        private String vehicle;
        private BigDecimal quantity;
        private String unit;
        private BigDecimal rate;
        private BigDecimal amount;
        private LocalDate date;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class GenerateInvoiceRequest {
        private String id;

        @NotNull(message = "Invoice date is required")
        private LocalDate date;

        private LocalDate dueDate;

        @NotBlank(message = "Customer ID is required")
        private String customerId;

        private String customerName;

        private String customerAddress;

        private String customerGstin;

        private BigDecimal taxRate; // e.g. 5.00 for 5% GTA or 18.00

        private List<String> tripIds;

        private List<ManualItemRequest> manualItems;

        private String notes;
    }
}
