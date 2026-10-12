package com.transport.tms.finance.payment.service;

import com.transport.tms.common.exception.Exceptions;
import com.transport.tms.common.util.IdGenerator;
import com.transport.tms.finance.cashbank.service.CashBankService;
import com.transport.tms.finance.invoice.entity.Invoice;
import com.transport.tms.finance.invoice.repository.InvoiceRepository;
import com.transport.tms.finance.ledger.service.LedgerService;
import com.transport.tms.finance.payment.dto.PaymentDto;
import com.transport.tms.finance.payment.entity.Payment;
import com.transport.tms.finance.payment.entity.PaymentAllocation;
import com.transport.tms.finance.payment.repository.PaymentAllocationRepository;
import com.transport.tms.finance.payment.repository.PaymentRepository;
import com.transport.tms.governance.audit.service.AuditService;
import com.transport.tms.master.customer.entity.Customer;
import com.transport.tms.master.customer.service.CustomerService;
import com.transport.tms.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final PaymentAllocationRepository allocationRepository;
    private final InvoiceRepository invoiceRepository;
    private final CustomerService customerService;
    private final CashBankService cashBankService;
    private final LedgerService ledgerService;
    private final AuditService auditService;
    private final IdGenerator idGenerator;

    @Transactional
    public Payment recordPayment(PaymentDto.RecordPaymentRequest request, UserPrincipal currentUser) {
        Customer customer = customerService.getCustomerById(request.getCustomerId());

        String paymentId = request.getId() != null && !request.getId().trim().isEmpty()
                ? request.getId().trim()
                : idGenerator.generatePaymentId();

        if (paymentRepository.existsById(paymentId)) {
            throw new Exceptions.BadRequestException("Payment ID '" + paymentId + "' already exists");
        }

        Payment payment = Payment.builder()
                .id(paymentId)
                .date(request.getDate())
                .customerId(customer.getId())
                .customerName(customer.getName())
                .amount(request.getAmount())
                .paymentMode(request.getPaymentMode())
                .referenceNumber(request.getReferenceNumber())
                .accountId(request.getAccountId())
                .status("POSTED")
                .notes(request.getNotes())
                .receivedBy(currentUser.getFullName())
                .allocations(new ArrayList<>())
                .build();

        Payment saved = paymentRepository.save(payment);

        // Process invoice allocations
        if (request.getAllocations() != null && !request.getAllocations().isEmpty()) {
            for (PaymentDto.AllocationItemRequest allocReq : request.getAllocations()) {
                Invoice invoice = invoiceRepository.findById(allocReq.getInvoiceId())
                        .orElseThrow(() -> new Exceptions.ResourceNotFoundException("Invoice", "id", allocReq.getInvoiceId()));

                BigDecimal newPaid = invoice.getPaidAmount().add(allocReq.getAllocatedAmount());
                BigDecimal newBalance = invoice.getTotalAmount().subtract(newPaid);

                invoice.setPaidAmount(newPaid);
                invoice.setBalanceAmount(newBalance.max(BigDecimal.ZERO));

                if (newBalance.compareTo(BigDecimal.ZERO) <= 0) {
                    invoice.setStatus("PAID");
                } else {
                    invoice.setStatus("PARTIALLY_PAID");
                }

                invoiceRepository.save(invoice);

                PaymentAllocation allocation = PaymentAllocation.builder()
                        .payment(saved)
                        .invoiceId(invoice.getId())
                        .allocatedAmount(allocReq.getAllocatedAmount())
                        .build();

                saved.getAllocations().add(allocation);
            }
            saved = paymentRepository.save(saved);
        }

        // Credit the receiving Cash/Bank Account
        cashBankService.creditAccount(request.getAccountId(), request.getAmount());

        // Record in Central Ledger
        ledgerService.recordCustomerPayment(saved, currentUser.getFullName());

        return saved;
    }

    @Transactional
    public Payment reversePayment(String paymentId, String reason, UserPrincipal currentUser) {
        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new Exceptions.ResourceNotFoundException("Payment", "id", paymentId));

        if ("REVERSED".equalsIgnoreCase(payment.getStatus())) {
            throw new Exceptions.BadRequestException("Payment " + paymentId + " is already reversed!");
        }

        // Revert invoice allocations
        List<PaymentAllocation> allocations = allocationRepository.findByPaymentId(paymentId);
        for (PaymentAllocation alloc : allocations) {
            Invoice invoice = invoiceRepository.findById(alloc.getInvoiceId()).orElse(null);
            if (invoice != null) {
                BigDecimal newPaid = invoice.getPaidAmount().subtract(alloc.getAllocatedAmount()).max(BigDecimal.ZERO);
                BigDecimal newBalance = invoice.getTotalAmount().subtract(newPaid);

                invoice.setPaidAmount(newPaid);
                invoice.setBalanceAmount(newBalance);
                invoice.setStatus(newPaid.compareTo(BigDecimal.ZERO) == 0 ? "GENERATED" : "PARTIALLY_PAID");

                invoiceRepository.save(invoice);
            }
        }

        // Debit the bank/cash account back
        cashBankService.debitAccount(payment.getAccountId(), payment.getAmount());

        // Update payment status
        payment.setStatus("REVERSED");
        Payment saved = paymentRepository.save(payment);

        // Record audit
        auditService.recordAudit(
                "PAYMENT",
                paymentId,
                "REVERSE",
                "status",
                "POSTED",
                "REVERSED",
                reason,
                currentUser.getFullName(),
                null
        );

        return saved;
    }

    @Transactional(readOnly = true)
    public List<Payment> getAllPayments() {
        return paymentRepository.findAllByOrderByDateDesc();
    }

    @Transactional(readOnly = true)
    public List<Payment> getPaymentsByCustomer(String customerId) {
        return paymentRepository.findByCustomerIdOrderByDateDesc(customerId);
    }

    @Transactional(readOnly = true)
    public Payment getPaymentById(String paymentId) {
        return paymentRepository.findById(paymentId)
                .orElseThrow(() -> new Exceptions.ResourceNotFoundException("Payment", "id", paymentId));
    }
}
