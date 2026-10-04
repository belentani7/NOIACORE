# FORJA v4.0 — Tenant Ownership Audit

## Scope

This audit covers every procedure exposed by `server/routers/enterprise.ts`. All enterprise procedures use `protectedProcedure`; the authenticated session supplies `organizationId`, `enterpriseRole` and human-approval capability. Client payloads cannot override those values because the router schemas do not include them.

## Route matrix

| Procedure | Kind | Organization boundary | Ownership enforcement | Evidence |
|---|---|---|---|---|
| `snapshot` | Read | `getEnterpriseSnapshot(ctx.user.organizationId)` | Organizations, workspaces, jobs, WAL, graph, policies, plugins, security events and keys are scoped to the session organization | `enterprise.snapshot.test.ts` |
| `auditLogs` | Read | Snapshot-scoped audit rows, then local filters/pagination | Workspace IDs are derived from the authenticated organization | `enterprise.router.test.ts` |
| `policies` | Read | Snapshot-scoped | Policy rows are filtered by `rbacPolicies.orgId` or preview `orgId` | `enterprise.router.test.ts` |
| `createPolicy` | Write | Server-derived `orgId` | RBAC `policy:manage`; insert uses derived org ID | `enterprise.enforcement.test.ts`, `enterprise.mutations.test.ts` |
| `updatePolicy` | Write | Server-derived `orgId` | Ownership lookup and update both use `(id, orgId)` | `enterprise.enforcement.test.ts` |
| `evaluatePolicy` | Read/decision | Server-derived org policy set | Evaluator receives only the session organization policy set | `enterprise.crypto.test.ts`, `enterprise.router.test.ts` |
| `deletePolicy` | Write | Server-derived `orgId` | Delete and preview removal both use `(id, orgId)` | `enterprise.enforcement.test.ts` |
| `organizations` | Read | Session organization only | Snapshot filter | `enterprise.snapshot.test.ts` |
| `createOrganization` | Write | New organization creation | Protected and RBAC-gated; does not accept a client organization ID | `enterprise.mutations.test.ts` |
| `inviteMember` | Write | Server-derived org plus workspace ownership | `assertWorkspaceBelongsToOrg(workspaceId, orgId)` before insert | `enterprise.enforcement.test.ts` |
| `workspaceMembers` | Read | Workspace must belong to session org | Workspace ownership check precedes member query | `enterprise.router.test.ts` |
| `updateMemberRole` | Write | Member workspace must belong to session org | Resolves member workspace, validates ownership, then updates | `enterprise.enforcement.test.ts` |
| `workspaces` | Read | Session organization | Snapshot filter | `enterprise.snapshot.test.ts` |
| `plugins` | Read | Session organization | DB `plugins.orgId` and preview `orgId` filtering | `enterprise.snapshot.test.ts` |
| `createPlugin` | Write | Server-derived org | RBAC `plugin:register`; insert uses derived org ID | `enterprise.enforcement.test.ts`, `enterprise.mutations.test.ts` |
| `togglePlugin` | Write | Server-derived org | DB lookup/update and preview lookup use `(id, orgId)` | Cross-tenant regression test |
| `jobs` | Read | Session organization workspaces | Snapshot-scoped | `enterprise.snapshot.test.ts` |
| `walEntries` | Read | Session organization jobs | Entries are selected from the scoped snapshot before optional job filtering | `enterprise.router.test.ts` |
| `createRefactorJob` | Write | Server-derived org plus workspace ownership | `assertWorkspaceBelongsToOrg` before insert | `enterprise.enforcement.test.ts`, `enterprise.mutations.test.ts` |
| `advanceRefactorJob` | Write | Server-derived org plus job ownership | DB lookup uses `(id, orgId)`; preview job must belong to an org workspace | Cross-tenant regression test |
| `securityEvents` | Read | Session organization | Snapshot-scoped | `enterprise.snapshot.test.ts` |
| `resolveSecurityEvent` | Write | Server-derived org | DB update uses `(id, orgId)`; preview records are only resolvable in org 1 | Cross-tenant regression test |
| `graph` | Read | Session organization workspaces | Returns graph nodes/edges filtered by scoped workspace IDs | `enterprise.snapshot.test.ts` |
| `trustedKeys` | Read | Session organization | DB `trusted_keys.orgId` and preview `orgId` filtering | `enterprise.snapshot.test.ts` |
| `createTrustedKey` | Write | Server-derived org | RBAC `trusted_key:manage`; insert uses derived org ID | `enterprise.enforcement.test.ts`, `enterprise.mutations.test.ts` |
| `revokeTrustedKey` | Write | Server-derived org | DB update uses `(id, orgId)`; preview lookup uses `(id, orgId)` | Cross-tenant regression test |
| `analytics` | Read | Session organization | Token/tool/audit rows are queried by organization-scoped snapshot | `enterprise.snapshot.test.ts` |

## Result

The route matrix is complete. Sensitive writes either carry the organization boundary directly in their database predicate or validate ownership through a workspace/job lookup before writing. The regression suite proves that an authenticated organization-2 administrator cannot mutate organization-1 policy, plugin, job, security, trusted-key or membership records by guessing their IDs.
