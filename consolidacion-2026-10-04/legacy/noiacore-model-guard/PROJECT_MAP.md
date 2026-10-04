# Project Map — NoiaCore Model Guard

## Boundary

`noiacore-model-guard` is one independent product. Its identity, data model, API, UI, tests, automation boundary and deployment notes remain separate from PVC-U Console, Gateway Lab and the other NoiaCore products.

## Runtime map

```text
Browser
  -> React/Vite UI
  -> typed tRPC client
  -> Express /api/trpc
  -> protected procedures
  -> deterministic Model Guard rules
  -> Drizzle ORM / MySQL-TiDB
  -> audit-ready model, contract, evaluation, drift and envelope records
```

## Repository map

| Directory   | Responsibility                                                                                              |
| ----------- | ----------------------------------------------------------------------------------------------------------- |
| `client/`   | React UI, accessibility states, responsive surfaces and NoiaCore visual system.                             |
| `server/`   | tRPC procedures, authentication boundary, database helpers and deterministic guard rules.                   |
| `drizzle/`  | Domain schema and migration artifacts.                                                                      |
| `shared/`   | Shared contracts and constants.                                                                             |
| `docs/`     | Product architecture, browser evidence, security boundaries and operating notes.                            |
| `RESEARCH/` | Project-specific external research and source links.                                                        |
| `tests/`    | Reserved boundary for future end-to-end tests; unit/integration tests currently live beside server modules. |
| `scripts/`  | Reserved for reproducible audits and migrations; no arbitrary external scripts are executed.                |
| `assets/`   | Reserved for reviewed, licensed assets; no large local media is required by the current product.            |
| `.github/`  | CI and dependency-maintenance policy.                                                                       |

## Data map

The domain contains model registry records, model contracts, evaluations, drift signals and validation envelopes. The current backend uses protected procedures and an explicit local fallback where database configuration is unavailable. Production requires reviewed migrations, indexes, retention, backups and tenant-isolation design.

## Automation map

The current automation is evaluation-to-readiness processing and test/build verification. A future production flow is:

```text
model event -> webhook or queue -> contract evaluation -> drift/readiness gate -> ledger -> notification
```

No external webhook, queue or provider is enabled by default. This prevents accidental network calls and keeps the local product deterministic.

## Delivery map

The public repository is maintained under `belentani7/noiacore-model-guard`. ZIP delivery remains independent from GitHub publication. Every future release must pass the repository gate: secrets scan, dependency audit, typecheck, tests, build, README/security/license checks and manual browser review.
