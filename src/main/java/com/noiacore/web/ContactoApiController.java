// BELENTANI OMEGA ULTRA
// Autoría: Pedro Belentani
// Public brief intake with bounded input and in-process abuse guards.
package com.noiacore.web;

import com.noiacore.model.Contacto;
import com.noiacore.repository.ContactoRepository;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Public intake returns only receipt metadata, never the submitted personal
 * information. Admin-only reads are enforced separately in SecurityConfig.
 * This in-memory demo is NOT durable lead delivery.
 */
@RestController
@RequestMapping("/api/contactos")
public class ContactoApiController {

    private final ContactoRepository repositorio;
    private final BriefIntakePolicy policy;

    public ContactoApiController(ContactoRepository repositorio, BriefIntakePolicy policy) {
        this.repositorio = repositorio;
        this.policy = policy;
    }

    @GetMapping
    public List<Contacto> listar() {
        return repositorio.listarTodos();
    }

    @GetMapping("/total")
    public Map<String, Integer> total() {
        return Map.of("total", repositorio.total());
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> crear(@RequestBody Contacto contacto, HttpServletRequest request) {
        // The transport peer, not a user-controlled X-Forwarded-For header.
        if (!policy.allow(request.getRemoteAddr())) {
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS).build();
        }
        if (!policy.isValid(contacto)) {
            return ResponseEntity.badRequest().build();
        }
        try {
            Contacto saved = repositorio.guardar(contacto);
            return ResponseEntity.ok(Map.of("id", saved.getId(), "received", true,
                                             "persistent", false));
        } catch (IllegalStateException capacityReached) {
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).build();
        }
    }
}
