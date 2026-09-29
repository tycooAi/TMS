package com.transport.tms.finance.diesel.service;

import com.transport.tms.common.util.IdGenerator;
import com.transport.tms.finance.diesel.entity.DieselEntities.DieselLog;
import com.transport.tms.finance.diesel.entity.DieselEntities.VehicleExpense;
import com.transport.tms.finance.diesel.repository.DieselLogRepository;
import com.transport.tms.finance.diesel.repository.VehicleExpenseRepository;
import com.transport.tms.finance.ledger.service.LedgerService;
import com.transport.tms.master.driver.entity.Driver;
import com.transport.tms.master.driver.service.DriverService;
import com.transport.tms.master.source.entity.FuelStation;
import com.transport.tms.master.source.repository.FuelStationRepository;
import com.transport.tms.master.vehicle.entity.Vehicle;
import com.transport.tms.master.vehicle.service.VehicleService;
import com.transport.tms.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;

@Service
@RequiredArgsConstructor
public class DieselExpenseService {

    private final DieselLogRepository dieselRepository;
    private final VehicleExpenseRepository expenseRepository;
    private final FuelStationRepository fuelStationRepository;
    private final VehicleService vehicleService;
    private final DriverService driverService;
    private final LedgerService ledgerService;
    private final IdGenerator idGenerator;

    @Transactional
    public DieselLog recordDiesel(DieselLog request, UserPrincipal currentUser) {
        Vehicle vehicle = vehicleService.getVehicleByRegistration(request.getVehicleRegistration());
        Driver driver = driverService.getDriverById(request.getDriverId());
        FuelStation station = fuelStationRepository.findById(request.getFuelStationId()).orElse(null);

        String stationName = station != null ? station.getName() : request.getFuelStationName();
        BigDecimal totalAmount = request.getLitres().multiply(request.getRatePerLitre());

        BigDecimal kmRun = request.getKmRun();
        BigDecimal mileage = null;

        if (kmRun != null && kmRun.compareTo(BigDecimal.ZERO) >= 0 && request.getLitres() != null && request.getLitres().compareTo(BigDecimal.ZERO) > 0) {
            mileage = kmRun.divide(request.getLitres(), 2, RoundingMode.HALF_UP);
        } else if (request.getStartKm() != null && request.getEndKm() != null) {
            kmRun = request.getEndKm().subtract(request.getStartKm());
            if (kmRun.compareTo(BigDecimal.ZERO) > 0 && request.getLitres() != null && request.getLitres().compareTo(BigDecimal.ZERO) > 0) {
                mileage = kmRun.divide(request.getLitres(), 2, RoundingMode.HALF_UP);
            }
            vehicle.setCurrentKm(request.getEndKm());
        }

        String dieselId = idGenerator.generateDieselId();
        DieselLog log = DieselLog.builder()
                .id(dieselId)
                .date(request.getDate())
                .vehicleRegistration(vehicle.getRegistration())
                .driverId(driver.getId())
                .driverName(driver.getName())
                .fuelStationId(request.getFuelStationId())
                .fuelStationName(stationName)
                .billNumber(request.getBillNumber())
                .litres(request.getLitres())
                .ratePerLitre(request.getRatePerLitre())
                .totalAmount(totalAmount)
                .startKm(request.getStartKm())
                .endKm(request.getEndKm())
                .kmRun(kmRun)
                .mileage(mileage)
                .paymentMode(request.getPaymentMode() != null ? request.getPaymentMode() : "CREDIT")
                .status("RECORDED")
                .notes(request.getNotes())
                .enteredBy(currentUser.getFullName())
                .build();

        DieselLog saved = dieselRepository.save(log);

        // Update fuel station balance if credit
        if (station != null && "CREDIT".equalsIgnoreCase(log.getPaymentMode())) {
            station.setBalance(station.getBalance().add(totalAmount));
            fuelStationRepository.save(station);
        }

        // Record in central ledger
        ledgerService.recordExpense(
                "VEHICLE",
                vehicle.getRegistration(),
                vehicle.getRegistration() + " (" + driver.getName() + ")",
                "DIESEL",
                totalAmount,
                log.getPaymentMode(),
                dieselId,
                "Diesel Entry: " + request.getLitres() + " L @ ₹" + request.getRatePerLitre() + " at " + stationName,
                currentUser.getFullName()
        );

        return saved;
    }

    @Transactional(readOnly = true)
    public List<DieselLog> getAllDieselLogs() {
        return dieselRepository.findAllByOrderByDateDesc();
    }

    @Transactional
    public void deleteDieselLog(String id) {
        dieselRepository.deleteById(id);
    }

    @Transactional
    public VehicleExpense recordExpense(VehicleExpense request, UserPrincipal currentUser) {
        Vehicle vehicle = vehicleService.getVehicleByRegistration(request.getVehicleRegistration());

        String expId = idGenerator.generateExpenseId();
        VehicleExpense expense = VehicleExpense.builder()
                .id(expId)
                .date(request.getDate())
                .vehicleRegistration(vehicle.getRegistration())
                .expenseType(request.getExpenseType())
                .amount(request.getAmount())
                .vendorName(request.getVendorName())
                .invoiceBillNo(request.getInvoiceBillNo())
                .paymentMode(request.getPaymentMode() != null ? request.getPaymentMode() : "CASH")
                .status("PAID")
                .description(request.getDescription())
                .enteredBy(currentUser.getFullName())
                .build();

        VehicleExpense saved = expenseRepository.save(expense);

        // Record in central ledger
        ledgerService.recordExpense(
                "VEHICLE",
                vehicle.getRegistration(),
                vehicle.getRegistration(),
                "MAINTENANCE",
                request.getAmount(),
                request.getPaymentMode(),
                expId,
                "Vehicle Maintenance: " + request.getExpenseType() + " - " + request.getDescription(),
                currentUser.getFullName()
        );

        return saved;
    }

    @Transactional(readOnly = true)
    public List<VehicleExpense> getAllExpenses() {
        return expenseRepository.findAllByOrderByDateDesc();
    }

    @Transactional
    public void deleteExpense(String id) {
        expenseRepository.deleteById(id);
    }
}
