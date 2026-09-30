package com.transport.tms.trip.service;

import com.transport.tms.common.exception.Exceptions;
import com.transport.tms.common.util.IdGenerator;
import com.transport.tms.master.customer.entity.Customer;
import com.transport.tms.master.customer.service.CustomerService;
import com.transport.tms.master.driver.entity.Driver;
import com.transport.tms.master.driver.service.DriverService;
import com.transport.tms.master.rate.service.RateCardService;
import com.transport.tms.master.vehicle.entity.Vehicle;
import com.transport.tms.master.vehicle.service.VehicleService;
import com.transport.tms.security.UserPrincipal;
import com.transport.tms.trip.dto.TripDto;
import com.transport.tms.trip.entity.Trip;
import com.transport.tms.trip.entity.TripStatusHistory;
import com.transport.tms.trip.repository.TripRepository;
import com.transport.tms.trip.repository.TripStatusHistoryRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class TripService {

    private final TripRepository tripRepository;
    private final TripStatusHistoryRepository historyRepository;
    private final CustomerService customerService;
    private final VehicleService vehicleService;
    private final DriverService driverService;
    private final RateCardService rateCardService;
    private final IdGenerator idGenerator;

    @Transactional
    public Object createTrip(TripDto.CreateTripRequest request, UserPrincipal currentUser) {
        Customer customer = customerService.getCustomerById(request.getCustomerId());
        Vehicle vehicle = vehicleService.getVehicleByRegistration(request.getVehicleRegistration());
        Driver driver = driverService.getDriverById(request.getDriverId());

        boolean isNoLoad = Boolean.TRUE.equals(request.getIsNoLoad());

        BigDecimal appliedRate = BigDecimal.ZERO;
        BigDecimal totalAmount = BigDecimal.ZERO;
        BigDecimal billingRate = request.getBillingRate() != null ? request.getBillingRate() : BigDecimal.ZERO;
        BigDecimal transportRate = request.getTransportRate() != null ? request.getTransportRate() : BigDecimal.ZERO;
        BigDecimal purchaseRate = request.getPurchaseRate() != null ? request.getPurchaseRate() : BigDecimal.ZERO;
        BigDecimal perKmRate = request.getPerKmRate() != null ? request.getPerKmRate() : BigDecimal.ZERO;

        if (!isNoLoad) {
            if (request.getQuantity() == null || request.getQuantity().compareTo(BigDecimal.ZERO) <= 0) {
                throw new Exceptions.BadRequestException("Quantity must be greater than zero for loaded trips");
            }
            if (billingRate.compareTo(BigDecimal.ZERO) > 0) {
                appliedRate = billingRate;
            } else {
                appliedRate = rateCardService.resolveRate(
                        customer.getId(),
                        request.getMaterial(),
                        request.getLoadingLocation(),
                        request.getDeliveryLocation()
                );
                billingRate = appliedRate;
            }
            totalAmount = request.getQuantity().multiply(appliedRate);
        }

        String tripId = idGenerator.generateTripId();

        Trip trip = Trip.builder()
                .id(tripId)
                .date(request.getDate())
                .customerId(customer.getId())
                .customerName(customer.getName())
                .customerPhone(customer.getPhone())
                .vehicleRegistration(vehicle.getRegistration())
                .vehicleOwnership(vehicle.getOwnership())
                .driverId(driver.getId())
                .driverName(driver.getName())
                .driverPhone(driver.getPhone())
                .material(request.getMaterial())
                .quantity(request.getQuantity())
                .unit(request.getUnit() != null ? request.getUnit() : "Ton")
                .source(request.getSource())
                .sourceBillNo(request.getSourceBillNo())
                .loadingLocation(request.getLoadingLocation())
                .deliveryLocation(request.getDeliveryLocation())
                .loadingDateTime(request.getLoadingDateTime())
                .departureDateTime(request.getDepartureDateTime())
                .deliveryDateTime(request.getDeliveryDateTime())
                .unloadQuantity(request.getUnloadQuantity())
                .unloadUnit(request.getUnloadUnit())
                .shortage(request.getShortage() != null ? request.getShortage() : BigDecimal.ZERO)
                .openingKm(request.getOpeningKm())
                .closingKm(request.getClosingKm())
                .tripKm(request.getTripKm())
                .appliedRate(appliedRate)
                .billingRate(billingRate)
                .transportRate(transportRate)
                .purchaseRate(purchaseRate)
                .perKmRate(perKmRate)
                .rateUnit(request.getUnit() != null ? request.getUnit() : "Ton")
                .totalAmount(totalAmount)
                .status(isNoLoad ? "NO_LOAD" : (request.getStatus() != null && !request.getStatus().isBlank() ? request.getStatus() : "RUNNING"))
                .progress(isNoLoad ? 7 : 5)
                .isNoLoad(isNoLoad)
                .noLoadReason(request.getNoLoadReason())
                .enteredBy(currentUser.getFullName())
                .notes(request.getNotes())
                .deliveryProof(request.getDeliveryProof())
                .build();

        Trip saved = tripRepository.save(trip);

        // Record initial status history
        historyRepository.save(TripStatusHistory.builder()
                .tripId(tripId)
                .oldStatus(null)
                .newStatus("DELIVERED")
                .changedBy(currentUser.getFullName())
                .comment("Trip created and recorded")
                .build());

        // Worker role receives sanitized DTO with zero financial data
        if ("WORKER".equalsIgnoreCase(currentUser.getRoleName())) {
            return mapToWorkerDto(saved);
        }
        return mapToFullDto(saved);
    }

    @Transactional(readOnly = true)
    public List<?> getAllTrips(UserPrincipal currentUser) {
        List<Trip> trips = tripRepository.findAll();
        if ("WORKER".equalsIgnoreCase(currentUser.getRoleName())) {
            return trips.stream().map(this::mapToWorkerDto).collect(Collectors.toList());
        }
        return trips.stream().map(this::mapToFullDto).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Object getTripById(String id, UserPrincipal currentUser) {
        Trip trip = tripRepository.findById(id)
                .orElseThrow(() -> new Exceptions.ResourceNotFoundException("Trip", "id", id));

        if ("WORKER".equalsIgnoreCase(currentUser.getRoleName())) {
            return mapToWorkerDto(trip);
        }
        return mapToFullDto(trip);
    }

    @Transactional(readOnly = true)
    public List<Trip> getUnbilledTrips(String customerId) {
        if (customerId != null && !customerId.isBlank()) {
            return tripRepository.findUnbilledTripsByCustomer(customerId);
        }
        return tripRepository.findAllUnbilledTrips();
    }

    @Transactional
    public Trip updateTripStatus(String id, String newStatus, String comment, UserPrincipal currentUser) {
        Trip trip = tripRepository.findById(id)
                .orElseThrow(() -> new Exceptions.ResourceNotFoundException("Trip", "id", id));

        String oldStatus = trip.getStatus();
        trip.setStatus(newStatus);
        Trip saved = tripRepository.save(trip);

        historyRepository.save(TripStatusHistory.builder()
                .tripId(id)
                .oldStatus(oldStatus)
                .newStatus(newStatus)
                .changedBy(currentUser.getFullName())
                .comment(comment)
                .build());

        return saved;
    }

    @Transactional
    public Object updateTrip(String id, TripDto.CreateTripRequest request, UserPrincipal currentUser) {
        Trip trip = tripRepository.findById(id)
                .orElseThrow(() -> new Exceptions.ResourceNotFoundException("Trip", "id", id));

        if (trip.getInvoiceId() != null && !trip.getInvoiceId().isBlank()) {
            throw new Exceptions.BadRequestException("Cannot edit trip " + id + " because it is already billed under invoice " + trip.getInvoiceId());
        }

        if (request.getCustomerId() != null && !request.getCustomerId().isBlank()) {
            Customer customer = customerService.getCustomerById(request.getCustomerId());
            trip.setCustomerId(customer.getId());
            trip.setCustomerName(customer.getName());
            trip.setCustomerPhone(customer.getPhone());
        }

        if (request.getVehicleRegistration() != null && !request.getVehicleRegistration().isBlank()) {
            Vehicle vehicle = vehicleService.getVehicleByRegistration(request.getVehicleRegistration());
            trip.setVehicleRegistration(vehicle.getRegistration());
            trip.setVehicleOwnership(vehicle.getOwnership());
        }

        if (request.getDriverId() != null && !request.getDriverId().isBlank()) {
            Driver driver = driverService.getDriverById(request.getDriverId());
            trip.setDriverId(driver.getId());
            trip.setDriverName(driver.getName());
            trip.setDriverPhone(driver.getPhone());
        }

        if (request.getDate() != null) trip.setDate(request.getDate());
        if (request.getMaterial() != null) trip.setMaterial(request.getMaterial());
        if (request.getQuantity() != null) trip.setQuantity(request.getQuantity());
        if (request.getUnit() != null) trip.setUnit(request.getUnit());
        if (request.getSource() != null) trip.setSource(request.getSource());
        if (request.getSourceBillNo() != null) trip.setSourceBillNo(request.getSourceBillNo());
        if (request.getLoadingLocation() != null) trip.setLoadingLocation(request.getLoadingLocation());
        if (request.getDeliveryLocation() != null) trip.setDeliveryLocation(request.getDeliveryLocation());
        if (request.getNotes() != null) trip.setNotes(request.getNotes());
        if (request.getOpeningKm() != null) trip.setOpeningKm(request.getOpeningKm());
        if (request.getClosingKm() != null) trip.setClosingKm(request.getClosingKm());
        if (request.getTripKm() != null) trip.setTripKm(request.getTripKm());
        if (request.getUnloadQuantity() != null) trip.setUnloadQuantity(request.getUnloadQuantity());
        if (request.getUnloadUnit() != null) trip.setUnloadUnit(request.getUnloadUnit());
        if (request.getShortage() != null) trip.setShortage(request.getShortage());
        if (request.getLoadingDateTime() != null) trip.setLoadingDateTime(request.getLoadingDateTime());
        if (request.getDepartureDateTime() != null) trip.setDepartureDateTime(request.getDepartureDateTime());
        if (request.getDeliveryDateTime() != null) trip.setDeliveryDateTime(request.getDeliveryDateTime());
        if (request.getDeliveryProof() != null) trip.setDeliveryProof(request.getDeliveryProof());

        if (request.getBillingRate() != null) trip.setBillingRate(request.getBillingRate());
        if (request.getTransportRate() != null) trip.setTransportRate(request.getTransportRate());
        if (request.getPurchaseRate() != null) trip.setPurchaseRate(request.getPurchaseRate());
        if (request.getPerKmRate() != null) trip.setPerKmRate(request.getPerKmRate());

        boolean isNoLoad = Boolean.TRUE.equals(request.getIsNoLoad());
        trip.setIsNoLoad(isNoLoad);
        trip.setNoLoadReason(request.getNoLoadReason());

        if (!isNoLoad) {
            BigDecimal effectiveBilling = trip.getBillingRate() != null && trip.getBillingRate().compareTo(BigDecimal.ZERO) > 0
                    ? trip.getBillingRate()
                    : rateCardService.resolveRate(
                            trip.getCustomerId(),
                            trip.getMaterial(),
                            trip.getLoadingLocation(),
                            trip.getDeliveryLocation()
                    );
            trip.setAppliedRate(effectiveBilling);
            if (trip.getBillingRate() == null || trip.getBillingRate().compareTo(BigDecimal.ZERO) == 0) {
                trip.setBillingRate(effectiveBilling);
            }
            if (trip.getQuantity() != null) {
                trip.setTotalAmount(trip.getQuantity().multiply(effectiveBilling));
            }
        } else {
            trip.setAppliedRate(BigDecimal.ZERO);
            trip.setTotalAmount(BigDecimal.ZERO);
        }

        Trip saved = tripRepository.save(trip);
        if ("WORKER".equalsIgnoreCase(currentUser.getRoleName())) {
            return mapToWorkerDto(saved);
        }
        return mapToFullDto(saved);
    }

    @Transactional
    public void deleteTrip(String id) {
        Trip trip = tripRepository.findById(id)
                .orElseThrow(() -> new Exceptions.ResourceNotFoundException("Trip", "id", id));
        if (trip.getInvoiceId() != null && !trip.getInvoiceId().isBlank()) {
            throw new Exceptions.BadRequestException("Cannot delete trip " + id + " because it is already billed under invoice " + trip.getInvoiceId());
        }
        tripRepository.delete(trip);
    }

    public TripDto.FullTripDto mapToFullDto(Trip trip) {
        return TripDto.FullTripDto.builder()
                .id(trip.getId())
                .date(trip.getDate())
                .customerId(trip.getCustomerId())
                .customerName(trip.getCustomerName())
                .customerPhone(trip.getCustomerPhone())
                .vehicleRegistration(trip.getVehicleRegistration())
                .vehicleOwnership(trip.getVehicleOwnership())
                .driverId(trip.getDriverId())
                .driverName(trip.getDriverName())
                .driverPhone(trip.getDriverPhone())
                .material(trip.getMaterial())
                .quantity(trip.getQuantity())
                .unit(trip.getUnit())
                .source(trip.getSource())
                .sourceBillNo(trip.getSourceBillNo())
                .loadingLocation(trip.getLoadingLocation())
                .deliveryLocation(trip.getDeliveryLocation())
                .loadingDateTime(trip.getLoadingDateTime())
                .departureDateTime(trip.getDepartureDateTime())
                .deliveryDateTime(trip.getDeliveryDateTime())
                .unloadQuantity(trip.getUnloadQuantity())
                .unloadUnit(trip.getUnloadUnit())
                .shortage(trip.getShortage())
                .openingKm(trip.getOpeningKm())
                .closingKm(trip.getClosingKm())
                .tripKm(trip.getTripKm())
                .appliedRate(trip.getAppliedRate())
                .billingRate(trip.getBillingRate())
                .transportRate(trip.getTransportRate())
                .purchaseRate(trip.getPurchaseRate())
                .perKmRate(trip.getPerKmRate())
                .rateUnit(trip.getRateUnit())
                .totalAmount(trip.getTotalAmount())
                .status(trip.getStatus())
                .progress(trip.getProgress())
                .isNoLoad(trip.getIsNoLoad())
                .noLoadReason(trip.getNoLoadReason())
                .enteredBy(trip.getEnteredBy())
                .notes(trip.getNotes())
                .deliveryProof(trip.getDeliveryProof())
                .invoiceId(trip.getInvoiceId())
                .version(trip.getVersion())
                .createdAt(trip.getCreatedAt())
                .build();
    }

    public TripDto.WorkerTripDto mapToWorkerDto(Trip trip) {
        return TripDto.WorkerTripDto.builder()
                .id(trip.getId())
                .date(trip.getDate())
                .customerId(trip.getCustomerId())
                .customerName(trip.getCustomerName())
                .customerPhone(trip.getCustomerPhone())
                .vehicleRegistration(trip.getVehicleRegistration())
                .vehicleOwnership(trip.getVehicleOwnership())
                .driverId(trip.getDriverId())
                .driverName(trip.getDriverName())
                .driverPhone(trip.getDriverPhone())
                .material(trip.getMaterial())
                .quantity(trip.getQuantity())
                .unit(trip.getUnit())
                .source(trip.getSource())
                .sourceBillNo(trip.getSourceBillNo())
                .loadingLocation(trip.getLoadingLocation())
                .deliveryLocation(trip.getDeliveryLocation())
                .loadingDateTime(trip.getLoadingDateTime())
                .departureDateTime(trip.getDepartureDateTime())
                .deliveryDateTime(trip.getDeliveryDateTime())
                .unloadQuantity(trip.getUnloadQuantity())
                .unloadUnit(trip.getUnloadUnit())
                .shortage(trip.getShortage())
                .openingKm(trip.getOpeningKm())
                .closingKm(trip.getClosingKm())
                .tripKm(trip.getTripKm())
                .status(trip.getStatus())
                .progress(trip.getProgress())
                .isNoLoad(trip.getIsNoLoad())
                .noLoadReason(trip.getNoLoadReason())
                .enteredBy(trip.getEnteredBy())
                .notes(trip.getNotes())
                .deliveryProof(trip.getDeliveryProof())
                .billingRate(trip.getBillingRate())
                .transportRate(trip.getTransportRate())
                .purchaseRate(trip.getPurchaseRate())
                .perKmRate(trip.getPerKmRate())
                .appliedRate(trip.getAppliedRate())
                .createdAt(trip.getCreatedAt())
                .build();
    }
}
