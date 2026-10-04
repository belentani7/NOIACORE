# Security Policy

## Scope

NoiaCore Model Guard is a validation control plane. It is not a hosted model provider, a secret manager or a guarantee of regulatory compliance. The deterministic guard is designed to fail closed on obvious credential patterns and unsafe lifecycle states, but it is not a substitute for domain-specific review.

## Reporting

Please do not open a public issue containing credentials, personal data, exploit payloads or private infrastructure details. Report a suspected vulnerability privately to the project owner through the contact identity in the repository footer: `belentani7studio@proton.me`.

## Release boundary

Before production deployment, operators must configure an authorized OAuth domain, a managed secret reference system, a reviewed MySQL/TiDB migration, backup and retention controls, network egress policy, audit-log retention and domain-specific validation requirements. External model-provider calls are not enabled by this repository by default.

## Secret handling

Do not commit `.env` files, `.project-config.json`, access tokens, private keys, database dumps or copied Gmail/Drive content. Use environment variables and secret references. If a credential is exposed, revoke it immediately and rotate the affected integration.
