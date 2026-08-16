// BELENTANI OMEGA ULTRA
// Autoría: Pedro Belentani
// Fecha: 2026-08-14
package com.noiacore.repository;

import com.noiacore.model.Contacto;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;

/**
 * Repositorio en memoria para los briefs de contacto reales enviados desde
 * el formulario de la web. Se pierde al reiniciar el proceso: es un punto
 * de partida honesto, no una promesa de persistencia duradera. Sustituir
 * por JPA + base de datos si se necesita conservar los leads entre reinicios.
 */
@Repository
public class ContactoRepository {

    private final ConcurrentHashMap<Long, Contacto> datos = new ConcurrentHashMap<>();
    private final AtomicLong secuencia = new AtomicLong(0);

    public List<Contacto> listarTodos() {
        return datos.values().stream()
                .sorted((a, b) -> b.getRecibidoEn().compareTo(a.getRecibidoEn()))
                .toList();
    }

    public Contacto guardar(Contacto contacto) {
        contacto.setId(secuencia.incrementAndGet());
        contacto.setRecibidoEn(LocalDateTime.now());
        datos.put(contacto.getId(), contacto);
        return contacto;
    }

    public int total() {
        return datos.size();
    }
}
