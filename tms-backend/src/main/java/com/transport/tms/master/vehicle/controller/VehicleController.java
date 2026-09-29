package com.transport.tms.master.vehicle.controller;

import com.transport.tms.common.response.ApiResponse;
import com.transport.tms.master.vehicle.entity.Vehicle;
import com.transport.tms.master.vehicle.service.VehicleService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/vehicles")
@RequiredArgsConstructor
@Tag(name = "Vehicle Master", description = "Fleet and tipper registration management")
public class VehicleController {

    private final VehicleService vehicleService;

    @GetMapping
    @Operation(summary = "Get all vehicles")
    public ResponseEntity<ApiResponse<List<Vehicle>>> getAllVehicles() {
        return ResponseEntity.ok(ApiResponse.ok(vehicleService.getAllVehicles()));
    }

    @GetMapping("/available")
    @Operation(summary = "Get available vehicles for dispatch")
    public ResponseEntity<ApiResponse<List<Vehicle>>> getAvailableVehicles() {
        return ResponseEntity.ok(ApiResponse.ok(vehicleService.getAvailableVehicles()));
    }

    @GetMapping("/{registration}")
    @Operation(summary = "Get vehicle by registration number")
    public ResponseEntity<ApiResponse<Vehicle>> getVehicle(@PathVariable String registration) {
        return ResponseEntity.ok(ApiResponse.ok(vehicleService.getVehicleByRegistration(registration)));
    }

    @PostMapping
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_MANAGER', 'ROLE_ACCOUNTS', 'ROLE_WORKER', 'VEHICLE_MANAGE')")
    @Operation(summary = "Register a new vehicle")
    public ResponseEntity<ApiResponse<Vehicle>> createVehicle(@Valid @RequestBody Vehicle vehicle) {
        return ResponseEntity.ok(ApiResponse.ok("Vehicle created successfully", vehicleService.createVehicle(vehicle)));
    }

    @PutMapping("/{registration}")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_MANAGER', 'ROLE_ACCOUNTS', 'VEHICLE_MANAGE')")
    @Operation(summary = "Update vehicle details")
    public ResponseEntity<ApiResponse<Vehicle>> updateVehicle(
            @PathVariable String registration,
            @Valid @RequestBody Vehicle vehicle) {
        return ResponseEntity.ok(ApiResponse.ok("Vehicle updated successfully", vehicleService.updateVehicle(registration, vehicle)));
    }

    @PatchMapping("/{registration}/status")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_MANAGER', 'ROLE_ACCOUNTS', 'VEHICLE_MANAGE')")
    @Operation(summary = "Update vehicle operational status")
    public ResponseEntity<ApiResponse<Vehicle>> updateVehicleStatus(
            @PathVariable String registration,
            @RequestParam String status) {
        return ResponseEntity.ok(ApiResponse.ok("Vehicle status updated", vehicleService.updateVehicleStatus(registration, status)));
    }

    @DeleteMapping("/{registration}")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_MANAGER', 'ROLE_ACCOUNTS', 'VEHICLE_MANAGE')")
    @Operation(summary = "Deactivate/delete vehicle")
    public ResponseEntity<ApiResponse<Void>> deleteVehicle(@PathVariable String registration) {
        vehicleService.deleteVehicle(registration);
        return ResponseEntity.ok(ApiResponse.ok("Vehicle deactivated successfully", null));
    }
}
