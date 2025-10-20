# 🚀 Deploy Quick Start - Anclora RAG

**Estado:** ✅ Fase 0 completada - Listo para staging

---

## Opción 1: Deploy Automático (Recomendado)

### Landing Page (Vercel)

```bash
# 1. Instalar Vercel CLI
npm i -g vercel

# 2. Deploy desde apps/landing
cd apps/landing
vercel login
vercel --prod

# 3. Configurar en Dashboard: BACKEND_API_URL
```

### Backend API (Railway)

1. Ir a https://railway.app/new
2. "Deploy from GitHub repo" → Seleccionar `Anclora-RAG-Generic`
3. Configurar variables (ver `.env.production.template`)
4. Añadir Postgres + Redis plugins
5. Deploy automático

---

## Opción 2: Verificación Local Primero

```bash
# Ejecutar checklist pre-deployment
.\scripts\powershell\pre_deploy_check.ps1

# Si todo OK, proceder con Opción 1
```

---

## Documentación Completa

- **Guía detallada:** `docs/DEPLOYMENT_GUIDE.md`
- **Variables entorno:** `.env.production.template`
- **Checklist:** `scripts/powershell/pre_deploy_check.ps1`

---

## Archivos Creados para Deployment

✅ `docs/DEPLOYMENT_GUIDE.md` - Guía completa paso a paso
✅ `.env.production.template` - Template variables producción
✅ `railway.json` - Configuración Railway
✅ `apps/landing/vercel.json` - Configuración Vercel (ya existía)
✅ `scripts/powershell/pre_deploy_check.ps1` - Validación pre-deploy

---

## Próximos Pasos Inmediatos

1. **Ejecutar:** `.\scripts\powershell\pre_deploy_check.ps1`
2. **Si todo OK:** Deploy landing con `vercel --prod`
3. **Configurar:** Railway dashboard con variables
4. **Verificar:** URLs funcionando

**Tiempo estimado:** 15-30 minutos

---

Última actualización: 2025-10-20
