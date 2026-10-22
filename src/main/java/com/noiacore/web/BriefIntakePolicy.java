package com.noiacore.web;

import com.noiacore.model.Contacto;
import java.time.Clock;
import java.time.Duration;
import java.util.HashMap;
import java.util.Iterator;
import java.util.Map;
import java.util.regex.Pattern;
import org.springframework.stereotype.Component;

/**
 * Conservative single-instance guard for public briefs. This is NOT distributed
 * abuse prevention, durable persistence, or a replacement for a WAF.
 *
 * Do not read client-supplied X-Forwarded-For: the reverse proxy must establish
 * trusted source addresses before enabling multi-instance production intake.
 */
@Component
public final class BriefIntakePolicy {
    static final int MAX_REQUESTS = 3;
    static final int MAX_TRACKED_ADDRESSES = 2048;
    static final Duration WINDOW = Duration.ofMinutes(15);
    private static final Pattern EMAIL = Pattern.compile("^[^\\s@<>]+@[^\\s@<>]+\\.[^\\s@<>.]{2,63}$");

    private final Clock clock;
    private final Map<String, WindowCounter> addresses = new HashMap<>();

    public BriefIntakePolicy() {
        this(Clock.systemUTC());
    }

    // Package-private injection permits deterministic tests with fixed clocks.
    BriefIntakePolicy(Clock clock) {
        this.clock = clock;
    }

    public boolean isValid(Contacto brief) {
        return brief != null
            && required(brief.getNombre(), 120)
            && required(brief.getEmail(), 254)
            && EMAIL.matcher(brief.getEmail().trim()).matches()
            && optional(brief.getEmpresa(), 160)
            && optional(brief.getTipo(), 120)
            && optional(brief.getEtapa(), 120)
            && optional(brief.getPresupuesto(), 120)
            && optional(brief.getMensaje(), 4000);
    }

    private static boolean required(String value, int maxLength) {
        return value != null && !value.isBlank() && optional(value, maxLength);
    }

    private static boolean optional(String value, int maxLength) {
        if (value == null) return true;
        if (value.length() > maxLength) return false;
        for (int i = 0; i < value.length(); i++) {
            char c = value.charAt(i);
            if (c == 0 || (Character.isISOControl(c) && c != '\n' && c != '\r' && c != '\t')) {
                return false;
            }
        }
        return true;
    }

    /**
     * Count incoming submissions (including invalid bodies) per real peer IP.
     * Fail closed if the map is full. A shared-NAT user group shares its quota.
     */
    public synchronized boolean allow(String peerIp) {
        if (peerIp == null || peerIp.isBlank() || peerIp.length() > 128) return false;
        final long now = clock.millis();
        final long windowMillis = WINDOW.toMillis();
        Iterator<WindowCounter> iterator = addresses.values().iterator();
        while (iterator.hasNext()) {
            WindowCounter counter = iterator.next();
            if (now >= counter.startedAt && now - counter.startedAt >= windowMillis) {
                iterator.remove();
            }
        }
        WindowCounter counter = addresses.get(peerIp);
        if (counter == null) {
            if (addresses.size() >= MAX_TRACKED_ADDRESSES) return false;
            counter = new WindowCounter(now);
            addresses.put(peerIp, counter);
        }
        if (counter.requests >= MAX_REQUESTS) return false;
        counter.requests++;
        return true;
    }

    private static final class WindowCounter {
        final long startedAt;
        int requests;
        WindowCounter(long startedAt) { this.startedAt = startedAt; }
    }
}
