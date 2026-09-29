package com.transport.tms.master.driver.controller;

import com.transport.tms.common.response.ApiResponse;
import com.transport.tms.master.driver.entity.Driver;
import com.transport.tms.master.driver.service.DriverService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/drivers")
@RequiredArgsConstructor
@Tag(name = "Driver Master", description = "Driver registration, license and balance management")
public class DriverController {

    private final DriverService driverService;

    @GetMapping
    @Operation(summary = "Get all drivers")
    public ResponseEntity<ApiResponse<List<Driver>>> getAllDrivers() {
        return ResponseEntity.ok(ApiResponse.ok(driverService.getAllDrivers()));
    }

    @GetMapping("/available")
    @Operation(summary = "Get available drivers for trip dispatch")
    public ResponseEntity<ApiResponse<List<Driver>>> getAvailableDrivers() {
        return ResponseEntity.ok(ApiResponse.ok(driverService.getAvailableDrivers()));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get driver by ID")
    public ResponseEntity<ApiResponse<Driver>> getDriver(@PathVariable String id) {
        return ResponseEntity.ok(ApiResponse.ok(driverService.getDriverById(id)));
    }

    @PostMapping
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_MANAGER', 'ROLE_ACCOUNTS', 'ROLE_WORKER', 'DRIVER_MANAGE')")
    @Operation(summary = "Register a new driver")
    public ResponseEntity<ApiResponse<Driver>> createDriver(@Valid @RequestBody Driver driver) {
        return ResponseEntity.ok(ApiResponse.ok("Driver created successfully", driverService.createDriver(driver)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_MANAGER', 'ROLE_ACCOUNTS', 'DRIVER_MANAGE')")
    @Operation(summary = "Update driver details")
    public ResponseEntity<ApiResponse<Driver>> updateDriver(
            @PathVariable String id,
            @Valid @RequestBody Driver driver) {
        return ResponseEntity.ok(ApiResponse.ok("Driver updated successfully", driverService.updateDriver(id, driver)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_MANAGER', 'ROLE_ACCOUNTS', 'DRIVER_MANAGE')")
    @Operation(summary = "Deactivate/delete driver")
    public ResponseEntity<ApiResponse<Void>> deleteDriver(@PathVariable String id) {
        driverService.deleteDriver(id);
        return ResponseEntity.ok(ApiResponse.ok("Driver deactivated successfully", null));
    }
}
