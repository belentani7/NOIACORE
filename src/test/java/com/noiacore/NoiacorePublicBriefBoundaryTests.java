package com.noiacore;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(properties = "NOIACORE_ADMIN_PASSWORD=")
@AutoConfigureMockMvc
class NoiacorePublicBriefBoundaryTests {
    @Autowired MockMvc mockMvc;

    @Test
    void receiptDoesNotEchoSensitiveFieldsOrPretendToBeDurable() throws Exception {
        mockMvc.perform(post("/api/contactos")
                .with(request -> { request.setRemoteAddr("198.51.100.242"); return request; })
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"nombre\":\"Alex\",\"email\":\"alex@example.org\",\"mensaje\":\"Mi proyecto privado\"}"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.id").isNumber())
            .andExpect(jsonPath("$.received").value(true))
            .andExpect(jsonPath("$.persistent").value(false))
            .andExpect(jsonPath("$.email").doesNotExist())
            .andExpect(jsonPath("$.mensaje").doesNotExist());
    }

    @Test
    void tooManySubmissionsAreRejectedEvenIfClientForgesForwardedFor() throws Exception {
        for (int i = 0; i < 3; i++) {
            mockMvc.perform(post("/api/contactos")
                    .with(request -> { request.setRemoteAddr("198.51.100.243"); return request; })
                    .header("X-Forwarded-For", "192.0.2." + i)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"nombre\":\"Alex\",\"email\":\"alex@example.org\"}"))
                .andExpect(status().isOk());
        }
        mockMvc.perform(post("/api/contactos")
                .with(request -> { request.setRemoteAddr("198.51.100.243"); return request; })
                .header("X-Forwarded-For", "192.0.2.200")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"nombre\":\"Alex\",\"email\":\"alex@example.org\"}"))
            .andExpect(status().isTooManyRequests());
    }

    @Test
    void malformedAndOversizedBriefsAreRejected() throws Exception {
        mockMvc.perform(post("/api/contactos")
                .with(request -> { request.setRemoteAddr("198.51.100.244"); return request; })
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"nombre\":\"Alex\",\"email\":\"invalid-address\"}"))
            .andExpect(status().isBadRequest());
        mockMvc.perform(post("/api/contactos")
                .with(request -> { request.setRemoteAddr("198.51.100.244"); return request; })
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"nombre\":\"Alex\",\"email\":\"alex@example.org\",\"mensaje\":\"" + "M".repeat(4001) + "\"}"))
            .andExpect(status().isBadRequest());
    }
}
