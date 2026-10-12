package com.transport.tms.master.driver.service;

import com.transport.tms.common.exception.Exceptions;
import com.transport.tms.common.util.IdGenerator;
import com.transport.tms.master.driver.entity.Driver;
import com.transport.tms.master.driver.repository.DriverRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class DriverService {

    private final DriverRepository driverRepository;

    @Transactional(readOnly = true)
    public List<Driver> getAllDrivers() {
        return driverRepository.findAll();
    }

    @Transactional(readOnly = true)
    public Driver getDriverById(String id) {
        return driverRepository.findById(id)
                .orElseThrow(() -> new Exceptions.ResourceNotFoundException("Driver", "id", id));
    }

    @Transactional(readOnly = true)
    public List<Driver> getAvailableDrivers() {
        return driverRepository.findByStatus("AVAILABLE");
    }

    @Transactional
    public Driver createDriver(Driver driver) {
        if (driver.getId() == null || driver.getId().isBlank()) {
            driver.setId("DRV-" + String.format("%04d", (int)(Math.random() * 9000) + 1000));
        } else if (driverRepository.existsById(driver.getId().trim())) {
            throw new Exceptions.BadRequestException("Driver ID '" + driver.getId() + "' already exists!");
        }
        driver.setId(driver.getId().trim());
        return driverRepository.save(driver);
    }

    @Transactional
    public Driver updateDriver(String id, Driver request) {
        Driver driver = getDriverById(id);
        driver.setName(request.getName());
        driver.setPhone(request.getPhone());
        driver.setLicenseNumber(request.getLicenseNumber());
        driver.setAssignedVehicle(request.getAssignedVehicle());
        driver.setStatus(request.getStatus());
        return driverRepository.save(driver);
    }

    @Transactional
    public void deleteDriver(String id) {
        Driver driver = getDriverById(id);
        driver.setStatus("INACTIVE");
        driverRepository.save(driver);
    }
}
