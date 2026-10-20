package com.noiacore;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(properties = "NOIACORE_ADMIN_PASSWORD=")
@AutoConfigureMockMvc
class NoiacoreSecurityBoundaryTests {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void contactRecordsAndTotalsRequireAuthentication() throws Exception {
        mockMvc.perform(get("/api/contactos")).andExpect(status().isUnauthorized());
        mockMvc.perform(get("/api/contactos/total")).andExpect(status().isUnauthorized());
    }

    @Test
    void anonymousUsersCanReadTheProjectCatalog() throws Exception {
        mockMvc.perform(get("/api/proyectos")).andExpect(status().isOk());
    }

    @Test
    void anonymousUsersCannotCreateOrDeleteProjects() throws Exception {
        mockMvc.perform(post("/api/proyectos")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{}"))
            .andExpect(status().isUnauthorized());

        mockMvc.perform(delete("/api/proyectos/1"))
            .andExpect(status().isUnauthorized());
    }

    @Test
    void publicBriefIntakeRemainsAvailable() throws Exception {
        mockMvc.perform(post("/api/contactos")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"nombre\":\"QA\",\"email\":\"qa@example.invalid\"}"))
            .andExpect(status().isOk());
    }

    @Test
    void unknownApiRoutesRemainClosed() throws Exception {
        mockMvc.perform(get("/api/unknown"))
            .andExpect(status().is4xxClientError());
    }
}
