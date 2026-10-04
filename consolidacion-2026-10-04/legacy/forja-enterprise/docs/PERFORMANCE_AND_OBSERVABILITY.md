# FORJA v4.0 — Performance and Observability Controls

## Performance controls

The control plane uses a single snapshot query with a bounded five-second refresh interval, a four-second stale window, focus-triggered refresh and `refetchIntervalInBackground: false` so hidden tabs do not create unnecessary database load. The authenticated procedure reads use `Promise.all` for independent organization, workspace, audit, policy, plugin, job, WAL, security, graph, key and analytics sources. Every result is filtered by the authenticated organization before it reaches tRPC or the UI. Pagination is enforced at the audit router boundary with a page size between 5 and 100.

The database path is preferred whenever available. Preview seed data is isolated behind `FORJA_PREVIEW_MODE=true` in production and is not used by default. If production cannot reach the database, the API returns `dataSource: "UNAVAILABLE"` rather than presenting seed metrics as customer activity.

The schema includes explicit additive indexes for the critical tenant and workspace paths: `workspaces_org_idx`, `audit_logs_org_time_idx`, `rbac_policies_org_role_idx`, `plugins_org_idx`, `security_events_org_time_idx`, `trusted_keys_org_idx`, `refactor_jobs_org_workspace_status_idx`, `graph_nodes_workspace_idx`, `graph_edges_workspace_from_idx`, `graph_edges_workspace_to_idx`, `token_usage_org_time_idx` and `tool_metrics_org_tool_idx`. Migration `drizzle/0006_aberrant_killer_shrike.sql` was reviewed and applied successfully; it contains only `CREATE INDEX` statements and no destructive operations.

## Resilience controls

The frontend retries snapshot reads twice, exposes a `role="alert"` error state, provides an explicit retry action, and uses `role="status"` for initial loading. The server preserves operation semantics for terminal WAL states and rejects cross-tenant mutations before persistence. The test suite covers malformed inputs, anonymous access, empty organization reads and terminal WAL behavior.

## Structured observability

Every authenticated enterprise tRPC procedure uses an instrumented middleware that writes one structured JSON completion record containing the service name, procedure path, request type, timestamp, authenticated `organizationId`, exact `enterpriseRole`, duration in milliseconds, outcome and error code when applicable. No request payloads, tokens, file contents or secrets are logged. Successful calls use informational severity; failed calls use warning severity.

Example shape:

```json
{"service":"forja-control-plane","event":"rpc_complete","path":"enterprise.snapshot","type":"query","organizationId":7,"enterpriseRole":"ciso","durationMs":12,"outcome":"ok"}
```

`observability.test.ts` verifies both success and failure log contracts. The managed runtime can collect these JSON lines into its standard log stream without requiring a long-running worker or external process.
