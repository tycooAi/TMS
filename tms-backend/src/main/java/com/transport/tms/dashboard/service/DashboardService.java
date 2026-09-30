package com.transport.tms.dashboard.service;

import com.transport.tms.dashboard.dto.DashboardDtos;
import com.transport.tms.finance.cashbank.entity.CashBankEntities.CashBankAccount;
import com.transport.tms.finance.cashbank.repository.CashBankAccountRepository;
import com.transport.tms.finance.diesel.entity.DieselEntities.DieselLog;
import com.transport.tms.finance.diesel.entity.DieselEntities.VehicleExpense;
import com.transport.tms.finance.diesel.repository.DieselLogRepository;
import com.transport.tms.finance.diesel.repository.VehicleExpenseRepository;
import com.transport.tms.finance.invoice.repository.InvoiceRepository;
import com.transport.tms.finance.payment.repository.PaymentRepository;
import com.transport.tms.governance.correction.repository.CorrectionRequestRepository;
import com.transport.tms.master.driver.entity.Driver;
import com.transport.tms.master.driver.repository.DriverRepository;
import com.transport.tms.master.vehicle.entity.Vehicle;
import com.transport.tms.master.vehicle.repository.VehicleRepository;
import com.transport.tms.trip.entity.Trip;
import com.transport.tms.trip.repository.TripRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final TripRepository tripRepository;
    private final InvoiceRepository invoiceRepository;
    private final PaymentRepository paymentRepository;
    private final VehicleRepository vehicleRepository;
    private final DriverRepository driverRepository;
    private final CashBankAccountRepository accountRepository;
    private final DieselLogRepository dieselRepository;
    private final VehicleExpenseRepository expenseRepository;
    private final CorrectionRequestRepository correctionRepository;

    @Transactional(readOnly = true)
    public DashboardDtos.MdDashboardDto getMdDashboard() {
        List<Trip> trips = tripRepository.findAll();
        List<Vehicle> vehicles = vehicleRepository.findAll();
        List<CashBankAccount> accounts = accountRepository.findAll();
        List<DieselLog> dieselLogs = dieselRepository.findAll();
        List<VehicleExpense> expenses = expenseRepository.findAll();

        BigDecimal grossRevenue = trips.stream()
                .map(Trip::getTotalAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal dieselExpense = dieselLogs.stream()
                .map(DieselLog::getTotalAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal maintenanceExpense = expenses.stream()
                .map(VehicleExpense::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal operatingProfit = grossRevenue.subtract(dieselExpense).subtract(maintenanceExpense);

        BigDecimal receivables = invoiceRepository.calculateTotalOutstandingReceivables();
        if (receivables == null) receivables = BigDecimal.ZERO;

        BigDecimal totalCashBank = accounts.stream()
                .map(CashBankAccount::getBalance)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        long totalVehicles = vehicles.size();
        long activeVehicles = vehicles.stream()
                .filter(v -> "AVAILABLE".equalsIgnoreCase(v.getStatus()) || "ON_TRIP".equalsIgnoreCase(v.getStatus()))
                .count();

        double utilization = totalVehicles > 0 ? ((double) activeVehicles / totalVehicles) * 100.0 : 0.0;
        long pendingApprovals = correctionRepository.findAll().stream()
                .filter(r -> ("PENDING_MD_APPROVAL".equalsIgnoreCase(r.getStatus()) || "PENDING".equalsIgnoreCase(r.getStatus()) || "PENDING_MD".equalsIgnoreCase(r.getStatus()))
                        && !"CUSTOMER".equalsIgnoreCase(r.getEntityType()))
                .count();

        // Calculate truck-wise profitability
        Map<String, List<Trip>> tripsByVehicle = trips.stream()
                .collect(Collectors.groupingBy(Trip::getVehicleRegistration));

        List<DashboardDtos.TruckProfitabilityDto> truckProfitability = new ArrayList<>();
        for (Vehicle v : vehicles) {
            List<Trip> vTrips = tripsByVehicle.getOrDefault(v.getRegistration(), List.of());
            BigDecimal vRev = vTrips.stream().map(Trip::getTotalAmount).reduce(BigDecimal.ZERO, BigDecimal::add);

            BigDecimal vDiesel = dieselLogs.stream()
                    .filter(d -> d.getVehicleRegistration().equalsIgnoreCase(v.getRegistration()))
                    .map(DieselLog::getTotalAmount)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            BigDecimal vMaint = expenses.stream()
                    .filter(e -> e.getVehicleRegistration().equalsIgnoreCase(v.getRegistration()))
                    .map(VehicleExpense::getAmount)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            BigDecimal netMargin = vRev.subtract(vDiesel).subtract(vMaint);

            truckProfitability.add(DashboardDtos.TruckProfitabilityDto.builder()
                    .vehicleRegistration(v.getRegistration())
                    .ownership(v.getOwnership())
                    .tripsCount(vTrips.size())
                    .grossRevenue(vRev)
                    .dieselCost(vDiesel)
                    .maintenanceCost(vMaint)
                    .netMargin(netMargin)
                    .status(v.getStatus())
                    .build());
        }

        return DashboardDtos.MdDashboardDto.builder()
                .monthlyGrossRevenue(grossRevenue)
                .monthlyOperatingProfit(operatingProfit)
                .totalReceivables(receivables)
                .totalBankCashPosition(totalCashBank)
                .totalDieselExpense(dieselExpense)
                .totalMaintenanceExpense(maintenanceExpense)
                .totalTripsCount(trips.size())
                .activeVehiclesCount(activeVehicles)
                .totalVehiclesCount(totalVehicles)
                .fleetUtilizationRate(Math.round(utilization * 10.0) / 10.0)
                .pendingApprovalsCount(pendingApprovals)
                .truckProfitability(truckProfitability)
                .build();
    }

    @Transactional(readOnly = true)
    public DashboardDtos.AccountsDashboardDto getAccountsDashboard() {
        long unbilled = tripRepository.countUnbilledTrips();
        BigDecimal receivables = invoiceRepository.calculateTotalOutstandingReceivables();
        if (receivables == null) receivables = BigDecimal.ZERO;

        List<CashBankAccount> accounts = accountRepository.findAll();
        BigDecimal cash = accounts.stream()
                .filter(a -> "CASH".equalsIgnoreCase(a.getAccountType()))
                .map(CashBankAccount::getBalance)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal bank = accounts.stream()
                .filter(a -> "BANK".equalsIgnoreCase(a.getAccountType()))
                .map(CashBankAccount::getBalance)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        List<Driver> drivers = driverRepository.findAll();
        BigDecimal driverAdvances = drivers.stream()
                .map(Driver::getAdvanceBalance)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal monthlyCollections = paymentRepository.findAll().stream()
                .filter(p -> !"CANCELLED".equalsIgnoreCase(p.getStatus()))
                .map(com.transport.tms.finance.payment.entity.Payment::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return DashboardDtos.AccountsDashboardDto.builder()
                .unbilledTripsCount(unbilled)
                .totalOutstandingReceivables(receivables)
                .cashInHandBalance(cash)
                .corporateBankBalance(bank)
                .totalMonthlyCollections(monthlyCollections)
                .totalPendingDriverAdvances(driverAdvances)
                .build();
    }

    @Transactional(readOnly = true)
    public DashboardDtos.ManagerDashboardDto getManagerDashboard() {
        List<Vehicle> vehicles = vehicleRepository.findAll();
        long available = vehicles.stream().filter(v -> "AVAILABLE".equalsIgnoreCase(v.getStatus())).count();
        long onTrip = vehicles.stream().filter(v -> "ON_TRIP".equalsIgnoreCase(v.getStatus())).count();
        long maint = vehicles.stream().filter(v -> "MAINTENANCE".equalsIgnoreCase(v.getStatus())).count();

        long availableDrivers = driverRepository.findByStatus("AVAILABLE").size();

        LocalDate today = LocalDate.now();
        List<Trip> todayTrips = tripRepository.findByDate(today);
        BigDecimal todayTonnage = todayTrips.stream()
                .map(Trip::getQuantity)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return DashboardDtos.ManagerDashboardDto.builder()
                .availableVehiclesCount(available)
                .onTripVehiclesCount(onTrip)
                .maintenanceVehiclesCount(maint)
                .availableDriversCount(availableDrivers)
                .todayTripsCount(todayTrips.size())
                .todayTonnageDispatched(todayTonnage)
                .build();
    }
}
