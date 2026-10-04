// BELENTANI OMEGA ULTRA
// Autoría: Pedro Belentani
// Fecha: 2026-08-14
package com.noiacore.repository;

import com.noiacore.model.Proyecto;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;

/**
 * Repositorio en memoria. Sirve como punto de partida: puede sustituirse
 * luego por Spring Data JPA + una base de datos real sin tocar el resto
 * de la aplicacion (controller y vistas usan esta misma interfaz publica).
 */
@Repository
public class ProyectoRepository {

    private final ConcurrentHashMap<Long, Proyecto> datos = new ConcurrentHashMap<>();
    private final AtomicLong secuencia = new AtomicLong(0);

    public ProyectoRepository() {
        guardar(new Proyecto(null, "NOIACORE Web", "Plataforma unificada full stack", "En progreso", LocalDate.now()));
        guardar(new Proyecto(null, "Migracion de archivos", "Consolidar proyectos dispersos", "Pendiente", LocalDate.now()));
    }

    public List<Proyecto> listarTodos() {
        return List.copyOf(datos.values());
    }

    public Optional<Proyecto> buscarPorId(Long id) {
        return Optional.ofNullable(datos.get(id));
    }

    public Proyecto guardar(Proyecto proyecto) {
        if (proyecto.getId() == null) {
            proyecto.setId(secuencia.incrementAndGet());
        }
        if (proyecto.getFecha() == null) {
            proyecto.setFecha(LocalDate.now());
        }
        datos.put(proyecto.getId(), proyecto);
        return proyecto;
    }

    public void eliminar(Long id) {
        datos.remove(id);
    }
}
