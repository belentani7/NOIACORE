# ⚡ DESPLIEGUE RÁPIDO (20 minutos)

**Objetivo**: Pasar de código local a producción en la nube con 0 config manual.

---

## PASO 1: Preparar Código (5 min)

```bash
# 1. Crear repo GitHub
git init
git add .
git commit -m "Initial commit: BarriServei AI v1.0"
git remote add origin https://github.com/tu-usuario/barriservei.git
git push -u origin main

# 2. Crear estructura correcta
mkdir -p backend/app frontend/app frontend/components frontend/lib frontend/public
mv backend_main.py backend/app/main.py
mv backend_requirements.txt backend/requirements.txt
mv backend_Dockerfile backend/Dockerfile
mv frontend_package.json frontend/package.json
mv frontend_next.config.js frontend/next.config.js
mv frontend_page.tsx frontend/app/page.tsx

# 3. Crear archivos faltantes (templates vacíos)
touch backend/app/__init__.py
touch frontend/app/layout.tsx
touch frontend/tsconfig.json
touch frontend/tailwind.config.js
touch frontend/.env.example
touch frontend/.gitignore
touch frontend/postcss.config.js

# 4. Git push
git add .
git commit -m "Reorganize: backend & frontend folders"
git push
```

---

## PASO 2: Supabase Database (3 min)

