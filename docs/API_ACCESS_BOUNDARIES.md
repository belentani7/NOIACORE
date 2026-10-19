# NOIACORE / API access and data privacy

This repository includes a Java/Spring application serving an artistic/enterprise
landing and its optional in-memory REST APIs. The frontend and APIs are separate
trust boundaries.

## Public (without authentication)

- `GET /` and static files: informational website
- `GET /api/proyectos`, `GET /api/proyectos/{id}`: catalog
- `POST /api/contactos`: submit a project brief (still subject to anti-spam,
  privacy, retention and production storage implementation)

## Restricted (HTTP Basic over HTTPS)

- `GET /api/contactos` and `GET /api/contactos/total`: project briefs and
  personally identifying contact details
- `POST /api/proyectos`: create records
- `DELETE /api/proyectos/{id}`: delete records
- Any other unrecognized `/api/**` endpoint: denied by default

Configure `NOIACORE_ADMIN_PASSWORD` **only on the server** using the deployment
secret manager. It must be 24+ characters, randomly generated. Username:
`noiacore-admin`. There are no baked-in credentials or fallback password;
without a strong value, no admin user is created and administrative actions
remain inaccessible. **Do not put credentials into this repository or the
frontend, including NEXT_PUBLIC_ or VITE_ variables.**

Examples for an internal operator (replace the host and use your own secure
password entry method):

```bash
curl --fail --basic --user "noiacore-admin" \
  "https://YOUR_HTTPS_HOST/api/contactos"
```

Avoid browser Basic-auth on public shared devices. Protect the server with HTTPS,
rate-limiting, reverse-proxy access controls, and an external identity provider
before deploying as a genuine multi-user enterprise system. Default API CSRF
protection is disabled due to the stateless design: any future browser-based
admin surface needs explicit CSRF and session design.

**Important:** contacts still live in memory and disappear on server restart.
The anonymous submission endpoint is not anti-spam hardened; configure abuse
protection and real storage/retention/consent policies before publishing.
Do not claim enterprise compliance, persistence or verified lead delivery.
