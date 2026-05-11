package com.produs.security;

import com.produs.entity.User;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.slf4j.MDC;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.security.Principal;

@Slf4j
@Component
@Order(Ordered.LOWEST_PRECEDENCE)
public class SecurityAuditFilter extends OncePerRequestFilter {

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {
        try {
            filterChain.doFilter(request, response);
        } finally {
            int status = response.getStatus();
            if (status == 401 || status == 403 || status == 429) {
                log.warn(
                        "security_event status={} requestId={} method={} path={} actor={} remote={}",
                        status,
                        MDC.get("requestId"),
                        request.getMethod(),
                        request.getRequestURI(),
                        actor(request),
                        request.getRemoteAddr()
                );
            }
        }
    }

    private String actor(HttpServletRequest request) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof User user) {
            return user.getEmail();
        }
        if (authentication != null && authentication.getName() != null) {
            return authentication.getName();
        }
        Principal principal = request.getUserPrincipal();
        if (principal != null && principal.getName() != null) {
            return principal.getName();
        }
        return "anonymous";
    }
}
