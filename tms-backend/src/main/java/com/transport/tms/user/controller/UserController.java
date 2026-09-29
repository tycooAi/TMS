package com.transport.tms.user.controller;

import com.transport.tms.auth.dto.AuthDto;
import com.transport.tms.common.response.ApiResponse;
import com.transport.tms.user.entity.User;
import com.transport.tms.user.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
@Tag(name = "User Management", description = "User creation, roles, and status administration")
public class UserController {

    private final UserService userService;

    @GetMapping
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_MANAGER', 'USER_MANAGE')")
    @Operation(summary = "Get all users")
    public ResponseEntity<ApiResponse<List<AuthDto.UserDto>>> getAllUsers() {
        return ResponseEntity.ok(ApiResponse.ok(userService.getAllUsers()));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_MANAGER', 'USER_MANAGE')")
    @Operation(summary = "Get user by ID")
    public ResponseEntity<ApiResponse<AuthDto.UserDto>> getUserById(@PathVariable String id) {
        return ResponseEntity.ok(ApiResponse.ok(userService.getUserById(id)));
    }

    @PostMapping
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_MANAGER', 'USER_MANAGE')")
    @Operation(summary = "Create a new user account")
    public ResponseEntity<ApiResponse<AuthDto.UserDto>> createUser(@Valid @RequestBody AuthDto.CreateUserRequest request) {
        return ResponseEntity.ok(ApiResponse.ok("User created successfully", userService.createUser(request)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_MANAGER', 'USER_MANAGE')")
    @Operation(summary = "Update user details")
    public ResponseEntity<ApiResponse<AuthDto.UserDto>> updateUser(
            @PathVariable String id,
            @RequestBody AuthDto.UpdateUserRequest request) {
        return ResponseEntity.ok(ApiResponse.ok("User updated successfully", userService.updateUser(id, request)));
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_MANAGER', 'USER_MANAGE')")
    @Operation(summary = "Update user status (ACTIVE / INACTIVE)")
    public ResponseEntity<ApiResponse<AuthDto.UserDto>> updateUserStatus(
            @PathVariable String id,
            @RequestParam String status) {
        return ResponseEntity.ok(ApiResponse.ok("User status updated", userService.updateUserStatus(id, status)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_MANAGER', 'USER_MANAGE')")
    @Operation(summary = "Deactivate/delete user")
    public ResponseEntity<ApiResponse<Void>> deleteUser(@PathVariable String id) {
        userService.deleteUser(id);
        return ResponseEntity.ok(ApiResponse.ok("User deactivated successfully", null));
    }
}
