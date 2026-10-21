package com.noiacore;

import java.nio.charset.StandardCharsets;
import java.util.Base64;
import com.jayway.jsonpath.JsonPath;
import org.springframework.test.web.servlet.MvcResult;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(properties = "NOIACORE_ADMIN_PASSWORD=test-only-noiacore-admin-secret-32chars")
@AutoConfigureMockMvc
class NoiacoreAdminAuthenticationTests {

    private static final String ADMIN_PASSWORD = "test-only-noiacore-admin-secret-32chars";
    private static final String WRONG_PASSWORD = "incorrect-test-password";

    @Autowired
    private MockMvc mockMvc;

    @Test
    void configuredAdminCanReadContactRecords() throws Exception {
        mockMvc.perform(get("/api/contactos")
                .header("Authorization", basicAuth(ADMIN_PASSWORD)))
            .andExpect(status().isOk());

        mockMvc.perform(get("/api/contactos/total")
                .header("Authorization", basicAuth(ADMIN_PASSWORD)))
            .andExpect(status().isOk());
    }

    @Test
    void invalidAdminCredentialsAreRejected() throws Exception {
        mockMvc.perform(get("/api/contactos")
                .header("Authorization", basicAuth(WRONG_PASSWORD)))
            .andExpect(status().isUnauthorized());
    }

    @Test
    void configuredAdminCanManageProjects() throws Exception {
        MvcResult created = mockMvc.perform(post("/api/proyectos")
                .header("Authorization", basicAuth(ADMIN_PASSWORD))
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"nombre\":\"CI test\",\"descripcion\":\"API boundary\",\"estado\":\"Pendiente\"}"))
            .andExpect(status().isOk())
            .andReturn();
        Number createdId = JsonPath.read(created.getResponse().getContentAsString(), "$.id");

        mockMvc.perform(delete("/api/proyectos/" + createdId.longValue())
                .header("Authorization", basicAuth(ADMIN_PASSWORD)))
            .andExpect(status().isNoContent());

        mockMvc.perform(get("/api/proyectos/" + createdId.longValue()))
            .andExpect(status().isNotFound());
        // Deleting our own test record must never remove the pre-seeded catalog.
        mockMvc.perform(get("/api/proyectos/1"))
            .andExpect(status().isOk());
    }

    private static String basicAuth(String password) {
        String credentials = "noiacore-admin:" + password;
        return "Basic " + Base64.getEncoder()
            .encodeToString(credentials.getBytes(StandardCharsets.UTF_8));
    }
}
