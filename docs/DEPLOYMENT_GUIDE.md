# Guía de Deployment a Staging - Anclora RAG

**Fecha:** 2025-10-20
**Estado:** Fase 0 completada, listo para staging
**Objetivo:** Deploy de Landing Page (Vercel) + Backend API (Railway)

---

## 📋 Pre-requisitos

### Cuentas Necesarias

1. **Vercel** (Landing Page)
   - Cuenta gratuita: https://vercel.com/signup
   - Conectar con GitHub para auto-deploy

2. **Railway** (Backend API) - RECOMENDADO
   - Cuenta: https://railway.app/
   - Plan Hobby: $5/mes (incluye 500 horas + $5 crédito)
   - Alternativa: Fly.io

3. **Hostinger Email** (Ya configurado)
   - SMTP: smtp.hostinger.com:465
   - Credenciales ya en `.env`

### Repositorio Git

- Asegurarse de que todo está commiteado
- Branch `master` limpio
- `.gitignore` actualizado (no commitear `.env`)

---

## 🚀 Deployment: Landing Page a Vercel

### Paso 1: Preparar Proyecto Local

```powershell
# Verificar que el build funciona localmente
cd apps/landing
npm run build
npm run start  # Verificar en http://localhost:3000
```

### Paso 2: Deploy desde CLI (Opción Rápida)

```powershell
# Instalar Vercel CLI
npm i -g vercel

# Desde apps/landing/
cd apps/landing
vercel login  # Autenticar con GitHub/Email

# Deploy a staging (preview)
vercel

# Deploy a producción
vercel --prod
```

**Importante:** Durante el wizard de Vercel:
- Project Name: `anclora-landing`
- Framework: Next.js
- Build Command: `npm run build`
- Output Directory: `.next` (default)
- Install Command: `npm install`

### Paso 3: Configurar Variables de Entorno en Vercel

