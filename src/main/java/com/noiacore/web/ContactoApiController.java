// BELENTANI OMEGA ULTRA
// Autoría: Pedro Belentani
// Fecha: 2026-08-14
package com.noiacore.web;

import com.noiacore.model.Contacto;
import com.noiacore.repository.ContactoRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * API real para el formulario de contacto ("Project Brief") de la landing.
 * No hay envío de email desde el servidor (evita tener que configurar SMTP);
 * el frontend sigue ofreciendo el mailto como antes. Esto solo persiste
 * el brief en el backend para que quede constancia real, consultable via API.
 */
@RestController
@RequestMapping("/api/contactos")
public class ContactoApiController {

    private final ContactoRepository repositorio;

    public ContactoApiController(ContactoRepository repositorio) {
        this.repositorio = repositorio;
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
    public ResponseEntity<Contacto> crear(@RequestBody Contacto contacto) {
        // Bound public inputs before storing any untrusted lead fields.
        // Email checks are basic syntax guards, not verification of ownership.
        if (contacto == null || !hasTextWithin(contacto.getNombre(), 150)
                || !hasTextWithin(contacto.getEmail(), 254)
                || !contacto.getEmail().matches("^[^\\s@\\r\\n]+@[^\\s@\\r\\n]+\\.[^\\s@\\r\\n]+$")
                || !within(contacto.getEmpresa(), 150)
                || !within(contacto.getTipo(), 100)
                || !within(contacto.getEtapa(), 100)
                || !within(contacto.getPresupuesto(), 100)
                || !within(contacto.getMensaje(), 6000)) {
            return ResponseEntity.badRequest().build();
        }
        return ResponseEntity.ok(repositorio.guardar(contacto));
    }

    private static boolean hasTextWithin(String value, int max) {
        return value != null && !value.isBlank() && value.length() <= max;
    }

    private static boolean within(String value, int max) {
        return value == null || value.length() <= max;
    }
}
