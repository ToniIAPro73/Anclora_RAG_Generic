# Tasks: Beta Launch with Landing Page

> **Estado:** 🟡 Pendiente de inicio
> **Fecha creación:** 2025-10-20
> **Estimación total:** 13 días de desarrollo

---

## FASE 0: Preparación (Días 1-2) ⚙️

### Backend - Waitlist System

- [ ] **T001:** Crear migración de base de datos para tabla `waitlist`
  - Archivo: `apps/api/alembic/versions/XXXX_add_waitlist_table.py`
  - Schema: id (UUID), email (VARCHAR 255 UNIQUE), created_at, referral_source, invited, invited_at
  - Índices: email (unique), created_at, invited
  - **Estimación:** 1h
  - **Dependencias:** Ninguna

- [ ] **T002:** Crear modelo SQLAlchemy para Waitlist
  - Archivo: `apps/api/models/waitlist.py`
  - Validaciones: email format, lowercase normalization
  - Relaciones: ninguna (tabla standalone)
  - **Estimación:** 30min
  - **Dependencias:** T001

- [ ] **T003:** Implementar endpoint POST /api/waitlist
  - Archivo: `apps/api/routes/waitlist.py`
  - Request: `{"email": string, "referral_source": string?}`
  - Response: `{"success": true, "message": "Added to waitlist"}`
  - Validaciones: email válido, no duplicado, rate limiting (5 req/min por IP)
  - Error handling: 400 (bad email), 409 (duplicate), 429 (rate limit)
  - **Estimación:** 2h
  - **Dependencias:** T002

- [ ] **T004:** Añadir rate limiting middleware
  - Archivo: `apps/api/middleware.py`
  - Implementar con `slowapi` o `fastapi-limiter`
  - Config: 5 requests/min por IP para /api/waitlist
  - **Estimación:** 1h
  - **Dependencias:** T003

- [ ] **T005:** Tests unitarios para waitlist endpoint
  - Archivo: `apps/api/tests/test_waitlist.py`
  - Casos: email válido, email inválido, duplicado, rate limit
  - **Estimación:** 1.5h
  - **Dependencias:** T003

### Email Integration

- [ ] **T006:** Configurar servicio de email (Resend)
  - Instalar: `pip install resend`
  - Añadir `RESEND_API_KEY` a `.env`
  - Crear cliente en `apps/api/clients/email_client.py`
  - **Estimación:** 1h
  - **Dependencias:** Ninguna

- [ ] **T007:** Crear templates de email
  - Archivo: `apps/api/templates/emails/waitlist_confirmation.html`
  - Template: Confirmación de registro en waitlist
  - Variables: {{email}}, {{position_in_queue}}
  - Diseño: Simple, responsive, branded
  - **Estimación:** 2h
  - **Dependencias:** T006

- [ ] **T008:** Implementar envío automático de email
  - Modificar: `apps/api/routes/waitlist.py`
  - Trigger: Enviar email tras POST exitoso
  - Async: Usar background task de FastAPI
  - Error handling: Log error pero no falla request
  - **Estimación:** 1.5h
  - **Dependencias:** T006, T007

### Landing Page Structure

- [ ] **T009:** Decidir arquitectura landing (Separada vs Integrada)
  - **DECISIÓN REQUERIDA:** Ver propuesta sección "Arquitectura Propuesta"
  - Si Separada: Crear `apps/landing/` con Next.js standalone
  - Si Integrada: Usar `apps/web/app/landing/page.tsx`
  - **Estimación:** 30min (decisión) + 1h (setup)
  - **Dependencias:** Ninguna

- [ ] **T010:** Setup proyecto landing (asumiendo Separada)
  - Crear: `apps/landing/` con `npx create-next-app@latest`
  - Config: TypeScript, Tailwind, App Router
  - Estructura: `app/page.tsx`, `components/`, `lib/`
  - **Estimación:** 1h
  - **Dependencias:** T009

- [ ] **T011:** Configurar Google Analytics 4
  - Crear property en Google Analytics
  - Añadir tracking script en `app/layout.tsx`
  - Config: page views, CTA clicks, form submissions
  - **Estimación:** 1h
  - **Dependencias:** T010

