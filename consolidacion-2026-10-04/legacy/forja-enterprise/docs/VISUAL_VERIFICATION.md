# Visual verification

Se verificó la ruta `/` en viewport de escritorio de 1280x720 y en viewport móvil de 390x844.

En escritorio, el dashboard mantiene la composición de control plane con navegación lateral, métricas en tarjetas, telemetría y estado de la FSM. En móvil, la navegación se colapsa a una barra superior con menú, las acciones principales permanecen accesibles y las tarjetas métricas se apilan sin desbordamiento horizontal visible.

La base de datos del entorno de preview no contiene registros enterprise, por lo que las métricas muestran `0` y las gráficas permanecen vacías de forma honesta. No se considera un error visual: el estado vacío corresponde a la ausencia de datos persistidos y las vistas incluyen estados vacíos explícitos.

La segunda verificación, realizada después del reinicio final, confirma que el dashboard sigue renderizando correctamente en escritorio y móvil. El layout responsive conserva el acceso a `Export evidence` y `Launch pipeline`; las tarjetas de métricas se apilan y no muestran overflow horizontal en 390x844.

## 10/10 hardening pass — 2026-08-16

The desktop screenshot confirms the dark control-plane hierarchy, authenticated tenant chrome, live status indicator, data-source footer, empty-state handling and dense telemetry layout remain aligned after the tenant hardening changes. The mobile screenshot confirms the sidebar collapses, metrics stack into a single column, charts and FSM panels remain readable, audit/security panels preserve their spacing, and the E2EE workspace mesh remains reachable without horizontal overflow.

The empty database state is intentionally rendered as a verified idle posture rather than fabricated activity: zero metrics, no signed transitions, no configured workspace mesh and `DATABASE` shown as the source. The mobile layout uses the explicit Forja copy “Verified idle — no signed transitions” and “Mesh awaiting attestation” to distinguish a secure idle state from a broken view.
