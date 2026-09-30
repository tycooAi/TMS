package com.transport.tms.governance.approval.controller;

import com.transport.tms.common.response.ApiResponse;
import com.transport.tms.governance.approval.service.ApprovalService;
import com.transport.tms.governance.correction.dto.CorrectionDto;
import com.transport.tms.governance.correction.entity.CorrectionRequest;
import com.transport.tms.security.UserPrincipal;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/approvals")
@RequiredArgsConstructor
@Tag(name = "Approval Engine", description = "2-Person Rule correction requests and approval queue")
public class ApprovalController {

    private final ApprovalService approvalService;

    @PostMapping({"/requests", "/correction-requests"})
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_MANAGER', 'ROLE_WORKER', 'ROLE_ACCOUNTS', 'TRIP_EDIT_REQUEST')")
    @Operation(summary = "Submit a correction request for a locked record")
    public ResponseEntity<ApiResponse<CorrectionRequest>> submitRequest(
            @Valid @RequestBody CorrectionDto.SubmitCorrectionRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        CorrectionRequest created = approvalService.submitCorrectionRequest(request, currentUser);
        return ResponseEntity.ok(ApiResponse.ok("Correction request submitted for approval", created));
    }

    @GetMapping
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_MD', 'ROLE_MANAGER', 'TRIP_APPROVE')")
    @Operation(summary = "Get all approvals in system with optional role/scope filtering")
    public ResponseEntity<ApiResponse<List<CorrectionRequest>>> getAllApprovals(
            @RequestParam(required = false) String scope,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        boolean isMd = currentUser != null && currentUser.getAuthorities().stream().anyMatch(a -> a.getAuthority().equalsIgnoreCase("ROLE_MD"));
        if ("MD".equalsIgnoreCase(scope) || (isMd && !"ALL".equalsIgnoreCase(scope))) {
            return ResponseEntity.ok(ApiResponse.ok(approvalService.getMdApprovals()));
        }
        return ResponseEntity.ok(ApiResponse.ok(approvalService.getAllApprovals()));
    }

    @GetMapping("/pending")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_MD', 'ROLE_MANAGER', 'TRIP_APPROVE')")
    @Operation(summary = "Get pending approvals in the review queue")
    public ResponseEntity<ApiResponse<List<CorrectionRequest>>> getPendingApprovals(
            @RequestParam(required = false) String scope,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        boolean isMd = currentUser != null && currentUser.getAuthorities().stream().anyMatch(a -> a.getAuthority().equalsIgnoreCase("ROLE_MD"));
        boolean isManager = currentUser != null && currentUser.getAuthorities().stream().anyMatch(a -> a.getAuthority().equalsIgnoreCase("ROLE_MANAGER"));

        if ("MANAGER".equalsIgnoreCase(scope) || (isManager && !isMd && !"MD".equalsIgnoreCase(scope))) {
            return ResponseEntity.ok(ApiResponse.ok(approvalService.getPendingManagerApprovals()));
        }
        // Default for MD or when requested: MD pending approvals only (Accounts requests)
        return ResponseEntity.ok(ApiResponse.ok(approvalService.getPendingMdApprovals()));
    }

    @GetMapping("/md/pending")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_MD')")
    @Operation(summary = "Get pending Accounts approvals for MD")
    public ResponseEntity<ApiResponse<List<CorrectionRequest>>> getMdPendingApprovals() {
        return ResponseEntity.ok(ApiResponse.ok(approvalService.getPendingMdApprovals()));
    }

    @GetMapping("/md")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_MD')")
    @Operation(summary = "Get all Accounts approvals for MD")
    public ResponseEntity<ApiResponse<List<CorrectionRequest>>> getMdApprovals() {
        return ResponseEntity.ok(ApiResponse.ok(approvalService.getMdApprovals()));
    }

    @GetMapping("/manager/pending")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_MANAGER')")
    @Operation(summary = "Get pending customer change approvals for Manager")
    public ResponseEntity<ApiResponse<List<CorrectionRequest>>> getManagerPendingApprovals() {
        return ResponseEntity.ok(ApiResponse.ok(approvalService.getPendingManagerApprovals()));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_MD', 'ROLE_MANAGER')")
    @Operation(summary = "Get correction request by ID")
    public ResponseEntity<ApiResponse<CorrectionRequest>> getApprovalById(@PathVariable String id) {
        return ResponseEntity.ok(ApiResponse.ok(approvalService.getCorrectionById(id)));
    }

    @RequestMapping(value = "/{id}/approve", method = {RequestMethod.POST, RequestMethod.PUT})
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_MD', 'ROLE_MANAGER', 'TRIP_APPROVE')")
    @Operation(summary = "Approve correction and apply changes to database")
    public ResponseEntity<ApiResponse<CorrectionRequest>> approve(
            @PathVariable String id,
            @RequestBody(required = false) CorrectionDto.ReviewActionRequest body,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        String comment = body != null && body.getComment() != null ? body.getComment() : "Approved by " + currentUser.getFullName();
        CorrectionRequest approved = approvalService.approveCorrection(id, comment, currentUser);
        return ResponseEntity.ok(ApiResponse.ok("Correction approved and changes applied successfully", approved));
    }

    @RequestMapping(value = "/{id}/reject", method = {RequestMethod.POST, RequestMethod.PUT})
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_MD', 'ROLE_MANAGER', 'TRIP_APPROVE')")
    @Operation(summary = "Reject correction request without altering database")
    public ResponseEntity<ApiResponse<CorrectionRequest>> reject(
            @PathVariable String id,
            @RequestBody(required = false) CorrectionDto.ReviewActionRequest body,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        String comment = body != null && body.getComment() != null ? body.getComment() : "Rejected by " + currentUser.getFullName();
        CorrectionRequest rejected = approvalService.rejectCorrection(id, comment, currentUser);
        return ResponseEntity.ok(ApiResponse.ok("Correction request rejected", rejected));
    }
}
