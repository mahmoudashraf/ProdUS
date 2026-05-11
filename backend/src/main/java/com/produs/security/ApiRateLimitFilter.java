package com.produs.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Instant;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

@Component
@Order(Ordered.HIGHEST_PRECEDENCE + 10)
public class ApiRateLimitFilter extends OncePerRequestFilter {

    private static final Set<String> SKIPPED_PREFIXES = Set.of(
            "/api/health",
            "/actuator",
            "/v3/api-docs",
            "/swagger-ui"
    );

    private final ConcurrentHashMap<String, RateWindow> windows = new ConcurrentHashMap<>();

    @Value("${app.security.rate-limit.enabled:true}")
    private boolean enabled;

    @Value("${app.security.rate-limit.requests-per-minute:300}")
    private int requestsPerMinute;

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        if (!enabled || "OPTIONS".equalsIgnoreCase(request.getMethod())) {
            return true;
        }
        String path = request.getRequestURI();
        if (!path.startsWith("/api/")) {
            return true;
        }
        return SKIPPED_PREFIXES.stream().anyMatch(path::startsWith);
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {
        long now = Instant.now().getEpochSecond();
        long resetAt = now - (now % 60) + 60;
        String key = rateLimitKey(request);
        RateWindow window = windows.compute(key, (ignored, current) -> {
            if (current == null || current.resetAtEpochSecond() <= now) {
                return new RateWindow(resetAt, new AtomicInteger(1));
            }
            current.counter().incrementAndGet();
            return current;
        });

        int used = window.counter().get();
        int remaining = Math.max(0, requestsPerMinute - used);
        response.setHeader("X-RateLimit-Limit", Integer.toString(requestsPerMinute));
        response.setHeader("X-RateLimit-Remaining", Integer.toString(remaining));
        response.setHeader("X-RateLimit-Reset", Long.toString(window.resetAtEpochSecond()));

        if (used > requestsPerMinute) {
            response.setStatus(429);
            response.setContentType("application/problem+json");
            response.getWriter().write("""
                    {"type":"https://api.produs.com/errors/rate-limit","title":"Too Many Requests","status":429,"detail":"API rate limit exceeded."}
                    """);
            return;
        }

        if (windows.size() > 10_000) {
            windows.entrySet().removeIf(entry -> entry.getValue().resetAtEpochSecond() <= now);
        }

        filterChain.doFilter(request, response);
    }

    private String rateLimitKey(HttpServletRequest request) {
        String authHeader = request.getHeader("Authorization");
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            return "bearer:" + Integer.toHexString(authHeader.hashCode());
        }
        String forwardedFor = request.getHeader("X-Forwarded-For");
        if (forwardedFor != null && !forwardedFor.isBlank()) {
            return "ip:" + forwardedFor.split(",")[0].trim();
        }
        return "ip:" + request.getRemoteAddr();
    }

    private record RateWindow(long resetAtEpochSecond, AtomicInteger counter) {}
}
