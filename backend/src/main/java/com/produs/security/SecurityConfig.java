package com.produs.security;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity(prePostEnabled = true)
public class SecurityConfig {

    @Autowired(required = false)
    private SupabaseJwtAuthenticationFilter jwtAuthenticationFilter;
    
    @Autowired(required = false)
    private MockAuthenticationFilter mockAuthenticationFilter;

    @Value("${app.cors.allowed-origins:http://localhost:3000,http://localhost:3001,http://127.0.0.1:3000,http://127.0.0.1:3001,https://localhost:3000,https://localhost:3001,https://127.0.0.1:3000,https://127.0.0.1:3001}")
    private List<String> allowedOrigins;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .csrf(AbstractHttpConfigurer::disable)
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        // Public endpoints
                        .requestMatchers("/api/health", "/actuator/**").permitAll()
                        .requestMatchers("/v3/api-docs/**", "/swagger-ui/**", "/swagger-ui.html").permitAll()
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        
                        // Mock endpoints (for testing)
                        .requestMatchers("/api/mock/**").permitAll()

                        // Public discovery endpoints for unauthenticated visitors.
                        .requestMatchers(HttpMethod.GET, "/api/catalog/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/teams", "/api/teams/{id}", "/api/teams/{id}/capabilities").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/expert-profiles", "/api/expert-profiles/{id}").permitAll()

                        // Signed provider webhooks; authentication is the HMAC signature.
                        .requestMatchers(HttpMethod.POST, "/api/integrations/payments/webhook").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/integrations/signatures/webhook").permitAll()
                        
                        // Admin endpoints
                        .requestMatchers("/api/admin/**").hasRole("ADMIN")
                        
                        // All other API endpoints require authentication
                        .requestMatchers("/api/**").authenticated()
                        
                        .anyRequest().permitAll()
                );
        
        // Add mock authentication filter only if it's available (dev profile)
        if (mockAuthenticationFilter != null) {
            http.addFilterBefore(mockAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);
        }
        
        // Add JWT authentication filter only if it's available (non-dev profile)
        if (jwtAuthenticationFilter != null) {
            http.addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);
        }

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(allowedOrigins.stream()
                .map(String::trim)
                .filter(origin -> !origin.isBlank())
                .toList());
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("Authorization", "Content-Type", "X-Request-ID", "X-ProdUS-Signature", "X-Requested-With", "Accept"));
        configuration.setExposedHeaders(List.of(
                "X-Request-ID",
                "X-RateLimit-Limit",
                "X-RateLimit-Remaining",
                "X-RateLimit-Reset"
        ));
        configuration.setAllowCredentials(true);
        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
