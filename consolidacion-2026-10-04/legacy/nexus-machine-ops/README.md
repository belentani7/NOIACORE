# Belentani NEXUS

## The idea

**Belentani NEXUS is a verifiable operating infrastructure for human-augmented work.** It is designed to turn scattered ideas, documents, code, creative assets, AI workflows, business opportunities and social-impact projects into traceable deliverables and governed decisions.

NEXUS is not a generic chatbot, a portfolio page, a promise of autonomous intelligence or a single product that forces every activity into one category. It is a **shared operating layer** for work that may look different at the surface but follows the same deeper cycle:

> **Capture → contextualize → plan → produce → verify → approve → deliver → learn.**

A musical production, a software audit, a commercial proposal, an educational document and a machine simulation can all use this cycle. Their inputs, outputs, sensitivity and approval rules differ; the control model remains coherent.

## Strategic direction

The strategic direction is to build a **NEXUS of evidence, workflows and reusable assets**. The platform should make the whole ecosystem legible without flattening it. It must answer, at any point:

- What is active, experimental, delivered, archived or blocked?
- Which repository or artifact is canonical?
- Who owns the next decision?
- What evidence supports the current status?
- Which actions can be automated, and which require a human gate?
- Which capabilities can become a repeatable offer?

The first commercial wedge is **verifiable automation and audit for complex work**. Creative production, document workflows, education, social impact, business operations and simulation remain verticals that can reuse the same core.

## What the platform unifies

| Domain | Examples of work | Shared NEXUS capability |
|---|---|---|
| AI and agents | Prompts, skills, model routing, assistants and automation | Governed workflow execution with costs, tools and review gates |
| Evidence and trust | Audits, validation, decision traces and integrity records | Reconstructible evidence, policies, approvals and audit ledger |
| Creative production | Music, audio, visual design, video and studio assets | Versioned production packages and quality checks |
| Knowledge and impact | Documents, education, migration and community resources | Protected dossiers, source context and controlled delivery |
| Commercial operations | Revenue pipeline, proposals, CRM and service delivery | Opportunities, workflows, ownership and measurable outcomes |
| Simulation and operations | Machine states, telemetry and safety protocols | Deterministic simulation, risk checks and triple confirmation |

These domains are not automatically merged. Sensitive personal material, client data, creative works, social projects and experimental systems remain isolated by permissions, namespaces and explicit references.

## Core capabilities

The platform is organized around ten reusable capabilities:

1. **Capture:** register an idea, request, document, signal, file or external event with origin and sensitivity.
2. **Context:** attach authorized sources and versioned context without exposing unrelated data.
3. **Planning:** define objectives, dependencies, constraints, owners, cost limits and completion criteria.
4. **Production:** create code, text, audio, images, video, data products or business deliverables.
5. **Evaluation:** run rules, tests, checklists, model assessments and human reviews.
6. **Approval:** separate the person or agent that prepares work from the person or quorum that authorizes it.
7. **Delivery:** generate a reproducible package with manifest, version, provenance and hash.
8. **Learning:** turn rejection, failure, feedback and results into new policy, templates or workflow improvements.
9. **Commercialization:** connect a real problem to a bounded offer and measure user, time, quality, cost or revenue signals.
10. **Governance:** apply identity, roles, retention, permissions, audit, redaction and revocation.

The primary asset is not “AI”. It is the combination of **workflow + evidence + reusable asset + outcome**. AI providers and models are replaceable components inside that operating cycle.

## Current implementation

This repository currently contains a working web-based operations console for the first controlled domain: a machine operations simulator. The console is intentionally bounded and is not a physical control system.

Implemented capabilities include:

- A deterministic machine simulator with protected states, synthetic telemetry and alarms.
- A typed simulation gateway with idempotency, input validation and explicit simulation-only boundaries.
- Triple confirmation for critical commands: policy and role validation, simulator state/risk validation, and explicit human approval.
- Independence rules that prevent a requester from approving their own critical command.
- Persistent commands, approvals, events, decision traces, alarms and audit records.
- Append-only application audit records with chained integrity metadata.
- Authenticated server-sent events for operational updates.
- Role-aware operation procedures and protected server routes.
- Tests for gateway behavior, transitions, alarms, expiration, incomplete approval, rejection and traceability.
- A responsive operations center showing machine state, telemetry, alarm state, command queue and the three verification nodes.

The machine adapter is `SimulationMachineAdapter`. There is no physical hardware adapter, physical route, deployment control, spending control or secret-management action in this phase.

## Safety boundary

The current system must remain simulation-only. The following are prohibited by design:

- Direct communication with physical hardware or industrial control systems.
- Automatic execution of irreversible or safety-critical actions.
- Autonomous permission changes, secret rotation, spending, deployment or publication.
- Treating an AI answer as an approval or as evidence of reality.
- Skipping any confirmation node because another node is unavailable.
- Self-approval of a critical command.
- Mixing private, personal, client, social-impact and public data without explicit authorization.

