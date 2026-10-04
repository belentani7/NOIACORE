# Research — Model Guard

## Accessibility and product design

Material Design presents accessibility as a default design value and recommends learning before defining solutions. This was translated into visible labels, keyboard-reachable controls, clear states, responsive layout and non-color-only status language. Source: [Material Design accessibility principles](https://m3.material.io/foundations/overview/principles).

## Secure code review

OWASP describes secure code review as manual examination that complements automated tools, with attention to architecture, inputs, authentication, authorization, data flows, business logic, errors and deployment. Model Guard applies that sequence to its server procedures, secret scrubbing, protected boundaries, deterministic rules and deployment documentation. Source: [OWASP Secure Code Review Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Secure_Code_Review_Cheat_Sheet.html).

## Supply chain

GitHub recommends understanding and updating dependencies as part of supply-chain security. Dependabot security updates can raise pull requests for vulnerable dependencies when patches are available. The repository therefore includes dependency-maintenance configuration and requires `pnpm audit --prod --audit-level=high` in the release gate. Sources: [GitHub supply-chain security](https://docs.github.com/en/code-security/how-tos/secure-your-supply-chain) and [Dependabot security updates](https://docs.github.com/en/code-security/concepts/supply-chain-security/dependabot-security-updates).

## Open-source reuse decision

The product uses the existing NoiaCore full-stack scaffold and its compatible UI primitives. No external repository code was copied into the product during this pass. The search policy is signal-based rather than a rigid 200-repository quota: only relevant, maintained and license-compatible projects should be considered, and their licenses must be reviewed before reuse.

## Data-source decision

No fabricated dataset is used. The core domain is an evaluation control plane that records user-provided model contracts and evaluation metadata. External open data and provider APIs are deliberately deferred until a concrete commercial use case, license, update frequency, attribution requirement and operating cost are documented.
