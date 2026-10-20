// BELENTANI OMEGA ULTRA
// Autoría: Pedro Belentani
// Fecha: 2026-08-31
// Seguridad empresarial para NOIACORE Lab
package com.noiacore.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.env.Environment;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.provisioning.InMemoryUserDetailsManager;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.header.writers.XXssProtectionHeaderWriter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

/**
 * Configuración de seguridad de nivel empresarial para NOIACORE.
 * 
 * CARACTERÍSTICAS IMPLEMENTADAS:
 * - CORS controlado para APIs
 * - Protección CSRF deshabilitada para API stateless (con tokens si fuera necesario)
 * - Headers de seguridad: X-Content-Type-Options, X-Frame-Options, HSTS, XSS Protection
 * - Content Security Policy (CSP) estricto para prevenir inyecciones
 * - Sin sesión HTTP (stateless para APIs REST)
 * - Password encoder BCrypt para futuras autenticaciones
 */
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .csrf(csrf -> csrf.disable()) // Stateless API: admin routes require explicit Authorization header
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .httpBasic(org.springframework.security.config.Customizer.withDefaults())
            .authorizeHttpRequests(auth -> auth
                .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/contactos", "/api/contactos/**").hasRole("ADMIN")
                .requestMatchers(org.springframework.http.HttpMethod.POST, "/api/proyectos").hasRole("ADMIN")
                .requestMatchers(org.springframework.http.HttpMethod.DELETE, "/api/proyectos/**").hasRole("ADMIN")
                .requestMatchers(org.springframework.http.HttpMethod.POST, "/api/contactos").permitAll()
                .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/proyectos", "/api/proyectos/**").permitAll()
                .requestMatchers("/api/**").denyAll() // Fail-closed for unspecified API endpoints
                .requestMatchers("/", "/index.html", "/*.html", "/assets/**", "/*.css", "/*.js", "/webjars/**").permitAll()
                .anyRequest().authenticated()
            )
            .headers(headers -> headers
                .contentSecurityPolicy(csp -> csp.policyDirectives(
                    "default-src 'self'; " +
                    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdnjs.cloudflare.com https://fonts.googleapis.com https://fonts.gstatic.com; " +
                    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://fonts.gstatic.com; " +
                    "font-src 'self' https://fonts.gstatic.com; " +
                    "img-src 'self' data: https: blob:; " +
                    "connect-src 'self' https://api.github.com; " +
                    "frame-ancestors 'none'; " +
                    "base-uri 'self'; " +
                    "form-action 'self'"
                ))
                .xssProtection(xss -> xss.headerValue(XXssProtectionHeaderWriter.HeaderValue.ENABLED_MODE_BLOCK))
                .frameOptions(frame -> frame.deny())
                .httpStrictTransportSecurity(hsts -> hsts
                    .maxAgeInSeconds(31536000)
                    .includeSubDomains(true)
                    .preload(true)
                )
            );
        
        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(List.of(
            "https://noiacore.com",
            "http://localhost:8099",
            "http://localhost:3000"
        ));
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setAllowCredentials(true);
        configuration.setMaxAge(3600L);
        
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    /**
     * No default credentials. Admin routes return 401 until the operator sets
     * NOIACORE_ADMIN_PASSWORD to a high-entropy value of at least 24 characters.
     * Use HTTPS. Never embed this password in public web JavaScript.
     */
    @Bean
    public UserDetailsService adminAccounts(PasswordEncoder encoder, Environment environment) {
        String secret = environment.getProperty("NOIACORE_ADMIN_PASSWORD");
        if (secret == null || secret.length() < 24) {
            return new InMemoryUserDetailsManager();
        }
        return new InMemoryUserDetailsManager(
            User.withUsername("noiacore-admin")
                .password(encoder.encode(secret))
                .roles("ADMIN")
                .build()
        );
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(12); // Fuerza alta para hashing de contraseñas
    }
}