A future physical integration is not a feature toggle. It would require a separate certified adapter, threat model, independent safety review, hardware-in-the-loop testing, access controls, emergency procedures, operational ownership and a new approval regime.

## Architecture

The intended architecture is a modular monolith first, with stable contracts and durable boundaries before any move to distributed services.

```text
Authorized sources
 GitHub · Drive · Gmail · manual input · creative files
          │
          ▼
Ingestion and catalog
 provenance · sensitivity · permissions · hashes · canonicalization
          │
          ▼
NEXUS work graph
 projects · work items · tasks · assets · decisions · evidence
          │
     ┌────┼─────────────┬──────────────┐
     ▼    ▼             ▼              ▼
Trust  Agent/Workflow  Creative       Commercial
& audit runtime       production      operations
     └────┴─────────────┴──────────────┘
          │
          ▼
Human review · policy gates · audit ledger · reporting
          │
          ▼
Versioned delivery · metrics · learning
```

The initial technical foundation is React, TypeScript, Express, tRPC, Drizzle and a relational database. The current simulator is a safe proving ground for command contracts, auditability and approval protocols. It should not be confused with industrial control software.

## Portfolio model

Every initiative must have one of five classifications:

| Class | Meaning | Required decision |
|---|---|---|
| **Core** | Reusable platform capability | Maintain, test and document |
| **Vertical** | A bounded solution for a defined audience | Validate with a real workflow or customer |
| **Lab** | Technical or creative experiment | Set a review date and promotion/closure criteria |
| **Asset** | A work, document, package or reusable artifact | Version, protect and catalog |
| **Archive** | Preserved work without active investment | Keep safely without consuming active focus |

A new repository or artifact is not considered strategically active unless it has an owner, a target user, a next decision, a completion criterion and a review date.

## Product direction

The first product family should remain narrow enough to validate:

### NEXUS Audit

For small teams with scattered software, AI or documentation processes. It produces a system map, risk register, evidence matrix, controls and a prioritized backlog.

### NEXUS Flow

For professionals and small businesses with repetitive commercial or administrative work. It produces an approved workflow with templates, assistants, review gates and before/after measurements.

### NEXUS Studio

For creative teams and individual creators. It produces versioned and reviewable packages for audio, visual, video or document delivery.

These are different offers built on the same core. The platform should validate the core through three bounded workflows before adding more verticals.

## Roadmap

### First 15 days: canonization

Create one catalog for repositories, Drive families, projects, assets, owners, sensitivity and canonical versions. Link evidence to the correct work item and classify experiments, products, assets and archives. Do not add new domains during this phase.

### Days 16–35: operating core

Complete project, work item, asset, decision, permission, sensitivity and audit primitives. Add read-only connectors with explicit synchronization logs. Keep external writes disabled unless a future workflow adds a dedicated approval gate.

### Days 36–60: three workflows

Build one audit workflow, one commercial workflow and one creative or document workflow. Each must have bounded inputs, a cost model, human intervention points, quality criteria, known failure modes and a reproducible final package.

### Days 61–90: value validation

Measure time saved, error reduction, rework, quality, cost, user satisfaction and real commercial signals. Promote only workflows that demonstrate value. Freeze or archive the rest without deleting their evidence.

## Repository map

| Path | Purpose |
|---|---|
| `client/` | Operations center UI and reusable interface components |
| `server/machine/` | Simulator, gateway, protocol, alarms, audit, service and stream logic |
| `server/routers.ts` | Typed server procedures and application router |
| `shared/` | Shared machine contracts and types |
| `drizzle/` | Relational schema and migrations |
| `docs/` | Protocols, audits, architecture, ecosystem proposal, inventories and strategy |
| `todo.md` | Verifiable project history and completion checklist |

The `docs/` directory contains the strategic explanation and evidence supporting this repository. In particular, start with `DIRECCION_NEXUS.md`, `PROPUESTA_NUCLEO_BELENTANI.md`, `ANALISIS_METADATOS_NICHOS_TIEMPOS.md`, `AUDITORIA_COHERENCIA_NODOS.md` and `PROMPT_MAESTRO_INFRAESTRUCTURA.md`.

## Local development

```bash
pnpm install
pnpm check
pnpm test
pnpm dev
```

The development server must be treated as a single managed process. Do not add listeners, background workers or direct hardware integrations to this repository without first revisiting the safety boundary and deployment model.

## Decision standard

NEXUS is successful when it makes complex work **more legible, more reproducible, safer to automate and easier to deliver**. More repositories, more prompts or more dashboards are not success by themselves. The next decision should be based on real users, measurable outcomes, evidence quality and sustainable maintenance.

## Project status

This is a simulation-first operations platform and a strategic nucleus for a broader ecosystem. It is a functioning foundation for governed workflows, not a claim that every proposed vertical, AI capability or external integration already exists. The repository deliberately records both its capabilities and its limits so that future expansion can be reviewed rather than assumed.
