# DESPLIEGUE BarriServei AI - Producción

## Pre-requisitos
- Cuenta en Vercel (frontend)
- Cuenta en Railway (backend)
- Cuenta en Supabase (base de datos PostgreSQL)
- Claves API: OpenAI, Stripe, WhatsApp

---

## 1. BASE DE DATOS: Supabase

1. Crear proyecto en [supabase.com](https://supabase.com)
2. Copiar `Database URL` (formato: `postgresql+psycopg://user:password@host/db`)
3. En SQL Editor, ejecutar:
```sql
-- Crear tablas (copiar esquema de backend/app/main.py)
CREATE TABLE users (...)
CREATE TABLE providers (...)
CREATE TABLE services (...)
-- ... resto de tablas
```
4. Guardar `Database URL` como variable de entorno

---

## 2. BACKEND: Railway

1. Hacer fork del repo o subir código a GitHub
2. Ir a [railway.app](https://railway.app)
3. Crear nuevo proyecto → "Deploy from GitHub"
4. Seleccionar repositorio
5. Configurar variables de entorno en Railway dashboard:
```
DATABASE_URL=postgresql+psycopg://...
ADMIN_TOKEN=secure-token-32-chars
OPENAI_API_KEY=<YOUR_OPENAI_KEY>
STRIPE_SECRET_KEY=<YOUR_STRIPE_SECRET_KEY>
STRIPE_PUBLISHABLE_KEY=<YOUR_STRIPE_PUBLISHABLE_KEY>
STRIPE_WEBHOOK_SECRET=<YOUR_STRIPE_WEBHOOK_SECRET>
WHATSAPP_PHONE_NUMBER_ID=...
WHATSAPP_ACCESS_TOKEN=...
PUBLIC_BASE_URL=https://tu-backend-railway.railway.app
FRONTEND_URL=https://tu-frontend-vercel.vercel.app
```
6. Railway detecta `Dockerfile` y despliega automáticamente
7. Copiar URL pública de Railway: `https://tu-backend-railway.railway.app`

---

## 3. FRONTEND: Vercel

1. Hacer fork/subir código a GitHub (carpeta `/frontend`)
2. Ir a [vercel.com](https://vercel.com)
3. "Add New → Project → Import Git Repository"
4. Seleccionar repositorio
5. Framework: "Next.js"
6. Root directory: `./frontend`
7. Configurar variables de entorno:
```
NEXT_PUBLIC_API_URL=https://tu-backend-railway.railway.app
NEXT_PUBLIC_STRIPE_KEY=<YOUR_STRIPE_PUBLISHABLE_KEY>
```
8. Hacer deploy. Vercel asigna URL: `https://tu-app-vercel.vercel.app`

---

## 4. STRIPE: Webhooks y Payments

1. En panel de Stripe, crear cuenta de Stripe Connect (para proveedores)
2. Webhooks → Endpoint URL: `https://tu-backend-railway.railway.app/webhooks/stripe`
3. Escuchar evento: `payment_intent.succeeded`
4. Copiar "Webhook Signing Secret" → `STRIPE_WEBHOOK_SECRET`
5. En Settings → API Keys, copiar claves test/live

---

## 5. WHATSAPP: Cloud API

1. Meta for Developers → Crear app WhatsApp
2. Configurar webhook:
   - URL: `https://tu-backend-railway.railway.app/webhooks/whatsapp`
   - Verify Token: `dev-whatsapp-verify` (cambiar en producción)
   - Campos a escuchar: `messages`, `message_status`
3. Copiar `Access Token` y `Phone Number ID`

---

## 6. EJECUTAR SEEDING

Después de desplegar backend, cargar datos iniciales:

```bash
# Local (si tienes acceso directo a DB)
python seed_db.py

# O vía SSH en Railway
railway ssh
cd /code
python seed_db.py
```

---

## 7. VERIFICAR DESPLIEGUE

```bash
# Health check
curl https://tu-backend-railway.railway.app/health

# Listar servicios
curl https://tu-backend-railway.railway.app/api/services

# Crear lead de prueba
curl -X POST https://tu-backend-railway.railway.app/api/leads \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+34611111111",
    "name": "Test",
    "message": "Necesito ayuda con el móvil"
  }'
```

---

## 8. ERRORES COMUNES

### Error: "Permission denied" en Railway
→ Asegurar que variables de entorno están configuradas correctamente

### Error: "CORS error" desde frontend
→ Verificar que `FRONTEND_URL` en backend coincide con URL de Vercel

### Error: "WhatsApp webhook no responde"
→ Verify Token no coincide. Revisar en Meta for Developers

### Error: "Stripe signature invalid"
→ `STRIPE_WEBHOOK_SECRET` incorrecto. Copiar desde panel de Stripe

---

## 9. SEGURIDAD EN PRODUCCIÓN

- [ ] Cambiar `ADMIN_TOKEN` a algo seguro (32+ caracteres aleatorios)
- [ ] Usar claves Stripe LIVE (no test)
- [ ] HTTPS forzado en todas las URLs
- [ ] Backup automático de Supabase habilitado
- [ ] Logs centralizados (Sentry, LogRocket)
- [ ] Rate limiting en API
- [ ] WAF en Cloudflare

---

## 10. MONITORING & ALERTAS

1. **Errores**: Sentry + email alertas
2. **Performance**: Railway logs + Datadog
3. **Uptime**: UptimeRobot (`/health` cada 5 min)
4. **Database**: Supabase metrics dashboard

---

## Costo Estimado Mensual (MVP)

| Servicio | Coste |
|----------|-------|
| Supabase | $25-50 |
| Railway | $5-20 |
| Vercel | $0-20 |
| OpenAI | $5-30 |
| Stripe | % por transacción |
| **Total** | **$40-120+** |

(Sin contar Stripe fees que escalan con ventas)