- [ ] **T012:** Configurar dominio y SSL
  - **DECISIÓN REQUERIDA:** Dominio/subdominio a usar
  - Configurar DNS records (A/CNAME)
  - SSL automático via Vercel/Netlify
  - **Estimación:** 1h (puede tardar hasta 24h propagación)
  - **Dependencias:** T010

### Subtotal Fase 0

**Tiempo estimado:** 14.5 horas (~2 días)
**Bloqueantes:** T009 (decisión arquitectura), T012 (decisión dominio)

---

## FASE 1: Landing Page MVP (Días 3-5) 🎨

### Diseño y Componentes

- [ ] **T013:** Crear sistema de diseño base
  - Archivo: `apps/landing/lib/design-tokens.ts`
  - Definir: colores, tipografías, espaciados, breakpoints
  - Tailwind config: extend theme con tokens
  - **Estimación:** 1.5h
  - **Dependencias:** T010

- [ ] **T014:** Componente Hero Section
  - Archivo: `apps/landing/components/Hero.tsx`
  - Elementos: Headline, Subheadline, CTA primario, video/GIF demo
  - Responsive: mobile-first
  - A/B test ready: prop `variant` para headlines
  - **Estimación:** 3h
  - **Dependencias:** T013

- [ ] **T015:** Componente Problema/Solución
  - Archivo: `apps/landing/components/ProblemSolution.tsx`
  - Layout: 2 columnas (problema | solución)
  - Iconos: pain points vs benefits
  - **Estimación:** 2h
  - **Dependencias:** T013

- [ ] **T016:** Componente Casos de Uso
  - Archivo: `apps/landing/components/UseCases.tsx`
  - Layout: Grid 2x2 en desktop, stack en mobile
  - Casos: Soporte, Legal, Onboarding, Técnico
  - **Estimación:** 2h
  - **Dependencias:** T013

- [ ] **T017:** Componente Características
  - Archivo: `apps/landing/components/Features.tsx`
  - Layout: Alternating (imagen izq/der)
  - Features: Ingesta drag&drop, Chat con citas, Multilenguaje, Búsqueda
  - **Estimación:** 3h
  - **Dependencias:** T013

- [ ] **T018:** Componente FAQ
  - Archivo: `apps/landing/components/FAQ.tsx`
  - UI: Accordion expandible
  - Preguntas: 10 (ver propuesta sección FAQ)
  - Schema.org: FAQPage structured data
  - **Estimación:** 2h
  - **Dependencias:** T013

- [ ] **T019:** Componente Formulario Email
  - Archivo: `apps/landing/components/EmailCapture.tsx`
  - Fields: email, referral_source (hidden/optional)
  - Validación: frontend (email format) + backend
  - Estados: idle, loading, success, error
  - **Estimación:** 2.5h
  - **Dependencias:** T013

### Contenido y Assets

- [ ] **T020:** Escribir copy completo de landing
  - Archivo: `apps/landing/content/copy.ts`
  - Secciones: Hero, Problema, Solución, Features, FAQ
  - Tono: Profesional, directo, orientado a beneficios
  - Revisar: Eliminar jerga técnica
  - **Estimación:** 3h
  - **Dependencias:** Ninguna (puede ser paralelo)

- [ ] **T021:** Grabar video demo o crear GIF animado
  - Herramienta: Loom (video) o ScreenToGif
  - Duración: 60-90 segundos
  - Script: Problema → Subir doc → Hacer pregunta → Ver respuesta con citas
  - Formato: MP4 optimizado (<5MB) o GIF (<3MB)
  - **Estimación:** 3h (incluye edición)
  - **Dependencias:** App beta funcional

- [ ] **T022:** Crear assets visuales
  - Screenshots: Dashboard, Chat, Ingesta
  - Iconos: Casos de uso, Features
  - Optimización: WebP, lazy loading
  - **Estimación:** 2h
  - **Dependencias:** App beta, T021

### Integración y SEO

- [ ] **T023:** Conectar formulario con backend
  - Archivo: `apps/landing/lib/api.ts`
  - Endpoint: POST /api/waitlist
  - Error handling: Toast notifications
  - Success: Redirect a /thank-you page
  - **Estimación:** 1.5h
  - **Dependencias:** T003, T019

