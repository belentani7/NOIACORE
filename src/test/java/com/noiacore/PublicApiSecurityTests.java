package com.noiacore;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.web.FilterChainProxy;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;

/**
 * Security boundary around public web/brief and internal APIs.
 * No anonymous visitor may read submitted leads or modify projects.
 */
@SpringBootTest
class PublicApiSecurityTests {
    @Autowired
    WebApplicationContext webContext;

    @Autowired
    FilterChainProxy springSecurityFilterChain;

    MockMvc mvc;

    @BeforeEach
    void setUp() {
        mvc = MockMvcBuilders.webAppContextSetup(webContext)
            .addFilters(springSecurityFilterChain).build();
    }

    @Test
    void privateContactRecordsAreNeverPublic() throws Exception {
        mvc.perform(get("/api/contactos")).andExpect(status().isForbidden());
        mvc.perform(get("/api/contactos/total")).andExpect(status().isForbidden());
    }

    @Test
    void anonymousProjectMutationsAreBlocked() throws Exception {
        mvc.perform(post("/api/proyectos")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"nombre\":\"unsafe\"}")).andExpect(status().isForbidden());
        mvc.perform(delete("/api/proyectos/1")).andExpect(status().isForbidden());
        mvc.perform(get("/api/proyectos")).andExpect(status().isOk());
    }

    @Test
    void contactSubmissionRemainsPublicButBounded() throws Exception {
        mvc.perform(post("/api/contactos")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"nombre\":\"Demo\",\"email\":\"valid@example.test\",\"mensaje\":\"Hola\"}"))
            .andExpect(status().isOk()).andExpect(jsonPath("$.email").doesNotExist());
        mvc.perform(post("/api/contactos")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"nombre\":\"Demo\",\"email\":\"invalid-email\"}"))
            .andExpect(status().isBadRequest());
    }
}
