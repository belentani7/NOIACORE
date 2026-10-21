package com.noiacore.web;

import com.noiacore.model.Contacto;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneId;
import java.time.ZoneOffset;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

class BriefIntakePolicyTests {
    private static final class MutableClock extends Clock {
        Instant now = Instant.parse("2026-10-22T00:00:00Z");
        public ZoneId getZone() { return ZoneOffset.UTC; }
        public Clock withZone(ZoneId zone) { return this; }
        public Instant instant() { return now; }
        void advance(Duration delta) { now = now.plus(delta); }
    }

    private static Contacto valid() {
        Contacto c = new Contacto();
        c.setNombre("Marina");
        c.setEmail("marina@example.org");
        c.setMensaje("Ayuda con el proyecto");
        return c;
    }

    @Test
    void validatesRequiredAndBoundedContactFields() {
        BriefIntakePolicy policy = new BriefIntakePolicy();
        assertTrue(policy.isValid(valid()));
        Contacto c = valid();
        c.setEmail("malformed-mail");
        assertFalse(policy.isValid(c));
        c.setEmail("marina@example.org");
        c.setNombre(" ");
        assertFalse(policy.isValid(c));
        c.setNombre("M".repeat(121));
        assertFalse(policy.isValid(c));
        c.setNombre("Marina");
        c.setMensaje("x".repeat(4001));
        assertFalse(policy.isValid(c));
        c.setMensaje("Hola\u0000<script>");
        assertFalse(policy.isValid(c));
        c.setMensaje(null);
        assertTrue(policy.isValid(c));
        assertFalse(policy.isValid(null));
    }

    @Test
    void throttlesPerPeerAndResetsAfterWindow() {
        MutableClock clock = new MutableClock();
        BriefIntakePolicy policy = new BriefIntakePolicy(clock);
        for (int i=0; i<3; i++) assertTrue(policy.allow("203.0.113.2"));
        assertFalse(policy.allow("203.0.113.2"));
        assertTrue(policy.allow("203.0.113.3"));
        clock.advance(Duration.ofMinutes(15));
        assertTrue(policy.allow("203.0.113.2"));
    }

    @Test
    void rejectsInvalidPeersAndStopsUnboundedAddressGrowth() {
        BriefIntakePolicy policy = new BriefIntakePolicy();
        assertFalse(policy.allow(null));
        assertFalse(policy.allow(" "));
        assertFalse(policy.allow("X".repeat(129)));
        for (int i=0; i<BriefIntakePolicy.MAX_TRACKED_ADDRESSES; i++) {
            assertTrue(policy.allow("198.51."+(i/256)+"."+(i%256)));
        }
        assertFalse(policy.allow("203.0.113.100"));
    }
}