En el dashboard de Vercel (https://vercel.com/dashboard):

1. Ir a **Project Settings** → **Environment Variables**

2. Añadir variables:
   ```
   BACKEND_API_URL = https://anclora-backend.up.railway.app  # Actualizar con URL real de Railway
   NEXT_PUBLIC_GA_ID = G-XXXXXXXXXX  # Tu Google Analytics ID (opcional)
   ```

3. Aplicar a: **Production**, **Preview**, **Development**

4. **Redeploy** para aplicar cambios

### Paso 4: Configurar Dominio Custom (www.anclora.com)

1. En Vercel Dashboard → **Settings** → **Domains**

2. Añadir dominio: `www.anclora.com`

3. Configurar DNS en tu proveedor (ej: Hostinger):
   ```
   Type: CNAME
   Name: www
   Value: cname.vercel-dns.com
   TTL: Auto
   ```

4. Esperar propagación DNS (5-30 minutos)

5. Vercel auto-configurará SSL (Let's Encrypt)

---

## 🔧 Deployment: Backend API a Railway

### Paso 1: Crear Proyecto en Railway

1. Ir a https://railway.app/new

2. **"Deploy from GitHub repo"**

3. Seleccionar repositorio: `Anclora-RAG-Generic`

4. Railway detectará automáticamente el `Dockerfile`

### Paso 2: Configurar Build

En Railway Dashboard:

1. **Settings** → **Build**
   - Build Command: `docker build -f infra/docker/Dockerfile -t anclora-api apps/api`
   - Start Command: (Railway usa CMD del Dockerfile)

2. **Root Directory**: `/apps/api` (si Railway no lo detecta automáticamente)

### Paso 3: Configurar Variables de Entorno

En Railway → **Variables**:

```bash
# LLM
GEMINI_API_KEY=<tu_clave_google_gemini>
GEMINI_MODEL=models/gemini-2.0-flash

# Embeddings
EMBEDDING_MODEL=nomic-ai/nomic-embed-text-v1.5
EMBED_DIMENSION=768

# Database (Railway provee Postgres addon)
DATABASE_URL=${{Postgres.DATABASE_URL}}  # Auto-inyectado si añades Postgres

# Qdrant (Railway plugin o external)
QDRANT_URL=https://xyz.cloud.qdrant.io:6333  # O usar Qdrant Cloud
QDRANT_API_KEY=<tu_qdrant_api_key>

# Redis (Railway plugin)
REDIS_URL=${{Redis.REDIS_URL}}  # Auto-inyectado si añades Redis

# Email SMTP (Hostinger)
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=465
SMTP_USER=antonio@anclora.com
SMTP_PASSWORD=<tu_password_hostinger>
SMTP_FROM=noreply@anclora.com
SMTP_FROM_NAME=Anclora

# Auth (IMPORTANTE: deshabilitar bypass en producción)
AUTH_BYPASS=false
SECRET_KEY=<generar_secreto_seguro>

# Logging
LOG_LEVEL=INFO

# Workers
USE_ASYNC_INGESTION=false
```

**Generar SECRET_KEY seguro:**
```python
import secrets
print(secrets.token_urlsafe(32))
```

### Paso 4: Añadir Servicios (Plugins Railway)

En Railway Dashboard → **New** → **Database**:

1. **PostgreSQL**
   - Railway auto-inyecta `DATABASE_URL`
   - Ejecutar script init: `apps/api/database/create_waitlist_tables.sql`

2. **Redis**
   - Railway auto-inyecta `REDIS_URL`

3. **Qdrant** (Opciones):
   - **Opción A:** Qdrant Cloud (https://cloud.qdrant.io/) - $25/mes
   - **Opción B:** Self-hosted en Railway (más barato pero más complejo)

### Paso 5: Inicializar Base de Datos

```bash
# Opción 1: Desde Railway CLI
railway run psql $DATABASE_URL -f apps/api/database/create_waitlist_tables.sql

# Opción 2: Conectar localmente
psql <DATABASE_URL_de_railway> -f apps/api/database/create_waitlist_tables.sql
```

### Paso 6: Obtener URL Pública

1. Railway genera URL automática: `https://<project>.up.railway.app`

2. Copiar URL y actualizar en **Vercel** → `BACKEND_API_URL`

3. **Verificar health endpoint:**
   ```bash
   curl https://<tu-app>.up.railway.app/health
   ```

### Paso 7: Configurar Dominio Custom (api.anclora.com)

1. Railway Settings → **Networking** → **Custom Domain**

2. Añadir: `api.anclora.com`

3. Configurar DNS en Hostinger:
   ```
   Type: CNAME
   Name: api
   Value: <tu-proyecto>.up.railway.app
   TTL: Auto
   ```

---

## ✅ Verificación Post-Deployment

### Landing Page (Vercel)

```bash
# 1. Verificar página carga
curl https://www.anclora.com

# 2. Probar formulario waitlist (desde navegador)
# - Ir a https://www.anclora.com
# - Completar formulario email
# - Verificar mensaje de éxito con posición

# 3. Verificar proxy API funciona
curl -X POST https://www.anclora.com/api/waitlist \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","referral_source":"test"}'
```

### Backend API (Railway)

```bash
# 1. Health check
curl https://api.anclora.com/health

# 2. Waitlist endpoint
curl -X POST https://api.anclora.com/api/waitlist \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","referral_source":"test"}'

# 3. Waitlist stats (admin)
curl https://api.anclora.com/api/waitlist/stats

# 4. Verificar rate limiting
# (Hacer 6 requests en 1 minuto, la 6ta debe fallar con 429)
```

### Base de Datos

```bash
# Conectar a Postgres de Railway
railway link  # Desde raíz del proyecto
railway connect postgres

# Verificar tabla waitlist
\dt  # Listar tablas
SELECT * FROM waitlist;

# Verificar índices
\di
```

### Email SMTP

- Registrar email de prueba en landing
- Verificar recepción de email de confirmación
- Revisar logs en Railway si falla

---

## 🔒 Seguridad Post-Deployment

### Checklist Crítico

- [ ] `AUTH_BYPASS=false` en Railway (CRÍTICO)
- [ ] `SECRET_KEY` generado con `secrets.token_urlsafe(32)`
- [ ] Credenciales SMTP no expuestas en código
- [ ] `.env` en `.gitignore`
- [ ] HTTPS habilitado (auto con Vercel/Railway)
- [ ] Rate limiting activo (5 req/min en `/api/waitlist`)
- [ ] Logs de acceso monitorizados

### Variables Sensibles a Rotar Periódicamente

- `SECRET_KEY` (cada 90 días)
- `SMTP_PASSWORD` (cada 6 meses)
- `GEMINI_API_KEY` (si se compromete)
- `QDRANT_API_KEY` (si se usa Qdrant Cloud)

---

## 📊 Monitoreo Post-Lanzamiento

### Métricas Clave (Primera Semana)

**Landing Page (Vercel Analytics):**
- Visitas totales
- Tasa de conversión (form submissions / visits)
- Tiempo de carga (< 2s objetivo)
- Tasa de rebote

**Backend API (Railway Logs):**
- Requests totales a `/api/waitlist`
- Errores 4xx/5xx
- Latencia promedio
- Rate limit hits (429 errors)

**Base de Datos:**
- Total registros en `waitlist`
- Crecimiento diario
- Duplicados bloqueados (409 errors)

**Email:**
- Emails enviados vs fallidos
- Tasa de bounces
- Revisar logs SMTP en Railway

### Dashboards Recomendados

1. **Vercel Dashboard**
   - Analytics integrado (gratis)
   - Deployment history
   - Error tracking

2. **Railway Metrics**
   - CPU/Memory usage
   - Request logs
   - Database connections

3. **Google Analytics** (si `NEXT_PUBLIC_GA_ID` configurado)
   - Fuentes de tráfico
   - Geografía de usuarios
   - Eventos personalizados

---

## 🐛 Troubleshooting Común

### Landing no carga

**Síntoma:** Error 404 o deployment fallido

**Solución:**
```bash
# Ver logs de build en Vercel
vercel logs <deployment-url>

# Build local para debug
cd apps/landing
npm run build  # Ver errores de TypeScript/ESLint
```

### Formulario no envía emails

**Síntoma:** 201 OK pero no llega email

**Diagnóstico:**
1. Ver logs en Railway: `railway logs`
2. Buscar: `"Confirmation email sent"` o `"Failed to send"`
3. Verificar credenciales SMTP en variables de entorno

**Solución común:**
- SMTP_PORT debe ser `465` (no 587)
- SMTP_PASSWORD puede tener caracteres especiales → escapar en Railway

### Error 500 en /api/waitlist

**Síntoma:** Formulario devuelve error interno

**Diagnóstico:**
```bash
# Ver logs backend
railway logs --tail 100

# Común: Database connection failed
```

**Soluciones:**
- Verificar `DATABASE_URL` configurada
- Ejecutar script SQL de init_db
- Ver que tablas existan: `railway connect postgres` → `\dt`

### Rate limit muy agresivo

**Síntoma:** Usuarios legítimos bloqueados (429)

**Solución:**
- Editar `apps/api/middleware/rate_limit.py`
- Cambiar `"5/minute"` a `"10/minute"` o `"20/hour"`
- Redeploy: `git push` (si Railway tiene auto-deploy)

---

## 📈 Rollout Gradual (Recomendado)

### Fase 1: Internal Testing (Día 1-2)

- Deploy a staging URLs (sin dominio custom)
- Probar con equipo interno (5-10 personas)
- Verificar todos los flujos

### Fase 2: Soft Launch (Día 3-5)

- Configurar dominios custom
- Invitar primeros 10 usuarios beta
- Monitorizar métricas intensivamente

### Fase 3: Public Launch (Día 6+)

- Anunciar en redes sociales
- Compartir landing en comunidades relevantes
- Escalar según demanda

---

## 🚨 Plan de Rollback

Si algo crítico falla:

**Vercel (Landing):**
```bash
# Revertir a deployment anterior
vercel rollback <previous-deployment-url>
```

**Railway (Backend):**
- Railway Dashboard → **Deployments** → **Rollback** (botón)
- O eliminar variables problemáticas

**Dominio:**
- Si es crítico, apuntar DNS a página estática temporal

---

## 💰 Costos Estimados Staging/Producción

### Tier Gratuito (Viable para beta inicial)

- **Vercel:** Gratis (100GB bandwidth/mes)
- **Railway Hobby:** $5/mes (500h compute + $5 crédito)
- **Qdrant Cloud Starter:** $0 (hasta 1M vectors) - Si se usa Qdrant Cloud
- **Hostinger Email:** $0 adicional (ya contratado)

**Total:** ~$5-10/mes

### Tier Escalado (si >100 usuarios)

- **Vercel Pro:** $20/mes (1TB bandwidth)
- **Railway Pro:** $20/mes (más recursos)
- **Qdrant Cloud:** $25/mes (clusters dedicados)
- **Postgres/Redis:** Incluido en Railway

**Total:** ~$65-75/mes

---

## 📞 Soporte y Contacto

**Documentación Oficial:**
- Vercel: https://vercel.com/docs
- Railway: https://docs.railway.app
- Next.js: https://nextjs.org/docs

**Issues del Proyecto:**
- GitHub Issues: https://github.com/<tu-repo>/issues

**Email de Soporte:**
- soporte@anclora.com

---

**Última actualización:** 2025-10-20
**Versión:** 1.0
**Autor:** Claude Code + Antonio (Anclora)
**Estado:** ✅ Guía completada, listo para deployment
