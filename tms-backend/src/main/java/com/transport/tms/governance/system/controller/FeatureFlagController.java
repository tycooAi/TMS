package com.transport.tms.governance.system.controller;

import com.transport.tms.common.response.ApiResponse;
import com.transport.tms.governance.system.entity.FeatureFlag;
import com.transport.tms.governance.system.service.FeatureFlagService;
import com.transport.tms.security.UserPrincipal;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/system/features")
@RequiredArgsConstructor
@Tag(name = "Feature Controls", description = "System-wide Dynamic Feature Flags and Operational Capabilities")
public class FeatureFlagController {

    private final FeatureFlagService featureFlagService;

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "List all registered system feature toggles")
    public ResponseEntity<ApiResponse<List<FeatureFlag>>> getAllFlags() {
        return ResponseEntity.ok(ApiResponse.ok(featureFlagService.getAllFlags()));
    }

    @PostMapping("/{flagKey}/toggle")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Toggle a specific feature flag state")
    public ResponseEntity<ApiResponse<FeatureFlag>> toggleFlag(
            @PathVariable String flagKey,
            @RequestBody Map<String, Boolean> payload,
            @AuthenticationPrincipal UserPrincipal userPrincipal
    ) {
        boolean enabled = payload.getOrDefault("enabled", true);
        String adminUser = userPrincipal != null ? userPrincipal.getUsername() : "ADMIN";
        FeatureFlag updated = featureFlagService.toggleFlag(flagKey, enabled, adminUser);
        return ResponseEntity.ok(ApiResponse.ok("Feature flag " + flagKey + " set to " + (enabled ? "ENABLED" : "DISABLED"), updated));
    }
}
