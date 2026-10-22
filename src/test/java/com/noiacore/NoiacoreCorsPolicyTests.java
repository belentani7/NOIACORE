package com.noiacore;

import com.noiacore.config.SecurityConfig;
import org.junit.jupiter.api.Test;
import org.springframework.mock.env.MockEnvironment;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;

import static org.junit.jupiter.api.Assertions.*;

class NoiacoreCorsPolicyTests {
    private static CorsConfiguration corsFor(String... profiles) {
        MockEnvironment environment = new MockEnvironment();
        environment.setActiveProfiles(profiles);
        CorsConfigurationSource source = new SecurityConfig().corsConfigurationSource(environment);
        CorsConfiguration cors = source.getCorsConfiguration(new MockHttpServletRequest("GET", "/api/contactos"));
        assertNotNull(cors);
        return cors;
    }

    @Test
    void productionDoesNotTrustLocalhostForCredentialedCrossOriginRequests() {
        CorsConfiguration cors = corsFor("prod");
        assertEquals(Boolean.TRUE, cors.getAllowCredentials());
        assertTrue(cors.getAllowedOrigins().contains("https://noiacore.com"));
        assertFalse(cors.getAllowedOrigins().contains("http://localhost:8099"));
        assertFalse(cors.getAllowedOrigins().contains("http://localhost:3000"));
        assertFalse(cors.getAllowedOrigins().contains("*"));
    }

    @Test
    void unprofiledDefaultAlsoDisallowsLocalhost() {
        CorsConfiguration cors = corsFor();
        assertFalse(cors.getAllowedOrigins().contains("http://localhost:8099"));
    }

    @Test
    void explicitDevelopmentProfileAllowsOnlyNamedLocalOrigins() {
        CorsConfiguration cors = corsFor("dev");
        assertTrue(cors.getAllowedOrigins().contains("http://localhost:8099"));
        assertTrue(cors.getAllowedOrigins().contains("http://localhost:3000"));
        assertFalse(cors.getAllowedOrigins().contains("http://localhost:4200"));
    }
}
