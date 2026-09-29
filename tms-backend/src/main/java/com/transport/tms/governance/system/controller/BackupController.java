package com.transport.tms.governance.system.controller;

import com.transport.tms.common.response.ApiResponse;
import com.transport.tms.governance.system.dto.SystemDtos;
import com.transport.tms.governance.system.entity.BackupRecord;
import com.transport.tms.governance.system.entity.BackupSchedule;
import com.transport.tms.governance.system.service.BackupService;
import com.transport.tms.security.UserPrincipal;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.io.File;
import java.util.List;

@RestController
@RequestMapping("/api/v1/system/backups")
@RequiredArgsConstructor
@Tag(name = "Backup & Recovery Center", description = "Enterprise Database Snapshot Management, Automated Schedules & Disaster Recovery")
public class BackupController {

    private final BackupService backupService;

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "List all existing database snapshot recovery points")
    public ResponseEntity<ApiResponse<List<BackupRecord>>> getAllBackups() {
        return ResponseEntity.ok(ApiResponse.ok(backupService.getAllBackups()));
    }

    @PostMapping("/create")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Trigger immediate database backup snapshot")
    public ResponseEntity<ApiResponse<BackupRecord>> createBackup(
            @RequestBody(required = false) SystemDtos.BackupCreateRequest request,
            @AuthenticationPrincipal UserPrincipal userPrincipal
    ) {
        String adminUser = userPrincipal != null ? userPrincipal.getUsername() : "ADMIN";
        SystemDtos.BackupCreateRequest req = request != null ? request : new SystemDtos.BackupCreateRequest("MANUAL", "Manual backup triggered from Admin Portal");
        BackupRecord record = backupService.createBackup(req, adminUser);
        return ResponseEntity.ok(ApiResponse.ok("Database snapshot created successfully", record));
    }

    @PostMapping("/{id}/verify")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Verify physical integrity and SHA-256 checksum of a backup snapshot")
    public ResponseEntity<ApiResponse<BackupRecord>> verifyBackup(
            @PathVariable String id,
            @AuthenticationPrincipal UserPrincipal userPrincipal
    ) {
        String adminUser = userPrincipal != null ? userPrincipal.getUsername() : "ADMIN";
        BackupRecord record = backupService.verifyBackup(id, adminUser);
        return ResponseEntity.ok(ApiResponse.ok("Backup checksum verification passed: " + record.getStatus(), record));
    }

    @PostMapping("/{id}/restore")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Execute controlled disaster recovery restore of database snapshot")
    public ResponseEntity<ApiResponse<BackupRecord>> restoreBackup(
            @PathVariable String id,
            @RequestBody SystemDtos.BackupRestoreRequest request,
            @AuthenticationPrincipal UserPrincipal userPrincipal
    ) {
        String adminUser = userPrincipal != null ? userPrincipal.getUsername() : "ADMIN";
        BackupRecord record = backupService.restoreBackup(id, request, adminUser);
        return ResponseEntity.ok(ApiResponse.ok("Database successfully restored to snapshot point " + id, record));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Delete older backup snapshot respecting retention policy")
    public ResponseEntity<ApiResponse<Void>> deleteBackup(
            @PathVariable String id,
            @AuthenticationPrincipal UserPrincipal userPrincipal
    ) {
        String adminUser = userPrincipal != null ? userPrincipal.getUsername() : "ADMIN";
        backupService.deleteBackup(id, adminUser);
        return ResponseEntity.ok(ApiResponse.ok("Backup snapshot deleted successfully", null));
    }

    @GetMapping("/schedules")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Get automated weekly and monthly backup schedules")
    public ResponseEntity<ApiResponse<List<BackupSchedule>>> getSchedules() {
        return ResponseEntity.ok(ApiResponse.ok(backupService.getAllSchedules()));
    }

    @PutMapping("/schedules/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Update automated backup schedule policy and retention")
    public ResponseEntity<ApiResponse<BackupSchedule>> updateSchedule(
            @PathVariable String id,
            @RequestBody SystemDtos.BackupScheduleUpdateRequest request,
            @AuthenticationPrincipal UserPrincipal userPrincipal
    ) {
        String adminUser = userPrincipal != null ? userPrincipal.getUsername() : "ADMIN";
        BackupSchedule schedule = backupService.updateSchedule(id, request, adminUser);
        return ResponseEntity.ok(ApiResponse.ok("Backup schedule " + id + " updated", schedule));
    }

    @GetMapping("/{id}/download")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Download backup snapshot SQL dump file")
    public ResponseEntity<Resource> downloadBackup(@PathVariable String id) {
        File file = backupService.getBackupFile(id);
        FileSystemResource resource = new FileSystemResource(file);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + file.getName() + "\"")
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .contentLength(file.length())
                .body(resource);
    }
}