1. **Ir a** [supabase.com](https://supabase.com) → Sign up
2. **Create Project** → Seleccionar región (Europe > Frankfurt)
3. **Copiar Database URL**:
   - Settings → Database → Connection string → URI
   - Formato: `postgresql+psycopg://postgres:[password]@[host]:[port]/postgres`
4. **Guardar como**: `$DATABASE_URL`

Listo. No necesitas crear tablas manualmente (SQLAlchemy lo hace).

---

## PASO 3: Railway Backend (5 min)

1. **Ir a** [railway.app](https://railway.app) → Sign up (GitHub)
2. **Create New Project** → "Deploy from GitHub"
3. **Conectar repo** y seleccionar
4. **Railway detecta `Dockerfile`**, comienza build automático
5. **Mientras builda**, ir a Settings → Environment:
   ```
   DATABASE_URL=postgresql+psycopg://...
   ADMIN_TOKEN=your-secure-token-32-chars
   OPENAI_API_KEY=<YOUR_OPENAI_KEY>
   STRIPE_SECRET_KEY=<YOUR_STRIPE_SECRET_KEY>
   STRIPE_PUBLISHABLE_KEY=<YOUR_STRIPE_PUBLISHABLE_KEY>
   STRIPE_WEBHOOK_SECRET=<YOUR_STRIPE_WEBHOOK_SECRET>
   WHATSAPP_PHONE_NUMBER_ID=123456789
   WHATSAPP_ACCESS_TOKEN=...
   WHATSAPP_VERIFY_TOKEN=dev-verify
   PUBLIC_BASE_URL=https://<tu-railway-app>.railway.app
   FRONTEND_URL=https://<tu-vercel-app>.vercel.app
   ```
6. **Deploy** → Esperar 3-5 min
7. **Copiar URL pública**: Dashboard → Service → Deployments → URL
   Ejemplo: `https://barriservei-backend-prod.railway.app`

✓ Backend listo.

---

## PASO 4: Vercel Frontend (5 min)

1. **Ir a** [vercel.com](https://vercel.com) → Sign up (GitHub)
2. **Add New → Project → Import Git Repository**
3. **Seleccionar repo** y OK
4. **Framework**: Next.js → Next.js (automático)
5. **Root Directory**: `./frontend`
6. **Environment Variables**:
   ```
   NEXT_PUBLIC_API_URL=https://barriservei-backend-prod.railway.app
   NEXT_PUBLIC_STRIPE_KEY=<YOUR_STRIPE_PUBLISHABLE_KEY>
   ```
7. **Deploy** → Esperar 2-3 min
8. **Copiar URL**: Dashboard → Deployments → URL
   Ejemplo: `https://barriservei.vercel.app`

✓ Frontend listo.

---

## PASO 5: Actualizar URLs Cruzadas (2 min)

Railway necesita conocer la URL de Vercel (y viceversa, aunque ya está).

**En Railway** → Settings → Environment:
- `FRONTEND_URL=https://barriservei.vercel.app` (actualizar si es necesario)

**Hacer re-deploy**: Railway → Deployments → Redeploy

---

## PASO 6: Stripe Webhook (2 min)

1. **Ir a** [stripe.com](https://stripe.com/dashboard) → Webhooks
2. **Add Endpoint**:
   - URL: `https://barriservei-backend-prod.railway.app/webhooks/stripe`
   - Events: `payment_intent.succeeded`
3. **Copiar Signing Secret** → `STRIPE_WEBHOOK_SECRET` en Railway env
4. **Re-deploy** Railway (o será ignorado)

---

## PASO 7: WhatsApp Webhook (2 min)

1. **Meta for Developers** → Tu app WhatsApp
2. **Configuration** → Webhook:
   - Callback URL: `https://barriservei-backend-prod.railway.app/webhooks/whatsapp`
   - Verify Token: `dev-whatsapp-verify` (cambiar a algo seguro en env)
3. **Listo**.

---

## PASO 8: Seed de Datos (2 min)

En Railway, crear una job one-time para cargar datos:

```bash
# Opción A: SSH en Railway
railway ssh
cd /code
python seed_db.py

# Opción B: Ejecutar script vía GitHub Actions (ver abajo)
```

O hacer manual vía admin endpoint (crear servicio de prueba):
```bash
curl -X POST https://barriservei-backend-prod.railway.app/api/services \
  -H "Content-Type: application/json" \
  -H "X-Admin-Token: your-secure-token" \
  -d '{
    "slug": "soporte-digital-mayores",
    "name": "Soporte Digital para Mayores",
    "category": "asistencia",
    "price_cents": 3900,
    "commission_bps": 2500,
    "delivery_mode": "onsite",
    "risk_level": "low"
  }'
```

---

## PASO 9: Verificar (2 min)

```bash
# Backend health
curl https://barriservei-backend-prod.railway.app/health
# Esperado: {"status":"ok","time":"2024-..."}

# Frontend
Abrir: https://barriservei.vercel.app
# Esperado: Chat SAIPS visible

# API
curl https://barriservei-backend-prod.railway.app/api/services
# Esperado: Array de servicios

# Admin
curl https://barriservei-backend-prod.railway.app/api/admin/metrics \
  -H "X-Admin-Token: your-token"
# Esperado: {"users":0,"leads":0,"orders":0,...}
```

---

## ✓ LISTO EN PRODUCCIÓN

- Frontend: `https://barriservei.vercel.app`
- Backend: `https://barriservei-backend-prod.railway.app`
- Database: Supabase (backups automáticos)
- Monitoring: Railway logs + Vercel analytics

**Siguientes pasos**:
1. Crear 20 servicios (vía admin API o seed)
2. Crear 10 proveedores (vía admin)
3. Compartir link frontend con potenciales clientes
4. Validar demanda en Pubilla Cases (7 días, 15-30 leads)
5. Escalar a barrios cercanos si funciona

---

## 🚨 TROUBLESHOOTING

| Problema | Solución |
|----------|----------|
| Railway build fails | Revisar logs: Railway → Deployments → Build logs |
| CORS error frontend | Verificar `FRONTEND_URL` en Railway env |
| Stripe webhook 403 | `STRIPE_WEBHOOK_SECRET` incorrecto en env |
| WhatsApp no responde | Verify Token no coincide en Meta |
| DB no conecta | `DATABASE_URL` incorrecto en Railway |

---

## COSTO MENSUAL ESTIMADO

| Servicio | Precio |
|----------|--------|
| Supabase (PostgreSQL) | $25-50 |
| Railway (Backend) | $5-20 |
| Vercel (Frontend) | $0-20 |
| OpenAI API | $5-30 |
| Stripe fees | % por transacción |
| **Total** | **$40-120** |

(Sin contar Stripe que escala con ventas)

---

## 🎉 TODO LISTO

Desde aquí tu sistema está 100% en vivo y puede recibir clientes reales.
El siguiente paso es **validación de mercado en Pubilla Cases** (7 días, primeros 15-30 leads).