- [ ] **T024:** Implementar página /thank-you
  - Archivo: `apps/landing/app/thank-you/page.tsx`
  - Mensaje: "¡Gracias! Revisa tu email"
  - CTA secundario: Compartir en redes sociales
  - **Estimación:** 1h
  - **Dependencias:** T023

- [ ] **T025:** Optimización SEO
  - Meta tags: title, description, keywords
  - Open Graph: og:image, og:title, og:description
  - Twitter Card: twitter:card, twitter:image
  - Schema.org: Organization, Product, FAQPage
  - Sitemap.xml y robots.txt
  - **Estimación:** 2h
  - **Dependencias:** T010

- [ ] **T026:** Responsive testing
  - Dispositivos: Desktop (1920, 1366), Tablet (768), Mobile (375, 414)
  - Navegadores: Chrome, Firefox, Safari
  - Checklist: CTAs visibles, formulario funcional, imágenes cargan
  - **Estimación:** 2h
  - **Dependencias:** T014-T018

### Subtotal Fase 1

**Tiempo estimado:** 31 horas (~4 días con overlaps)
**Bloqueantes:** T021 (requiere app beta funcional)

---

## FASE 2: Estabilización App Beta (Días 6-9) 🔧

### Autenticación Real

- [ ] **T027:** Crear tabla users en DB
  - Migración: `apps/api/alembic/versions/XXXX_create_users_table.py`
  - Schema: id, email, hashed_password, role, created_at, is_active
  - Índices: email (unique)
  - **Estimación:** 1h
  - **Dependencias:** Ninguna

- [ ] **T028:** Modelo User + schemas Pydantic
  - Archivo: `apps/api/models/user.py`
  - Schemas: UserCreate, UserLogin, UserResponse, Token
  - Validaciones: email format, password strength (min 8 chars)
  - **Estimación:** 1.5h
  - **Dependencias:** T027

- [ ] **T029:** Implementar hashing de passwords
  - Archivo: `apps/api/utils/security.py`
  - Librería: `passlib[bcrypt]`
  - Funciones: hash_password(), verify_password()
  - **Estimación:** 30min
  - **Dependencias:** T028

- [ ] **T030:** Endpoint POST /auth/register
  - Archivo: `apps/api/routes/auth.py`
  - Request: email, password
  - Response: user object (sin password)
  - Validación: email único, password fuerte
  - **Estimación:** 2h
  - **Dependencias:** T029

- [ ] **T031:** Endpoint POST /auth/login
  - Modificar: `apps/api/routes/auth.py`
  - Request: email, password
  - Response: access_token (JWT), token_type, user
  - Validación: credenciales correctas
  - **Estimación:** 2h
  - **Dependencias:** T029

- [ ] **T032:** Middleware JWT authentication
  - Archivo: `apps/api/middleware.py`
  - Librería: `python-jose[cryptography]`
  - Dependency: `get_current_user()` para proteger rutas
  - Config: JWT_SECRET, ALGORITHM, EXPIRATION (24h)
  - **Estimación:** 2.5h
  - **Dependencias:** T031

