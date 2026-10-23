package com.noiacore;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class ContactPrivacyTests {
    @Autowired
    private MockMvc mvc;

    @Test
    void contactLeadsAndTotalsCannotBeReadAnonymously() throws Exception {
        mvc.perform(get("/api/contactos")).andExpect(status().isForbidden());
        mvc.perform(get("/api/contactos/total")).andExpect(status().isForbidden());
    }

    @Test
    void publicContactSubmissionsRemainAvailable() throws Exception {
        mvc.perform(post("/api/contactos")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"nombre\":\"Demo\",\"email\":\"test@example.invalid\"}"))
           .andExpect(status().isOk());
    }
}
