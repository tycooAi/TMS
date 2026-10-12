package com.transport.tms.finance.payment.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public class PaymentDto {

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AllocationItemRequest {
        @NotBlank(message = "Invoice ID is required")
        private String invoiceId;

        @NotNull(message = "Allocated amount is required")
        private BigDecimal allocatedAmount;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RecordPaymentRequest {
        private String id;

        @NotNull(message = "Payment date is required")
        private LocalDate date;

        @NotBlank(message = "Customer ID is required")
        private String customerId;

        @NotNull(message = "Payment amount is required")
        private BigDecimal amount;

        @NotBlank(message = "Payment mode is required (CASH, BANK, NEFT, RTGS, CHEQUE, UPI)")
        private String paymentMode;

        private String referenceNumber;

        @NotBlank(message = "Receiving account ID is required")
        private String accountId;

        private String notes;

        private List<AllocationItemRequest> allocations;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ReversePaymentRequest {
        @NotBlank(message = "Reason for reversal is mandatory")
        private String reason;
    }
}
