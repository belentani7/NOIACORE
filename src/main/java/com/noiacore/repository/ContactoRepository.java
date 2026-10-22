// BELENTANI OMEGA ULTRA
// Autoría: Pedro Belentani
package com.noiacore.repository;

import com.noiacore.model.Contacto;
import org.springframework.stereotype.Repository;

import java.time.Clock;
import java.time.Duration;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;

/**
 * Bounded, ephemeral intake for a single Spring instance. This is NOT
 * persistent storage: records disappear on restart or deployment.
 * Production requires consent, database, retention policy and backups.
 */
@Repository
public class ContactoRepository {
    public static final int MAX_BRIEFS = 500;
    public static final Duration RETENTION = Duration.ofDays(7);

    private final ConcurrentHashMap<Long, Contacto> datos = new ConcurrentHashMap<>();
    private final AtomicLong secuencia = new AtomicLong();
    private final Clock clock;

    public ContactoRepository() {
        this(Clock.systemUTC());
    }

    // Reproducible unit testing; Spring uses the public no-argument constructor.
    ContactoRepository(Clock clock) {
        this.clock = clock;
    }

    private void expireOldRecords() {
        LocalDateTime cutoff = LocalDateTime.ofInstant(clock.instant().minus(RETENTION), ZoneOffset.UTC);
        datos.entrySet().removeIf(entry -> {
            LocalDateTime received = entry.getValue().getRecibidoEn();
            return received == null || !received.isAfter(cutoff);
        });
    }

    public synchronized List<Contacto> listarTodos() {
        expireOldRecords();
        return datos.values().stream()
            .sorted((a, b) -> b.getRecibidoEn().compareTo(a.getRecibidoEn()))
            .toList();
    }

    public synchronized Contacto guardar(Contacto contacto) {
        expireOldRecords();
        if (datos.size() >= MAX_BRIEFS) {
            throw new IllegalStateException("Public brief capacity reached: persistent backend required");
        }
        contacto.setId(secuencia.incrementAndGet());
        contacto.setRecibidoEn(LocalDateTime.ofInstant(clock.instant(), ZoneOffset.UTC));
        datos.put(contacto.getId(), contacto);
        return contacto;
    }

    public synchronized int total() {
        expireOldRecords();
        return datos.size();
    }
}
