package com.transport.tms.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.transport.tms.governance.system.entity.SystemControl;
import com.transport.tms.governance.system.service.SystemControlService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

@Component
@RequiredArgsConstructor
@Slf4j
public class SystemControlFilter extends OncePerRequestFilter {

    private final SystemControlService systemControlService;
    private final ObjectMapper objectMapper;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        String path = request.getRequestURI();
        String method = request.getMethod();

        // 1. Whitelisted routes that are always accessible
        if (isPublicPath(path)) {
            filterChain.doFilter(request, response);
            return;
        }

        SystemControl control = systemControlService.getSystemControl();
        String state = control.getSystemState();

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        boolean isAdmin = auth != null && auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equalsIgnoreCase("ROLE_ADMIN"));

        // 2. Global System State Enforcement (SHUTDOWN or MAINTENANCE)
        if ("SHUTDOWN".equalsIgnoreCase(state) || "MAINTENANCE".equalsIgnoreCase(state)) {
            if (isAdmin && Boolean.TRUE.equals(control.getAllowAdminBypass())) {
                // Admin bypass allowed for system management, recovery, and diagnostics
                filterChain.doFilter(request, response);
                return;
            }

            // Block non-admin or unauthenticated requests with HTTP 503
            writeServiceUnavailable(response, state, control);
            return;
        }

        // 3. Operational Emergency Toggles
        if (Boolean.FALSE.equals(control.getAllowWorkerTrips()) && !isAdmin) {
            if (path.startsWith("/api/v1/trips") && ("POST".equalsIgnoreCase(method) || "PUT".equalsIgnoreCase(method))) {
                writeForbidden(response, "Trip recording is temporarily disabled by System Emergency Controls.");
                return;
            }
        }

        if (Boolean.FALSE.equals(control.getAllowAccountsPayments()) && !isAdmin) {
            if (path.startsWith("/api/v1/payments") && ("POST".equalsIgnoreCase(method) || "PUT".equalsIgnoreCase(method))) {
                writeForbidden(response, "Payment processing is temporarily disabled by System Emergency Controls.");
                return;
            }
        }

        if (Boolean.TRUE.equals(control.getLockSensitiveOps()) && !isAdmin) {
            if (("POST".equalsIgnoreCase(method) || "PUT".equalsIgnoreCase(method) || "DELETE".equalsIgnoreCase(method))
                    && (path.startsWith("/api/v1/invoices") || path.startsWith("/api/v1/rates") || path.startsWith("/api/v1/accounts"))) {
                writeForbidden(response, "Financial and master data modifications are locked by System Emergency Controls.");
                return;
            }
        }

        filterChain.doFilter(request, response);
    }

    private boolean isPublicPath(String path) {
        return path.equals("/")
                || path.startsWith("/error")
                || path.equals("/api/v1/system/status")
                || path.startsWith("/api/v1/auth/login")
                || path.startsWith("/api/v1/auth/roles")
                || path.startsWith("/v3/api-docs")
                || path.startsWith("/swagger-ui")
                || path.startsWith("/actuator");
    }

    private void writeServiceUnavailable(HttpServletResponse response, String state, SystemControl control) throws IOException {
        response.setStatus(HttpServletResponse.SC_SERVICE_UNAVAILABLE);
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);

        Map<String, Object> body = new HashMap<>();
        body.put("success", false);
        body.put("systemState", state);
        body.put("maintenanceTitle", control.getMaintenanceTitle());
        body.put("message", "SHUTDOWN".equalsIgnoreCase(state)
                ? (control.getShutdownReason() != null ? control.getShutdownReason() : "The entire system has been placed into shutdown mode.")
                : control.getMaintenanceMessage());
        body.put("expectedRecoveryTime", control.getExpectedRecoveryTime());
        body.put("allowAdminBypass", control.getAllowAdminBypass());

        response.getWriter().write(objectMapper.writeValueAsString(body));
    }

    private void writeForbidden(HttpServletResponse response, String message) throws IOException {
        response.setStatus(HttpServletResponse.SC_FORBIDDEN);
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);

        Map<String, Object> body = new HashMap<>();
        body.put("success", false);
        body.put("error", message);

        response.getWriter().write(objectMapper.writeValueAsString(body));
    }
}
