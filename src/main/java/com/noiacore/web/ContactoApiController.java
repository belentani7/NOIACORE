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
        if (contacto.getNombre() == null || contacto.getNombre().isBlank()
                || contacto.getEmail() == null || contacto.getEmail().isBlank()) {
            return ResponseEntity.badRequest().build();
        }
        return ResponseEntity.ok(repositorio.guardar(contacto));
    }
}
