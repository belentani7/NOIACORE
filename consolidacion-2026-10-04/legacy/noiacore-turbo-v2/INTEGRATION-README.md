# AGENCIA IA — SISTEMA INTEGRADO

## ARQUITECTURA

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (Next.js)                        │
│  Dashboard + TaskExecutor + Auth UI                         │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────┐
│              API Layer (Next.js Routes)                      │
│  /api/auth (login, signup)                                  │
│  /api/tasks (create, get, list)                             │
│  /api/admin (metrics, users, usage)                         │
│  /api/webhooks (task events)                                │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────┐
│            Backend Layer (CEO Core)                          │
│  - Decompose tasks (opencode/claude)                        │
│  - Execute subtasks (mimo/architect)                        │
│  - Track execution (logs, costs)                            │
│  - Handle errors (retry, fallback)                          │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────┐
│          Provider Layer (LLM Cascade)                        │
│  1. Groq (Ultra-fast, free daily)                           │
│  2. Anthropic (High-quality)                                │
│  3. DeepSeek (Low-cost)                                     │
│  4. Ollama (Local, free)                                    │
└─────────────────────────────────────────────────────────────┘
```

## QUICK START

### 1. Setup
```bash
chmod +x scripts/setup.sh
./scripts/setup.sh
```

### 2. Configure
```bash
cp .env-template .env
# Edit .env with your API keys
```

### 3. Run
```bash
bun run dev
# Open http://localhost:3000
```

## FILE STRUCTURE

### Core Backend
- `lib/backend/ceo-core.ts` - Task decomposition + execution
- `lib/auth.ts` - JWT + encryption + rate limiting
- `config/agency.ts` - Global configuration

### API Routes
- `app/api/auth/route.ts` - Login, signup
- `app/api/tasks/route.ts` - Task execution, polling
- `app/api/admin/route.ts` - Metrics, users, usage

### Frontend
- `components/TaskExecutor.tsx` - Task UI
- `hooks/useAuth.ts` - Auth state management

### Database
- `prisma/schema.prisma` - Full schema (7 models)

### Deployment
- `Dockerfile-prod` - Production image
- `railway.json` - Railway config
- `.env-template` - Environment variables

## SECURITY FEATURES

✅ JWT authentication (HS256)
✅ Bcrypt password hashing (rounds: 12)
✅ AES-256-CBC encryption for secrets
✅ Rate limiting (per-tier)
✅ Audit logging (all actions)
✅ CORS + middleware protection
✅ Input validation (Zod)
✅ SQL injection protection (Prisma)

## PRICING TIERS

### Free
- 10K tokens/month
- 1 concurrent task
- $0/month

### Pro
- 1M tokens/month
- 5 concurrent tasks
- Webhooks + API keys
- $99/month

### Enterprise
- Unlimited tokens
- 20 concurrent tasks
- SSO + audit logs
- $999/month

## COST BREAKDOWN

**Per-task example:** "Create React component with tests"

```
Subtask 1 (opencode):  1000 tokens × $0.0002 = $0.20
Subtask 2 (claude):     2000 tokens × $0.003  = $6.00
Subtask 3 (mimo):       1500 tokens × $0.0001 = $0.15
─────────────────────────────────────────────────
Total cost:                                     $6.35
```

With Groq free tier (125K daily): $0 first month

## DEPLOYMENT

### Railway (1-click)
```bash
railway link
railway deploy
```

### Vercel
```bash
vercel deploy --prod
# Set env vars in dashboard
```

### Docker
```bash
docker build -f Dockerfile-prod -t agency:latest .
docker run -p 3000:3000 -e JWT_SECRET=... agency:latest
```

## MONITORING

- Admin dashboard: `/admin?action=metrics`
- Audit logs: Database `AuditLog` model
- Usage tracking: `ApiUsage` per-day
- Webhook events: Real-time task updates

## API EXAMPLES

### Execute Task
```bash
curl -X POST http://localhost:3000/api/tasks \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Create a Next.js dashboard with authentication"
  }'
```

### Get Task Status
```bash
curl http://localhost:3000/api/tasks?id=TASK-xxx \
  -H "Authorization: Bearer $TOKEN"
```

### Admin Metrics
```bash
curl http://localhost:3000/api/admin?action=metrics \
  -H "Authorization: Bearer $TOKEN"
```

## PERFORMANCE

- Task execution: 5-600s (depends on complexity)
- API response: <100ms
- Database queries: Indexed on userId, status, date
- Caching: 5min TTL on task results

## TROUBLESHOOTING

**"API rate limited"**
→ Upgrade tier or wait for daily reset

**"Token invalid"**
→ Re-login, token expires in 24h

**"Task timeout"**
→ Complex task exceeded 10min limit, split into subtasks

**"Provider failed"**
→ System auto-fallback to next provider in cascade

## NEXT STEPS

1. ✅ Complete setup
2. ✅ Deploy to Railway
3. ✅ Configure webhooks
4. ✅ Add custom prompts
5. ✅ Monitor costs
6. ✅ Scale to customers
