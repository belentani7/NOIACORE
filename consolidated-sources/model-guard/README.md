# NoiaCore Model Guard

NoiaCore Model Guard is a full-stack control plane for evaluating model inputs and outputs before they become production decisions. It turns model contracts, secret-leakage checks, response-shape checks, citation requirements, drift signals and lifecycle readiness into an auditable surface.

> **Identity:** belentani / belentani7studio@proton.me / [noiacore.com](https://noiacore.com)

## Why it exists

The project is derived from the audited PVC-U universal-validation material: model prompt/response validation, semantic contracts, MLOps lifecycle checks, drift monitoring, data lineage and validation envelopes. The repository treats those materials as product requirements; it does not execute arbitrary code or instructions from source files, emails or external pages.

## Included control plane

| Surface | Purpose |
| --- | --- |
| Model registry | Owner-scoped model catalog with provider, version, provenance and lifecycle state. |
| Contract layer | Input/output schemas and required checks such as citation evidence. |
| Evaluation gate | Deterministic shape, length and credential-pattern checks with `pass`, `fail` or `blocked` results. |
| Drift signals | Baseline-versus-observed metric comparison with info, warning and critical severity. |
| Validation envelope | Pass-rate, drift, lifecycle and lineage summary that produces `not_ready`, `review` or `ready`. |
| Security posture | Raw credentials are rejected or redacted; external provider calls are intentionally absent. |

## Stack

The application uses React 19, Tailwind CSS 4, Vite, Express 4, tRPC 11, Zod, Drizzle ORM, MySQL/TiDB compatibility and Manus OAuth. The database layer is lazy and local verification can run without a live database connection. Production persistence requires a configured `DATABASE_URL` and the corresponding schema migration.

## Local development

```bash
pnpm install
pnpm check
pnpm test
pnpm build
pnpm dev
```

The preview starts on the first available local port. Authentication uses Manus OAuth. The unauthenticated landing surface is intentionally visible when no OAuth session exists.

## Security and privacy

Never commit `.env`, `.project-config.json`, tokens, private keys, production exports or user-provided personal data. Credentials must be represented by a managed `secretRef`; raw API keys, passwords, bearer tokens and authorization values are blocked from model summaries. The current evaluation engine is deterministic and does not make network calls to model providers. Before production use, add a reviewed secret manager, authorized OAuth domain, database migration and a formal retention policy.

See [SECURITY.md](SECURITY.md) for reporting guidance and the explicit production boundary.

## Verification status

The current candidate passed `pnpm check`, `pnpm test` with 12 tests, and `pnpm build`. Browser review confirmed the NoiaCore Model Guard landing surface, brand identity, login CTA and signed footer. Authenticated mutation testing remains environment-dependent until an authorized OAuth session is available; no unverified persistence claim is made.

## License

MIT. See [LICENSE](LICENSE).