- [ ] **T033:** Deshabilitar AUTH_BYPASS
  - Modificar: `apps/api/main.py`, `.env`
  - Eliminar lógica de bypass
  - Proteger rutas: /ingest, /query, /documents
  - Mantener públicas: /health, /auth/*, /api/waitlist
  - **Estimación:** 1h
  - **Dependencias:** T032

- [ ] **T034:** Implementar password reset flow
  - Endpoints: POST /auth/forgot-password, POST /auth/reset-password
  - Email: Enviar link con token temporal (expira 1h)
  - **Estimación:** 3h
  - **Dependencias:** T006, T032

- [ ] **T035:** Tests de autenticación
  - Archivo: `apps/api/tests/test_auth.py`
  - Casos: registro, login, token inválido, password reset
  - **Estimación:** 2h
  - **Dependencias:** T033

### Onboarding Flow

- [ ] **T036:** Diseñar wizard de onboarding (3 pasos)
  - Mockup/wireframe: Paso 1 (Upload), Paso 2 (Query), Paso 3 (Explore)
  - UI: Modal o página dedicada
  - **Estimación:** 1h
  - **Dependencias:** Ninguna

- [ ] **T037:** Componente OnboardingWizard
  - Archivo: `apps/web/components/OnboardingWizard.tsx`
  - Navegación: Stepper con progreso visual
  - Pasos: 3 screens con instrucciones + CTA
  - Persistencia: LocalStorage (completed: boolean)
  - **Estimación:** 4h
  - **Dependencias:** T036

- [ ] **T038:** Integrar wizard en primer login
  - Modificar: `apps/web/app/page.tsx`
  - Lógica: Mostrar wizard si onboarding_completed === false
  - Cerrar: Botón "Saltar" + auto-close al completar 3 pasos
  - **Estimación:** 1.5h
  - **Dependencias:** T037

- [ ] **T039:** Tooltips contextuales en UI
  - Librería: `@radix-ui/react-tooltip` o similar
  - Ubicaciones: Botón upload, input chat, panel sources
  - Contenido: Hints breves (<20 palabras)
  - **Estimación:** 2h
  - **Dependencias:** Ninguna

- [ ] **T040:** Video tutorial embebido (opcional)
  - Embed: YouTube o Vimeo
  - Ubicación: Modal "?" en navbar o en wizard
  - **Estimación:** 1h
  - **Dependencias:** T021

### Performance & UX

- [ ] **T041:** Implementar cache de VectorStoreIndex
  - Archivo: `apps/api/rag/pipeline.py`
  - Estrategia: TTL cache con `cachetools` (1 hora)
  - Key: collection_name o user_id
  - **Estimación:** 2h
  - **Dependencias:** Ninguna

- [ ] **T042:** Reutilizar sesión LLM (Gemini)
  - Modificar: `apps/api/routes/query.py`
  - Implementar: Singleton o cache de LLM client
  - **Estimación:** 1.5h
  - **Dependencias:** Ninguna

- [ ] **T043:** Loading states en Chat
  - Archivo: `apps/web/components/Chat.tsx`
  - UI: Spinner + "Analizando documentos..." message
  - Skeleton: Placeholder para respuesta
  - **Estimación:** 1.5h
  - **Dependencias:** Ninguna

- [ ] **T044:** Rate limiting por usuario
  - Modificar: `apps/api/middleware.py`
  - Límite: 50 queries/hora por user_id
  - Response: 429 con header Retry-After
  - UI: Mostrar mensaje amigable
  - **Estimación:** 2h
  - **Dependencias:** T032

- [ ] **T045:** Mejorar mensajes de error
  - Auditar: Todos los endpoints
  - Reemplazar: Error técnicos por user-friendly messages
  - Ejemplos: "No pudimos procesar tu documento" vs "500 Internal Server Error"
  - **Estimación:** 2h
  - **Dependencias:** Ninguna

### Ingesta Asíncrona

- [ ] **T046:** Migrar /ingest a RQ worker
  - Modificar: `apps/api/routes/ingest.py`
  - Lógica: Encolar job en Redis, retornar job_id
  - Worker: Procesar en background
  - **Estimación:** 3h
  - **Dependencias:** Ninguna (RQ ya configurado)

- [ ] **T047:** Endpoint GET /ingest/status/{job_id}
  - Archivo: `apps/api/routes/ingest.py`
  - Response: {status: pending|processing|completed|failed, progress: 0-100}
  - **Estimación:** 1.5h
  - **Dependencias:** T046

- [ ] **T048:** UI polling de progreso
  - Modificar: `apps/web/components/UploadZone.tsx`
  - Polling: Cada 2 segundos hasta completed/failed
  - UI: Progress bar animada + status message
  - **Estimación:** 3h
  - **Dependencias:** T047

- [ ] **T049:** Notificación cuando ingesta completa
  - UI: Toast notification + actualizar lista de documentos
  - **Estimación:** 1h
  - **Dependencias:** T048

### Límites Beta

- [ ] **T050:** Implementar límites de documentos
  - Backend: Validar max 50 docs por user_id en /ingest
  - Frontend: Mostrar contador "25/50 documentos"
  - Error: 403 con mensaje claro
  - **Estimación:** 2h
  - **Dependencias:** T033

- [ ] **T051:** Validar tamaño máximo de archivo
  - Backend: Max 10 MB por archivo
  - Frontend: Validación pre-upload
  - Error: Mensaje "Archivo demasiado grande (max 10 MB)"
  - **Estimación:** 1h
  - **Dependencias:** Ninguna

- [ ] **T052:** Página /limits explicativa
  - Archivo: `apps/web/app/limits/page.tsx`
  - Contenido: Límites beta, razones y formulario para solicitar ampliaciones
  - **Estimación:** 1.5h
  - **Dependencias:** Ninguna

### Analytics de Uso

- [ ] **T053:** Crear tabla analytics_events
  - Migración: `apps/api/alembic/versions/XXXX_analytics_events.py`
  - Schema: id, user_id, event_type, metadata (JSON), created_at
  - Eventos: document_uploaded, query_performed, error_occurred
  - **Estimación:** 1h
  - **Dependencias:** T027

- [ ] **T054:** Implementar tracking de eventos
  - Archivo: `apps/api/services/analytics.py`
  - Función: track_event(user_id, event_type, metadata)
  - Integrar en: /ingest (success/fail), /query (success/fail)
  - **Estimación:** 2h
  - **Dependencias:** T053

- [ ] **T055:** Dashboard admin básico
  - Archivo: `apps/web/app/admin/page.tsx`
  - Métricas: Total users, docs uploaded, queries today, errors rate
  - Gráficos: Librería `recharts` o similar
  - Protección: Solo role=admin
  - **Estimación:** 4h
  - **Dependencias:** T054

### Subtotal Fase 2

**Tiempo estimado:** 56 horas (~7 días, pero overlap posible → 4 días)

---

## FASE 3: Pre-Lanzamiento (Días 10-12) 🚀

### Testing End-to-End

- [ ] **T056:** User journey completo manual
  - Checklist:
    1. Landing → Submit email → Ver confirmación
    2. Recibir email de waitlist
    3. Recibir email de invitación beta
    4. Registrarse en app
    5. Completar onboarding
    6. Subir documento
    7. Hacer query y ver respuesta con citas
  - Documentar: Screenshots de cada paso
  - **Estimación:** 2h
  - **Dependencias:** Todas las anteriores

- [ ] **T057:** Testing multi-navegador
  - Navegadores: Chrome, Firefox, Safari, Edge
  - Dispositivos: Desktop + Mobile (iOS/Android)
  - Checklist: Forms funcionan, estilos correctos, no console errors
  - **Estimación:** 2h
  - **Dependencias:** T056

- [ ] **T058:** Load testing básico
  - Herramienta: Locust o k6
  - Escenario: 20 usuarios concurrentes haciendo queries
  - Métricas: Response time, error rate, throughput
  - Target: P95 <5seg, error rate <1%
  - **Estimación:** 3h
  - **Dependencias:** Ninguna (paralelo)

- [ ] **T059:** Bug fixing crítico
  - Revisar: Resultados de T056-T058
  - Priorizar: Bugs que bloquean user journey
  - Fix: Solo P0/P1
  - **Estimación:** 4h (buffer)
  - **Dependencias:** T056, T057, T058

### Contenido y Copywriting

- [ ] **T060:** Revisar copy de landing con focus en conversión
  - Checklist:
    - Headlines claros y orientados a beneficios
    - CTAs con verbos de acción
    - Pain points resuenan con audiencia
    - Sin jerga técnica
  - A/B test: Preparar 2 variantes de headline hero
  - **Estimación:** 2h
  - **Dependencias:** T020

- [ ] **T061:** Finalizar video demo
  - Edición: Añadir captions, intro/outro
  - Optimización: Comprimir sin perder calidad
  - Upload: YouTube (unlisted) + embed en landing
  - **Estimación:** 2h
  - **Dependencias:** T021

- [ ] **T062:** Preparar email templates finales
  - Templates:
    1. Waitlist confirmation
    2. Beta invitation con credenciales
    3. Welcome to beta (post-register)
    4. Password reset
  - Diseño: Branded, mobile-responsive
  - Testing: Enviar a 3 direcciones test
  - **Estimación:** 3h
  - **Dependencias:** T007

- [ ] **T063:** Crear FAQ base de conocimiento
  - Ubicación: `apps/web/app/faq/page.tsx` o `/help`
  - Contenido: Expandir FAQ de landing con capturas de pantalla
  - SEO: Schema.org FAQPage
  - **Estimación:** 2h
  - **Dependencias:** T018

### Preparación de Lanzamiento

- [ ] **T064:** Configurar backups automáticos de DB
  - Herramienta: Script bash o servicio managed (si Railway/Fly)
  - Frecuencia: Diario, retención 7 días
  - Test: Restaurar backup en DB de test
  - **Estimación:** 2h
  - **Dependencias:** Ninguna

- [ ] **T065:** Documentar runbook de incidencias
  - Archivo: `docs/RUNBOOK.md`
  - Secciones:
    - Cómo detectar downtime
    - Cómo revisar logs
    - Cómo hacer rollback
    - Contactos de emergencia
  - **Estimación:** 2h
  - **Dependencias:** Ninguna

- [ ] **T066:** Preparar comunicación en redes sociales
  - Posts:
    - LinkedIn: Anuncio lanzamiento + demo video
    - Twitter: Thread de 5 tweets explicando problema/solución
  - Schedule: Preparar pero NO publicar aún
  - **Estimación:** 3h
  - **Dependencias:** T061

- [ ] **T067:** Planificar estrategia de invite waves
  - Documento: `docs/INVITE_STRATEGY.md`
  - Waves:
    - Ola 1 (día 1): 10 usuarios (friends & family)
    - Ola 2 (día 3): 20 usuarios (network cercano)
    - Ola 3 (día 7): 30 usuarios (early waitlist)
    - Ola 4 (día 14): 50 usuarios (resto waitlist)
  - Criterio: Manual approval vía admin dashboard
  - **Estimación:** 1h
  - **Dependencias:** Ninguna

- [ ] **T068:** Configurar monitoring y alertas
  - Herramienta: UptimeRobot (gratis) o Better Uptime
  - Monitorear: /health endpoint cada 5 min
  - Alertas: Email + SMS si down >5 min
  - **Estimación:** 1h
  - **Dependencias:** Ninguna

### Subtotal Fase 3

**Tiempo estimado:** 29 horas (~3.5 días)

---

## FASE 4: Lanzamiento Beta (Día 13) 🎉

### Deploy a Producción

- [ ] **T069:** Deploy landing page a Vercel/Netlify
  - Conectar: Repo GitHub a Vercel
  - Config: Build command, output directory
  - Dominio: Conectar dominio custom
  - Test: Verificar formulario funciona
  - **Estimación:** 1h
  - **Dependencias:** Todas de Fase 1

- [ ] **T070:** Deploy app beta a Railway/Fly.io
  - Servicios: API, Web, Postgres, Qdrant, Redis
  - Env vars: Migrar de .env a plataforma
  - Test: Smoke test completo post-deploy
  - **Estimación:** 2h
  - **Dependencias:** Todas de Fase 2

- [ ] **T071:** Verificar todos los servicios
  - Checklist:
    - [ ] Landing page carga
    - [ ] Formulario email funciona
    - [ ] Email de confirmación llega
    - [ ] App beta accesible
    - [ ] Login funciona
    - [ ] Upload documento funciona
    - [ ] Query funciona y retorna citas
    - [ ] Admin dashboard accesible
  - **Estimación:** 1h
  - **Dependencias:** T069, T070

- [ ] **T072:** Smoke test post-deploy
  - Script: `scripts/smoke_test.sh`
  - Tests: Curl a todos los endpoints críticos
  - Validar: Status 200/201, no 500s
  - **Estimación:** 30min
  - **Dependencias:** T071

### Lanzamiento Soft

- [ ] **T073:** Post en LinkedIn (personal + empresa)
  - Contenido: Anuncio lanzamiento + link landing + video demo
  - Hashtags: #AI #RAG #ProductLaunch #StartUp
  - CTA: "Solicita acceso beta gratuito"
  - **Estimación:** 30min
  - **Dependencias:** T069, T061

- [ ] **T074:** Thread en Twitter/X
  - Estructura:
    1. Hook: Problema común
    2. Solución: Anclora RAG
    3. Demo: GIF o video
    4. CTA: Link a landing
    5. Engagement: Pregunta final
  - **Estimación:** 30min
  - **Dependencias:** T069, T061

- [ ] **T075:** Email a network cercano
  - Lista: 50-100 contactos cualificados
  - Plantilla: Personalizada, no spam
  - CTA: "Serías un beta tester perfecto porque..."
  - **Estimación:** 1h
  - **Dependencias:** T069

### Primeras Invitaciones

- [ ] **T077:** Invitar primeros 10 usuarios de waitlist
  - Selección: Manual desde admin dashboard o automático
  - Email: Enviar invitación con link de registro
  - Tracking: Marcar como invited en DB
  - **Estimación:** 1h
  - **Dependencias:** T071, T067

- [ ] **T078:** Monitoreo en tiempo real día 1
  - Dashboard: Abrir admin dashboard + Google Analytics
  - Métricas: Signups, documents uploaded, queries, errors
  - Respuesta: Estar disponible para bugs críticos
  - **Estimación:** 4h (monitoreo continuo)
  - **Dependencias:** T077

- [ ] **T079:** Recopilar feedback inicial
  - Survey: Google Forms o Typeform
  - Enviar: Email a usuarios que completan onboarding
  - Preguntas: 5 (NPS, facilidad uso, features deseadas)
  - **Estimación:** 1h (crear survey) + continuo
  - **Dependencias:** T077

### Subtotal Fase 4

**Tiempo estimado:** 14 horas (incluyendo monitoreo día 1)

---

## Resumen de Estimaciones

| Fase | Tiempo Estimado | Días Calendario | Dependencias Críticas |
|------|-----------------|-----------------|----------------------|
| **Fase 0** | 14.5h | 2 días | Decisión arquitectura landing, decisión dominio |
| **Fase 1** | 31h | 4 días | App beta funcional (para video demo) |
| **Fase 2** | 56h | 7 días (overlap → 4 días) | Completar Fase 0 y Fase 1 |
| **Fase 3** | 29h | 3.5 días | Todas las anteriores |
| **Fase 4** | 14h | 1 día | Todas las anteriores |
| **TOTAL** | **144.5h** | **~9 días** | Con overlaps y eficiencia |

---

## Tareas Críticas (Blocking)

Estas tareas DEBEN completarse en orden secuencial:

1. **T009:** Decisión arquitectura landing (DECISIÓN REQUERIDA)
2. **T012:** Configurar dominio (DECISIÓN REQUERIDA)
3. **T033:** Deshabilitar AUTH_BYPASS (bloquea usuarios externos)
4. **T056:** User journey completo manual (bloquea go-live)
5. **T069-T071:** Deploy a producción (bloquea lanzamiento)

---

## Checklist Pre-Lanzamiento

Antes de ejecutar Fase 4 (deploy), validar:

- [ ] Todas las tareas de Fase 0-3 completadas
- [ ] Tests E2E pasando (T056)
- [ ] Load testing exitoso (T058)
- [ ] Backups configurados (T064)
- [ ] Monitoring activo (T068)
- [ ] Runbook documentado (T065)
- [ ] Copy finalizado y aprobado (T060)
- [ ] Video demo listo (T061)
- [ ] Email templates testeados (T062)
- [ ] Dominio y SSL configurados (T012)
- [ ] ENV vars migradas a producción
- [ ] Smoke test script preparado (T072)

---

## Notas Importantes

### Decisiones Pendientes

Las siguientes decisiones bloquean el inicio de tareas:

1. **Arquitectura landing** (T009): ¿Separada o integrada?
2. **Dominio** (T012): ¿Cuál usar?
3. **Servicio email** (T006): ¿Resend, SendGrid, o Mailgun?
4. **Estrategia invitaciones** (T067): ¿Automático o manual?
**ACCIÓN:** Tomar estas decisiones ANTES de iniciar Fase 0.

### Riesgos de Timeline

- **Video demo (T021):** Puede tomar más de 3h si app tiene bugs
- **Load testing (T058):** Puede revelar problemas de performance → buffer adicional
- **Bug fixing (T059, T082):** Estimaciones conservadoras pero pueden variar

**MITIGACIÓN:** Añadir 20% buffer a estimación total (144.5h → 174h ≈ 11 días)

### Recursos Requeridos

- **Desarrollador Full-Stack:** 1 persona, dedicación 100%
- **Designer/Copywriter:** Opcional pero recomendado para Fase 1
- **Beta Testers:** 5-10 personas para pre-launch testing

---

**Documento creado:** 2025-10-20
**Próxima acción:** Revisar decisiones pendientes y aprobar plan
**Estado:** 🟡 Listo para iniciar tras decisiones
