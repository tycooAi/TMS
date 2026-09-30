package com.transport.tms.user.service;

import com.transport.tms.auth.dto.AuthDto;
import com.transport.tms.common.exception.Exceptions;
import com.transport.tms.common.util.IdGenerator;
import com.transport.tms.user.entity.Role;
import com.transport.tms.user.entity.User;
import com.transport.tms.user.repository.RoleRepository;
import com.transport.tms.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final IdGenerator idGenerator;

    @Transactional(readOnly = true)
    public List<AuthDto.UserDto> getAllUsers() {
        return userRepository.findAll().stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public AuthDto.UserDto getUserById(String id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new Exceptions.ResourceNotFoundException("User", "id", id));
        return mapToDto(user);
    }

    @Transactional
    public AuthDto.UserDto createUser(AuthDto.CreateUserRequest request) {
        String cleanUsername = request.getUsername().toLowerCase().trim();
        if (userRepository.existsByUsernameIgnoreCase(cleanUsername)) {
            throw new Exceptions.BadRequestException("Username already exists: " + request.getUsername());
        }

        if (request.getEmail() != null && !request.getEmail().isBlank()) {
            String cleanEmail = request.getEmail().toLowerCase().trim();
            if (userRepository.existsByEmailIgnoreCase(cleanEmail)) {
                throw new Exceptions.BadRequestException("Email already registered: " + request.getEmail());
            }
        }

        String roleName = request.getRole().toUpperCase().trim();
        if (roleName.startsWith("ROLE_")) {
            roleName = roleName.substring(5);
        }

        // Strict Business Rule: Drivers must never receive login credentials or user accounts
        if ("DRIVER".equalsIgnoreCase(roleName)) {
            throw new Exceptions.BadRequestException("Drivers do not require application login credentials and cannot have user accounts created.");
        }

        final String lookupRole = roleName;
        Role role = roleRepository.findByName(lookupRole)
                .orElseGet(() -> roleRepository.findById("ROLE_" + lookupRole)
                        .orElseThrow(() -> new Exceptions.ResourceNotFoundException("Role", "name", lookupRole)));

        User user = User.builder()
                .id("USR-" + (System.currentTimeMillis() % 90000 + 10000))
                .username(request.getUsername().toLowerCase().trim())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .fullName(request.getFullName())
                .email(request.getEmail())
                .phone(request.getPhone())
                .role(role)
                .status("ACTIVE")
                .build();

        User saved = userRepository.save(user);
        return mapToDto(saved);
    }

    @Transactional
    public AuthDto.UserDto updateUser(String id, AuthDto.UpdateUserRequest request) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new Exceptions.ResourceNotFoundException("User", "id", id));

        if (request.getFullName() != null) user.setFullName(request.getFullName());
        if (request.getEmail() != null) user.setEmail(request.getEmail());
        if (request.getPhone() != null) user.setPhone(request.getPhone());
        if (request.getStatus() != null) user.setStatus(request.getStatus());
        if (request.getPassword() != null && !request.getPassword().isBlank()) {
            user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        }

        if (request.getRole() != null && !request.getRole().isBlank()) {
            String roleName = request.getRole().toUpperCase().trim();
            if (roleName.startsWith("ROLE_")) {
                roleName = roleName.substring(5);
            }
            if ("DRIVER".equalsIgnoreCase(roleName)) {
                throw new Exceptions.BadRequestException("Drivers do not require application login credentials and cannot have user accounts assigned.");
            }
            final String lookupRole = roleName;
            Role role = roleRepository.findByName(lookupRole)
                    .orElseGet(() -> roleRepository.findById("ROLE_" + lookupRole)
                            .orElseThrow(() -> new Exceptions.ResourceNotFoundException("Role", "name", lookupRole)));
            user.setRole(role);
        }

        return mapToDto(userRepository.save(user));
    }

    @Transactional
    public AuthDto.UserDto updateUserStatus(String id, String status) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new Exceptions.ResourceNotFoundException("User", "id", id));
        user.setStatus(status);
        return mapToDto(userRepository.save(user));
    }

    @Transactional
    public void deleteUser(String id) {
        User user = userRepository.findById(id)
                .or(() -> userRepository.findByUsernameIgnoreCaseOrEmailIgnoreCase(id, id))
                .orElseThrow(() -> new Exceptions.ResourceNotFoundException("User", "id", id));

        // Safety Rule: Never allow removing the primary ADMIN account
        if ("admin@transports".equalsIgnoreCase(user.getUsername()) || "admin@transports".equalsIgnoreCase(user.getEmail())) {
            throw new Exceptions.BadRequestException("The primary system administrator account (admin@transports) cannot be deactivated or removed.");
        }

        user.setStatus("INACTIVE");
        userRepository.save(user);
    }

    private AuthDto.UserDto mapToDto(User user) {
        return AuthDto.UserDto.builder()
                .id(user.getId())
                .username(user.getUsername())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .phone(user.getPhone())
                .role(user.getRole().getName())
                .status(user.getStatus())
                .build();
    }
}
