package com.transport.tms.auth.service;

import com.transport.tms.auth.dto.AuthDto;
import com.transport.tms.common.exception.Exceptions;
import com.transport.tms.security.JwtTokenProvider;
import com.transport.tms.security.UserPrincipal;
import com.transport.tms.user.entity.Permission;
import com.transport.tms.user.entity.Role;
import com.transport.tms.user.entity.User;
import com.transport.tms.user.repository.RoleRepository;
import com.transport.tms.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;
import com.transport.tms.governance.system.entity.SystemControl;
import com.transport.tms.governance.system.service.SystemControlService;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final JwtTokenProvider tokenProvider;
    private final PasswordEncoder passwordEncoder;
    private final SystemControlService systemControlService;

    @Transactional
    public AuthDto.LoginResponse login(AuthDto.LoginRequest request) {
        String identifier = request.getUsername().toLowerCase().trim();
        User user = userRepository.findByUsernameIgnoreCaseOrEmailIgnoreCase(identifier, identifier)
                .or(() -> {
                    if (!identifier.contains("@")) {
                        return userRepository.findByUsernameIgnoreCaseOrEmailIgnoreCase(identifier + "@transports", identifier + "@transports");
                    }
                    return java.util.Optional.empty();
                })
                .orElseThrow(() -> new Exceptions.UnauthorizedException("Invalid email or password"));

        if (!"ACTIVE".equalsIgnoreCase(user.getStatus())) {
            log.warn("Blocked login attempt for deactivated user: {}", user.getUsername());
            throw new Exceptions.UnauthorizedException("This account has been deactivated. Please contact your system administrator.");
        }

        // Global System Shutdown Guard: Only ROLE_ADMIN may log in during shutdown
        SystemControl control = systemControlService.getSystemControl();
        if ("SHUTDOWN".equalsIgnoreCase(control.getSystemState())) {
            boolean isAdmin = user.getRole() != null &&
                    ("ROLE_ADMIN".equalsIgnoreCase(user.getRole().getId()) || "ADMIN".equalsIgnoreCase(user.getRole().getName()));
            if (!isAdmin) {
                log.warn("Blocked non-admin login attempt for user {} during GLOBAL SHUTDOWN", user.getUsername());
                throw new Exceptions.ServiceUnavailableException(
                        "SYSTEM_SHUTDOWN",
                        "The system is currently shut down. Normal user access is suspended. Only system administrators can log in to perform recovery."
                );
            }
        }

        // Strictly verify BCrypt password hash
        boolean passwordMatches = passwordEncoder.matches(request.getPassword(), user.getPasswordHash());

        if (!passwordMatches) {
            throw new Exceptions.UnauthorizedException("Invalid email or password");
        }

        user.setLastLoginAt(LocalDateTime.now());
        userRepository.save(user);

        UserPrincipal principal = UserPrincipal.create(user);
        Authentication authentication = new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities());
        SecurityContextHolder.getContext().setAuthentication(authentication);

        String jwt = tokenProvider.generateToken(authentication);

        Set<String> permissions = user.getRole().getPermissions().stream()
                .map(Permission::getId)
                .collect(Collectors.toSet());

        return AuthDto.LoginResponse.builder()
                .token(jwt)
                .tokenType("Bearer")
                .userId(user.getId())
                .username(user.getUsername())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .role(user.getRole().getName())
                .permissions(permissions)
                .build();
    }

    @Transactional(readOnly = true)
    public AuthDto.UserDto getCurrentUser(String userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new Exceptions.ResourceNotFoundException("User", "id", userId));

        Set<String> permissions = user.getRole().getPermissions().stream()
                .map(Permission::getId)
                .collect(Collectors.toSet());

        return AuthDto.UserDto.builder()
                .id(user.getId())
                .username(user.getUsername())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .phone(user.getPhone())
                .role(user.getRole().getName())
                .status(user.getStatus())
                .permissions(permissions)
                .build();
    }

    @Transactional(readOnly = true)
    public List<Role> getAllRoles() {
        return roleRepository.findAll();
    }
}
