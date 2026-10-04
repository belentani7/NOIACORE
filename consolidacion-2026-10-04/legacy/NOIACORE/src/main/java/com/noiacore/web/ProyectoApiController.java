// BELENTANI OMEGA ULTRA
// Autoría: Pedro Belentani
// Fecha: 2026-08-14
package com.noiacore.web;

import com.noiacore.model.Proyecto;
import com.noiacore.repository.ProyectoRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/proyectos")
public class ProyectoApiController {

    private final ProyectoRepository repositorio;

    public ProyectoApiController(ProyectoRepository repositorio) {
        this.repositorio = repositorio;
    }

    @GetMapping
    public List<Proyecto> listar() {
        return repositorio.listarTodos();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Proyecto> obtener(@PathVariable Long id) {
        return repositorio.buscarPorId(id)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<Proyecto> crear(@RequestBody Proyecto proyecto) {
        proyecto.setId(null);
        return ResponseEntity.ok(repositorio.guardar(proyecto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(@PathVariable Long id) {
        repositorio.eliminar(id);
        return ResponseEntity.noContent().build();
    }
}
