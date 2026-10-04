# FORJA v4.0 — Test Coverage Matrix

The suite is intentionally split by contract surface rather than by implementation file. It now contains **8 test files and 18 passing tests**.

| Area | Covered procedures or behavior | Evidence |
|---|---|---|
| Authentication | Logout cookie contract; anonymous access rejection | `auth.logout.test.ts`, `enterprise.contract.test.ts` |
| Merkle audit | Canonical SHA-256 payloads, chain verification and Ed25519 signature states | `enterprise.crypto.test.ts`, `enterprise.snapshot.test.ts` |
| RBAC | ALLOW, REQUIRE_HUMAN_APPROVAL, DENY, role precedence and protected writes | `enterprise.crypto.test.ts`, `enterprise.enforcement.test.ts` |
| Tenant boundary | All enterprise reads, known-ID cross-tenant writes, workspace ownership and org-derived actor context | `enterprise.tenant-audit.test.ts`, `enterprise.enforcement.test.ts` |
| Organizations and members | Invitation, member role updates, workspace lookup and preview-safe persistence | `enterprise.mutations.test.ts`, `enterprise.router.test.ts` |
| Plugin registry | Wasm plugin registration, Sigstore metadata, activation ownership and protected mutation | `enterprise.mutations.test.ts`, `enterprise.enforcement.test.ts` |
| Refactor/WAL | Job creation, batch advancement, durable WAL entries, terminal-state contract and scoped job access | `enterprise.mutations.test.ts`, `enterprise.contract.test.ts`, `enterprise.tenant-audit.test.ts` |
| Security and trust | Security event resolution, TrustedKey registration/revocation and ownership checks | `enterprise.mutations.test.ts`, `enterprise.enforcement.test.ts`, `enterprise.tenant-audit.test.ts` |
| Graph and analytics | Workspace-scoped graph nodes/edges, E2EE/vector-clock contract and honest empty analytics | `enterprise.snapshot.test.ts`, `enterprise.tenant-audit.test.ts`, `enterprise.contract.test.ts` |
| Input validation | Invalid pagination, malformed plugin payloads and invalid invitation email | `enterprise.contract.test.ts` |

## Runtime boundary

Production does not silently use the preview seed. If the database is unavailable and `FORJA_PREVIEW_MODE` is not explicitly set to `true`, the control plane returns `dataSource: "UNAVAILABLE"` with empty datasets and honest analytics. Development and test environments retain the controlled preview adapter so the UI can be exercised without creating permanent customer data.

## Commands

```bash
pnpm check
pnpm test
```

Both commands must pass before a production checkpoint is created.
