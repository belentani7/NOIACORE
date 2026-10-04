# INTEGRACIÓN: PASOS EJECUTABLES

## 1. PRISMA SCHEMA
- [ ] Reemplazar `prisma/schema.prisma` con contenido de `prisma-schema.prisma`
- [ ] Ejecutar: `bun run db:push`
- [ ] Ejecutar: `bun run db:generate`

## 2. BACKEND CORE
- [ ] Crear: `src/lib/backend/ceo-core.ts` (CEO class)
- [ ] Crear: `src/lib/auth.ts` (JWT + encryption)
- [ ] Crear: `src/config/agency.ts` (Config global)

## 3. API ROUTES
- [ ] Crear: `src/app/api/tasks/route.ts`
- [ ] Crear: `src/app/api/auth/route.ts`
- [ ] Crear: `src/app/api/admin/route.ts`
- [ ] Actualizar: `src/app/api/route.ts`

## 4. MIDDLEWARE
- [ ] Crear: `src/middleware.ts` (Auth + rate limit)

## 5. FRONTEND
- [ ] Crear: `src/components/TaskExecutor.tsx`
- [ ] Crear: `src/hooks/useAuth.ts`
- [ ] Integrar TaskExecutor en `src/app/page.tsx` (nueva tab)

## 6. DEPENDENCIES
- [ ] Actualizar `package.json` con dependencies desde `package-additions.json`
- [ ] Ejecutar: `bun install`

## 7. ENVIRONMENT
- [ ] Copiar: `.env-template` → `.env`
- [ ] Editar `.env` con claves reales (GROQ_API_KEY, ANTHROPIC_API_KEY, etc)
- [ ] Generar JWT_SECRET: `openssl rand -hex 32`
- [ ] Generar ENCRYPTION_KEY: `openssl rand -hex 32`

## 8. DEPLOYMENT
- [ ] Copiar: `Dockerfile-prod` → `Dockerfile`
- [ ] Copiar: `railway.json` → deploy config
- [ ] Crear: `.github/workflows/deploy.yml` (opcional)

## 9. SCRIPTS
- [ ] Crear: `scripts/setup.sh`
- [ ] Crear: `scripts/seed.ts` (opcional, para datos de test)

## 10. DOCUMENTATION
- [ ] Crear: `docs/API.md` (endpoint docs)
- [ ] Crear: `docs/SECURITY.md` (security guide)
- [ ] Crear: `docs/DEPLOYMENT.md` (deploy guide)

## TESTING

### Unit Tests
```bash
bun test lib/backend/ceo-core.test.ts
bun test lib/auth.test.ts
```

### Integration Tests
```bash
bun test app/api/tasks/route.test.ts
bun test app/api/auth/route.test.ts
```

### E2E Tests (opcional)
```bash
bun test:e2e
```

## VERIFICATION

### Local
1. `bun run dev` - Start dev server
2. `curl http://localhost:3000/health` - Health check
3. `curl -X POST http://localhost:3000/api/auth/signup ...` - Test signup
4. `curl -X POST http://localhost:3000/api/tasks ...` - Test task execution

### Production
1. Deploy to Railway
2. Test health endpoint
3. Monitor logs: `railway logs`
4. Check database: `railway database connect`
5. Run load test (optional)

## ESTIMATED TIMELINE

- Setup: 5 min
- Integration: 30 min
- Testing: 15 min
- Deployment: 10 min
- **Total: 1 hour**

## SUPPORT

Problemas comunes:

| Error | Solución |
|-------|----------|
| "Cannot find module 'jsonwebtoken'" | `bun install jsonwebtoken` |
| "ECONNREFUSED localhost:11434" | Ollama no está corriendo, instala desde ollama.ai |
| "Rate limited by Groq" | Upgrade tier o espera reset daily |
| "JWT verification failed" | Check JWT_SECRET en .env |
| "Database locked" | SQLite usa file locks, no soporta concurrencia extrema → migra a PostgreSQL |

## NEXT PHASE: FEATURES

Después de integración básica:

- [ ] WebSocket para live task updates
- [ ] Job queue (Bull/Redis) para tareas async
- [ ] GraphQL API (opcional)
- [ ] Mobile app (React Native)
- [ ] Stripe billing integration
- [ ] Slack bot integration
- [ ] Discord bot integration
- [ ] Usage analytics dashboard
- [ ] Custom prompt templates
- [ ] Team management
- [ ] API marketplace
