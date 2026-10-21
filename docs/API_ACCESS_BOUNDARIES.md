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
The public POST endpoint has a basic, per-transport-peer protection of **3
requests / 15 minutes**, **2,048** tracked peers maximum per JVM, and bounded
field lengths; client-controlled `X-Forwarded-For` is ignored. Once **500**
unexpired briefs are held in memory, new submissions return HTTP 503 rather
than silently overwriting an existing lead. Records are discarded after
**7 days** (and immediately on restart/redeploy). These guards are process-local:
multiple instances do not share counters or records, and a shared NAT shares its
submission quota. This is not a WAF, GDPR-compliant retention program or
distributed anti-spam system.

Successful POST returns a JSON receipt with `id`, `received: true`, and
`persistent: false`; it does **not echo the visitor's private data**.
Only a server-authorized admin can read received briefs. A successful 200
does not guarantee email notification, retention, durable storage or delivery.

**Before production lead collection:** establish a lawful basis and visible
privacy notice, connect secure persistent storage, encrypt and back up as needed,
configure deletion/retention, monitor spam and implement rate limiting at the
trusted gateway. Never turn on production collection claiming reliable lead
delivery with only this ephemeral store.
