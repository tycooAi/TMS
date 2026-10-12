package com.transport.tms.finance.invoice.service;

import com.transport.tms.common.exception.Exceptions;
import com.transport.tms.common.util.IdGenerator;
import com.transport.tms.finance.invoice.dto.InvoiceDto;
import com.transport.tms.finance.invoice.entity.Invoice;
import com.transport.tms.finance.invoice.entity.InvoiceItem;
import com.transport.tms.finance.invoice.repository.InvoiceRepository;
import com.transport.tms.finance.ledger.service.LedgerService;
import com.transport.tms.master.customer.entity.Customer;
import com.transport.tms.master.customer.repository.CustomerRepository;
import com.transport.tms.master.customer.service.CustomerService;
import com.transport.tms.security.UserPrincipal;
import com.transport.tms.trip.entity.Trip;
import com.transport.tms.trip.repository.TripRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class InvoiceService {

    private final InvoiceRepository invoiceRepository;
    private final TripRepository tripRepository;
    private final CustomerRepository customerRepository;
    private final CustomerService customerService;
    private final LedgerService ledgerService;
    private final IdGenerator idGenerator;

    @Transactional
    public Invoice generateInvoice(InvoiceDto.GenerateInvoiceRequest request, UserPrincipal currentUser) {
        // 1. Resolve Customer safely (by ID or Name, or ensure record in database)
        Customer customer = null;
        if (request.getCustomerId() != null && !request.getCustomerId().isBlank()) {
            customer = customerRepository.findById(request.getCustomerId()).orElse(null);
        }
        if (customer == null && request.getCustomerName() != null && !request.getCustomerName().isBlank()) {
            List<Customer> search = customerRepository.searchCustomers(request.getCustomerName());
            if (!search.isEmpty()) {
                customer = search.get(0);
            }
        }
        if (customer == null) {
            String custId = (request.getCustomerId() != null && !request.getCustomerId().isBlank())
                    ? request.getCustomerId()
                    : idGenerator.generateCustomerId();
            String custName = (request.getCustomerName() != null && !request.getCustomerName().isBlank())
                    ? request.getCustomerName()
                    : "Customer " + custId;
            String uniqueSuffix = String.format("%06d", Math.abs(custId.hashCode()) % 1000000);
            String phone = "+91 9842" + uniqueSuffix;
            while (customerRepository.existsByPhone(phone)) {
                uniqueSuffix = String.format("%06d", (int)(Math.random() * 900000) + 100000);
                phone = "+91 9842" + uniqueSuffix;
            }

            customer = Customer.builder()
                    .id(custId)
                    .name(custName)
                    .phone(phone)
                    .address(request.getCustomerAddress() != null ? request.getCustomerAddress() : "Project Site Office")
                    .gstin(request.getCustomerGstin())
                    .status("ACTIVE")
                    .openingBalance(BigDecimal.ZERO)
                    .build();
            customer = customerRepository.save(customer);
        }

        String invoiceId = request.getId() != null && !request.getId().trim().isEmpty()
                ? request.getId().trim()
                : idGenerator.generateInvoiceId();

        if (invoiceRepository.existsById(invoiceId)) {
            throw new Exceptions.BadRequestException("Invoice ID '" + invoiceId + "' already exists");
        }

        BigDecimal subtotal = BigDecimal.ZERO;
        List<InvoiceItem> items = new ArrayList<>();

        LocalDate invDate = request.getDate() != null ? request.getDate() : LocalDate.now();
        LocalDate dueDate = request.getDueDate() != null ? request.getDueDate() : invDate.plusDays(30);

        String generatedBy = (currentUser != null && currentUser.getFullName() != null)
                ? currentUser.getFullName()
                : "Accounts Officer";

        String customerGstin = request.getCustomerGstin() != null && !request.getCustomerGstin().isBlank()
                ? request.getCustomerGstin()
                : customer.getGstin();

        Invoice invoice = Invoice.builder()
                .id(invoiceId)
                .date(invDate)
                .dueDate(dueDate)
                .customerId(customer.getId())
                .customerName(customer.getName())
                .customerGstin(customerGstin)
                .taxRate(request.getTaxRate() != null ? request.getTaxRate() : BigDecimal.ZERO)
                .status("GENERATED")
                .notes(request.getNotes())
                .generatedBy(generatedBy)
                .items(new ArrayList<>())
                .build();

        // 2. Process Trip Items if tripIds provided
        if (request.getTripIds() != null && !request.getTripIds().isEmpty()) {
            for (String tripId : request.getTripIds()) {
                if (tripId == null || tripId.isBlank()) continue;
                Trip trip = tripRepository.findById(tripId).orElse(null);
                if (trip == null) {
                    continue;
                }

                if (trip.getInvoiceId() != null && !trip.getInvoiceId().isBlank()) {
                    throw new Exceptions.BadRequestException("Trip " + tripId + " is already billed under Invoice " + trip.getInvoiceId());
                }

                BigDecimal amount = trip.getTotalAmount();
                if (amount == null) {
                    BigDecimal qty = trip.getQuantity() != null ? trip.getQuantity() : BigDecimal.ZERO;
                    BigDecimal rate = trip.getAppliedRate() != null ? trip.getAppliedRate() : BigDecimal.ZERO;
                    amount = qty.multiply(rate);
                }
                subtotal = subtotal.add(amount);

                InvoiceItem item = InvoiceItem.builder()
                        .invoice(invoice)
                        .tripId(trip.getId())
                        .tripDate(trip.getDate() != null ? trip.getDate() : invDate)
                        .vehicle(trip.getVehicleRegistration() != null ? trip.getVehicleRegistration() : "Fleet Truck")
                        .material(trip.getMaterial() != null ? trip.getMaterial() : "Transportation Service")
                        .quantity(trip.getQuantity() != null ? trip.getQuantity() : BigDecimal.ONE)
                        .unit(trip.getUnit() != null ? trip.getUnit() : "Ton")
                        .rate(trip.getAppliedRate() != null ? trip.getAppliedRate() : amount)
                        .amount(amount)
                        .build();

                items.add(item);

                // Link trip to this invoice
                trip.setInvoiceId(invoiceId);
                tripRepository.save(trip);
            }
        }

        // 3. Process Manual Line Items if provided
        if (request.getManualItems() != null && !request.getManualItems().isEmpty()) {
            int itemIndex = 1;
            for (InvoiceDto.ManualItemRequest mi : request.getManualItems()) {
                if (mi == null) continue;
                BigDecimal qty = mi.getQuantity() != null ? mi.getQuantity() : BigDecimal.ONE;
                BigDecimal rate = mi.getRate() != null ? mi.getRate() : BigDecimal.ZERO;
                BigDecimal itemAmt = mi.getAmount() != null ? mi.getAmount() : qty.multiply(rate);

                subtotal = subtotal.add(itemAmt);

                String directRef = (mi.getTripId() != null && !mi.getTripId().isBlank())
                        ? mi.getTripId()
                        : "ITEM-" + String.format("%03d", itemIndex++);

                InvoiceItem item = InvoiceItem.builder()
                        .invoice(invoice)
                        .tripId(directRef)
                        .tripDate(mi.getDate() != null ? mi.getDate() : invDate)
                        .vehicle(mi.getVehicle() != null ? mi.getVehicle() : "Fleet Direct")
                        .material(mi.getDescription() != null ? mi.getDescription() : "Freight & Transport Service")
                        .quantity(qty)
                        .unit(mi.getUnit() != null ? mi.getUnit() : "Ton")
                        .rate(rate)
                        .amount(itemAmt)
                        .build();

                items.add(item);
            }
        }

        if (items.isEmpty()) {
            throw new Exceptions.BadRequestException("Cannot generate invoice: please select at least one trip or add a direct billing line item.");
        }

        BigDecimal taxRate = invoice.getTaxRate();
        BigDecimal taxAmount = subtotal.multiply(taxRate).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
        BigDecimal totalAmount = subtotal.add(taxAmount);

        invoice.setSubtotal(subtotal);
        invoice.setTaxAmount(taxAmount);
        invoice.setTotalAmount(totalAmount);
        invoice.setBalanceAmount(totalAmount);
        invoice.setPaidAmount(BigDecimal.ZERO);
        invoice.setItems(items);

        Invoice saved = invoiceRepository.save(invoice);

        // Record Receivable entry in Central Ledger
        ledgerService.recordReceivable(saved, invoice.getGeneratedBy());

        return saved;
    }

    @Transactional(readOnly = true)
    public List<Invoice> getAllInvoices() {
        return invoiceRepository.findAll();
    }

    @Transactional(readOnly = true)
    public List<Invoice> getInvoicesByCustomer(String customerId) {
        return invoiceRepository.findByCustomerIdOrderByDateDesc(customerId);
    }

    @Transactional(readOnly = true)
    public Invoice getInvoiceById(String id) {
        return invoiceRepository.findById(id)
                .orElseThrow(() -> new Exceptions.ResourceNotFoundException("Invoice", "id", id));
    }

    @Transactional
    public Invoice updateInvoiceStatus(String id, String status) {
        Invoice invoice = getInvoiceById(id);
        invoice.setStatus(status);
        return invoiceRepository.save(invoice);
    }

    @Transactional
    public Invoice cancelInvoice(String id, String reason, UserPrincipal currentUser) {
        Invoice invoice = getInvoiceById(id);
        if ("CANCELLED".equalsIgnoreCase(invoice.getStatus())) {
            return invoice; // Idempotent return
        }
        if ("PAID".equalsIgnoreCase(invoice.getStatus())) {
            throw new Exceptions.BadRequestException("Cannot cancel paid invoice " + id + ". Please reverse payments first.");
        }

        // Unlink associated trips
        if (invoice.getItems() != null) {
            for (InvoiceItem item : invoice.getItems()) {
                if (item.getTripId() != null && item.getTripId().startsWith("TRIP-")) {
                    tripRepository.findById(item.getTripId()).ifPresent(trip -> {
                        trip.setInvoiceId(null);
                        tripRepository.save(trip);
                    });
                }
            }
        }

        invoice.setStatus("CANCELLED");
        Invoice saved = invoiceRepository.save(invoice);

        String performedBy = currentUser != null ? currentUser.getFullName() : "Accounts Admin";
        ledgerService.recordExpense(
                "CUSTOMER",
                invoice.getCustomerId(),
                invoice.getCustomerName(),
                "INVOICE_CANCELLATION",
                invoice.getTotalAmount(),
                "REVERSAL",
                invoice.getId(),
                "Invoice Cancelled: " + (reason != null ? reason : "Administrative cancellation"),
                performedBy
        );

        return saved;
    }
}
