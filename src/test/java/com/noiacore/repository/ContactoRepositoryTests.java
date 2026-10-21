package com.noiacore.repository;

import com.noiacore.model.Contacto;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneId;
import java.time.ZoneOffset;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

class ContactoRepositoryTests {
    private static final class MutableClock extends Clock {
        Instant now = Instant.parse("2026-10-22T00:00:00Z");
        public ZoneId getZone() { return ZoneOffset.UTC; }
        public Clock withZone(ZoneId zone) { return this; }
        public Instant instant() { return now; }
        void advance(Duration by) { now = now.plus(by); }
    }

    private Contacto sample() {
        Contacto c = new Contacto();
        c.setNombre("Lucia");
        c.setEmail("lucia@example.org");
        return c;
    }

    @Test
    void receiptAssignsUniqueIdsAndSevenDayRetention() {
        MutableClock clock = new MutableClock();
        ContactoRepository repository = new ContactoRepository(clock);
        Long first = repository.guardar(sample()).getId();
        assertNotNull(first);
        assertEquals(1, repository.total());
        clock.advance(Duration.ofDays(7).plusSeconds(1));
        assertEquals(0, repository.total());
        Long second = repository.guardar(sample()).getId();
        assertTrue(second > first);
        assertEquals(1, repository.listarTodos().size());
    }

    @Test
    void doesNotSilentlyOverwriteOrGrowForever() {
        ContactoRepository repository = new ContactoRepository();
        for (int i=0; i<ContactoRepository.MAX_BRIEFS; i++) {
            repository.guardar(sample());
        }
        assertEquals(ContactoRepository.MAX_BRIEFS, repository.total());
        assertThrows(IllegalStateException.class, () -> repository.guardar(sample()));
        assertEquals(ContactoRepository.MAX_BRIEFS, repository.total());
    }
}
