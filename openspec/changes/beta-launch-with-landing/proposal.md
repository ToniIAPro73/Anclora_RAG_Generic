# Propuesta: Lanzamiento Beta con Landing Page

## Why

Necesitamos lanzar una versión beta pública para:

1. **Validar Product-Market Fit:** Confirmar que hay demanda real para nuestra solución RAG antes de invertir más recursos en desarrollo.

2. **Capturar Early Adopters:** Construir una base de usuarios iniciales que proporcione feedback valioso y casos de uso reales, permitiendo iterar el producto basado en necesidades reales del mercado.

3. **Generar Tracción:** Establecer presencia en el mercado y crear momentum antes que competidores. Una lista de espera creciente valida la propuesta de valor y atrae inversión/atención.

4. **Demostrar Valor Tangible:** El MVP actual funciona técnicamente (100% tests pasando) pero no es accesible públicamente. Necesitamos mostrar cómo ahorra tiempo, reduce costes y elimina alucinaciones de LLM con casos de uso reales.

5. **Aceleración Go-to-Market:** Cada semana sin presencia pública es una oportunidad perdida. El mercado de RAG está saturándose rápidamente; necesitamos diferenciarnos con UX superior y lanzamiento rápido.

## 🎯 Resumen Ejecutivo

**Objetivo:** Lanzar al mercado una versión beta gratuita de Anclora RAG Generic lo antes posible, con una Landing Page optimizada para conversión que capture emails de usuarios interesados mediante un CTA claro y persuasivo.

**Motivación de Negocio:**

- Validar product-market fit antes de invertir en desarrollo completo
- Construir base de usuarios early adopters y crear lista de espera cualificada
- Generar feedback real de usuarios para priorizar roadmap
- Establecer presencia en el mercado antes que competidores
- Demostrar valor tangible: ahorro de tiempo, reducción de costes, y eliminación de alucinaciones de LLM

**Alcance:**

- Landing Page de conversión con múltiples CTAs estratégicos
- Sistema de registro y lista de espera (email capture)
- Aplicación beta funcional con funcionalidades core estabilizadas
- Infraestructura mínima viable para soportar usuarios beta
- Analytics básico para medir conversión y engagement

**Impacto Esperado:**

- Time-to-market: 2-3 semanas
- Primeros 100 usuarios beta en 30 días post-lanzamiento
- Tasa de conversión landing → signup: >15%
- Base para iteración rápida basada en feedback real

---

## 📊 Análisis de Estado Actual

### Fortalezas Existentes

✅ MVP operativo con 100% funcionalidad validada
✅ Pipeline RAG completo (ingesta + query + citas)
✅ 33 tests unitarios pasando
✅ UI personalizable (tema, idioma, densidad)
✅ Docker Compose stack funcional
✅ Logging estructurado implementado

### Brechas Críticas para Beta

❌ **No hay landing page** → imposible capturar leads
❌ **No hay sistema de waitlist** → no podemos gestionar acceso beta
❌ **Autenticación bypass activa** → inseguro para usuarios externos
❌ **No hay onboarding** → usuarios nuevos se pierden
❌ **Performance no optimizado** → latencia alta en queries
❌ **No hay analytics** → ciego a comportamiento de usuarios
❌ **Ingesta síncrona** → bloquea UI en uploads grandes

---

## 🎨 Propuesta de Valor para Landing Page

### Posicionamiento de Mercado

**Contexto del mercado RAG 2025:**

- Tamaño: $1.2-3.8B (2025) → $165B en 2034 (CAGR 45.8%)
- Adopción: 70.5% grandes empresas
- Momento ideal para lanzar: mercado en explosión

**Competencia directa y oportunidades:**

- **vs NotebookLM:** Resuelve su problema #1 (citas incorrectas), sin límites artificiales, privacidad total
- **vs RAG tradicionales:** Listo en 5 minutos, sin necesidad de ser MLops engineer
- **vs Búsqueda empresarial:** Inteligencia contextual, respuestas en lugar de solo documentos

### Mensajes Clave (Hero Section)

**Headline Principal:**
> "Deja de buscar entre miles de documentos. Pregúntale directamente a tu conocimiento empresarial."

**Subheadline:**
> "Anclora transforma tus PDFs y documentos en un asistente inteligente que responde al instante, con fuentes verificadas y sin alucinaciones."

**Diferenciador clave vs NotebookLM:**
> "A diferencia de NotebookLM que da citas incorrectas, Anclora garantiza cada respuesta con fuentes verificables."

**Propuesta de Valor (3 pilares realistas del MVP):**

1. **⏱️ Ahorra 10+ horas semanales**
   - "Encuentra respuestas en segundos, no horas" (query <3 seg vs búsqueda manual 15-30 min)
   - "Tus equipos dejan de perder tiempo buscando en carpetas"
   - **Métrica real:** Query <3 seg vs búsqueda manual ~15-30 min

2. **✅ Información 100% verificable**
   - "Cada respuesta con citas exactas del documento fuente"
   - "Sin alucinaciones: solo tu conocimiento"
   - **Diferenciador clave:** Resuelve problema #1 de NotebookLM (citas incorrectas)
   - **Implementación:** Similarity scores + metadata (filename, page, score)

3. **🔒 Privacidad y control total**
   - "Tus datos nunca salen de tu infraestructura"
   - "Self-hosting disponible"
   - **Diferenciador clave:** vs soluciones cloud que venden datos

**Features reales del MVP que SÍ tenemos:**
✅ Citas verificables y precisas (cada respuesta incluye fuentes con similarity scores)
✅ Multilenguaje (ES/EN) - procesamiento nativo sin perder precisión
✅ Sin límites artificiales (no como NotebookLM 500k palabras)
✅ Privacidad total (arquitectura no depende de Google, self-hostable)
✅ Fácil de usar (drag & drop)

**Features avanzadas: NO prometer en beta (roadmap futuro):**
❌ Colaboración en tiempo real → roadmap v1.1
❌ Procesamiento de imágenes/tablas → roadmap v1.2
❌ 20+ integraciones → roadmap v1.3
❌ Graph RAG → roadmap v2.0

**Estrategia de honestidad:** Ser transparentes sobre lo que es MVP, prometer roadmap claro post-beta para generar confianza en early adopters.

### CTAs Estratégicos

**CTA Primario (Hero):**

```markdown
[📧 Solicitar Acceso Beta Gratuito]
"Únete a los primeros 100 usuarios"
```

**CTA Secundario (Features):**

```markdown
[🎯 Ver Demo en Vivo]
"Descubre cómo funciona en 2 minutos"
```

**CTA Terciario (Testimonials/Social Proof):**

```markdown
[💬 Hablar con el Equipo]
"Agenda una demo personalizada"
```

**CTA Footer:**

```markdown
[🚀 Empieza Ahora - Es Gratis]
"Sin tarjeta de crédito. Acceso inmediato."
```

### Secciones de la Landing

1. **Hero** (above the fold)
   - Headline + Subheadline + Video/GIF demo
   - CTA primario + contador "X usuarios ya registrados"
   - Trust badges (si aplica: "Datos seguros", "GDPR compliant")

2. **Problema → Solución**
   - "¿Te suena familiar?" (pain points)
   - "Anclora resuelve esto en 3 pasos" (workflow visual)

3. **Casos de Uso** (iconos + texto breve)
   - Soporte al cliente: respuestas instantáneas de manuales
   - Equipos legales: búsqueda en contratos y regulaciones
   - Onboarding: nuevo personal accede a conocimiento crítico
   - Equipos técnicos: documentación siempre al día

4. **Características Principales** (con capturas/GIFs)
   - Ingesta de documentos drag & drop
   - Chat inteligente con citas verificadas
   - Multilenguaje (ES/EN)
   - Búsqueda semántica avanzada

5. **Social Proof**
   - Testimonios (si disponibles; si no, usar "Early Access Spots")
   - Logos de empresas (si aplica)
   - Métricas: "Procesa X documentos/seg", "Precisión del 95%"

6. **Pricing Teaser**
   - "Beta Gratuita - Tiempo Limitado"
   - "Plan Pro disponible pronto" (generar FOMO)

7. **FAQ** (objeciones comunes)
   - ¿Es seguro subir documentos sensibles?
   - ¿Cuántos documentos puedo ingestar?
   - ¿Funciona en español?
   - ¿Necesito conocimientos técnicos?

8. **CTA Final + Footer**
   - Repetir CTA primario
   - Links a: Privacidad, Términos, Contacto, LinkedIn, Twitter

---

## 🏗️ Arquitectura Propuesta

### Landing Page Stack

### Opción A: Landing Integrada (Recomendado para MVP rápido)

- Ruta Next.js `/` redirige a landing estática
- Aplicación beta en `/app` (requiere login)
- Ventajas: deployment unificado, menor complejidad
- Desventajas: menos flexibilidad de marketing

### Opción B: Landing Separada (Recomendado para escalabilidad)

- Landing en subdirectorio `apps/landing/` (Next.js standalone o static HTML)
- Deploy en Vercel/Netlify (gratis, CDN global, A/B testing fácil)
- Aplicación beta en dominio separado `app.anclora.com`
- Ventajas: optimización SEO, velocidad, experimentos de marketing
- Desventajas: gestión de 2 deploys

**Recomendación:** **Opción B** para separar concerns y permitir iteración rápida de marketing sin afectar aplicación.

### Waitlist & Email Capture

**Backend:**

- Nueva tabla `waitlist` en Postgres:

  ```sql
  CREATE TABLE waitlist (
    id UUID PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    referral_source VARCHAR(100),
    invited BOOLEAN DEFAULT FALSE,
    invited_at TIMESTAMP
  );
  ```

- Endpoint `POST /api/waitlist` (sin autenticación)
- Validación: email válido, rate limiting por IP

**Integración Email:**

- Opción 1: SendGrid/Mailgun API (gratis hasta 10k emails/mes)
- Opción 2: Resend (developer-friendly, gratis hasta 3k emails/mes)
- Emails automáticos:
  - Confirmación de registro en waitlist
  - Email de bienvenida con credenciales beta (cuando se apruebe)

**Analytics:**

- Google Analytics 4 o Plausible (privacy-friendly)
- Track: page views, CTA clicks, form submissions, conversion rate

---

## 🗓️ Plan de Fases Priorizado

### FASE 0: Preparación (Días 1-2) ⚙️

**Objetivo:** Configurar infraestructura y fundamentos

**Tareas:**

1. Crear estructura `apps/landing/` con Next.js o template HTML
2. Configurar tabla `waitlist` en Postgres
3. Implementar endpoint `POST /api/waitlist` con validación
4. Integrar servicio de email (Resend recomendado)
5. Configurar Google Analytics 4 en landing
6. Preparar dominio/subdominio (DNS, SSL)

**Entregables:**

- Landing scaffold funcional (sin contenido)
- Backend waitlist operativo
- Email de confirmación enviándose correctamente

---

### FASE 1: Landing Page MVP (Días 3-5) 🎨

**Objetivo:** Página de conversión completa y optimizada

**Tareas:**

1. Diseñar y maquetar Hero section con CTA primario
2. Crear secciones: Problema/Solución, Casos de Uso, Características
3. Añadir FAQ con 8-10 preguntas frecuentes
4. Implementar formulario de email con validación frontend
5. Grabar video demo o crear GIF animado del producto
6. Optimizar SEO: meta tags, Open Graph, schema.org
7. Mobile responsive (test en 3 dispositivos)
8. A/B test preparado: 2 variantes de headline

**Entregables:**

- Landing page completa y funcional
- Formulario conectado a backend waitlist
- SEO básico implementado
- Mobile responsive validado

**Métricas de Éxito:**

- Landing carga en <2 segundos
- CTA visible sin scroll (above the fold)
- Formulario funciona en Chrome, Firefox, Safari

---

### FASE 2: Estabilización de App Beta (Días 6-9) 🔧

**Objetivo:** Aplicación core lista para usuarios externos

**Prioridad CRÍTICA:**

1. **Autenticación Real (Día 6)**
   - Deshabilitar `AUTH_BYPASS`
   - Implementar registro + login con JWT
   - Roles: `beta_user` (read-only), `admin` (full access)
   - Password reset flow

2. **Onboarding Flow (Día 7)**
   - Wizard de 3 pasos post-login:
     1. "Sube tu primer documento"
     2. "Haz tu primera pregunta"
     3. "Explora características"
   - Tooltips en UI principal
   - Tutorial video embebido (opcional)

3. **Performance & UX (Día 8)**
   - Cachear VectorStoreIndex (TTL 1 hora)
   - Mostrar loading states en chat
   - Implementar rate limiting: 50 queries/hora por usuario beta
   - Error messages user-friendly

4. **Ingesta Asíncrona (Día 9)**
   - Migrar `/ingest` a RQ workers
   - Endpoint `/ingest/status/{job_id}` para polling
   - UI muestra progreso con barra animada
   - Notificación cuando ingesta completa

**Prioridad MEDIA:**

1. **Límites Beta**
   - Max 50 documentos por usuario
   - Max 10 MB por archivo
   - Mensajes claros cuando se alcanza límite

2. **Analytics de Uso**
   - Track: documentos ingestados, queries realizadas, errores
   - Dashboard admin básico con métricas

**Entregables:**

- Aplicación con autenticación real funcional
- Onboarding completo para nuevos usuarios
- Performance mejorado (queries <3seg promedio)
- Ingesta asíncrona operativa

---

### FASE 3: Pre-Lanzamiento (Días 10-12) 🚀

**Objetivo:** Testing, refinamiento y preparación go-live

**Tareas:**

1. **Testing End-to-End (Día 10)**
   - User journey completo: Landing → Waitlist → Email → Login → Onboarding → Upload → Query
   - Test en 3 navegadores + 2 móviles
   - Load testing: 20 usuarios concurrentes
   - Fix bugs críticos

2. **Contenido y Copywriting (Día 11)**
   - Revisar copy de landing con foco en conversión
   - Grabar/editar video demo de 90 segundos
   - Preparar email templates (bienvenida, invitación beta)
   - Crear FAQ en base de conocimiento

3. **Preparación de Lanzamiento (Día 12)**
   - Configurar backups automáticos de DB
   - Documentar runbook de incidencias
   - Preparar comunicación en redes sociales
   - Planificar estrategia de invite waves (50 usuarios/semana)

**Entregables:**

- Testing completo sin bugs críticos
- Contenido de marketing finalizado
- Plan de rollout de invitaciones definido
- Monitoreo y alertas configurados

---

### FASE 4: Lanzamiento Beta (Día 13) 🎉

**Objetivo:** Go-live y primeras invitaciones

**Actividades:**

1. **Deploy a Producción**
   - Deploy landing page (Vercel/Netlify)
   - Deploy app beta (Railway/Fly.io/AWS)
   - Verificar todos los servicios (Qdrant, Postgres, Redis)
   - Test smoke post-deploy

2. **Lanzamiento Soft**
   - Compartir landing en LinkedIn (personal + empresa)
   - Post en Twitter/X con demo
   - Email a network cercano (50-100 personas)
   - Publicar en Product Hunt (opcional, considerar timing)

3. **Primeras Invitaciones**
   - Invitar primeros 10 usuarios de waitlist
   - Monitorear uso en tiempo real
   - Recopilar feedback inicial (survey post-onboarding)

**Entregables:**

- Aplicación live y accesible públicamente
- Landing page recibiendo tráfico
- Primeros usuarios beta activos
- Sistema de monitoreo reportando métricas

---

### FASE 5: Post-Lanzamiento (Días 14-21) 📊

**Objetivo:** Iteración basada en datos y feedback

**Actividades Continuas:**

1. **Monitoreo Diario**
   - Revisar métricas: signups, conversiones, errores
   - Responder a usuarios en <24h
   - Fix bugs emergentes (prioridad alta)

2. **Invitaciones Progresivas**
   - Ola 2: +20 usuarios (día 15)
   - Ola 3: +30 usuarios (día 18)
   - Ola 4: +50 usuarios (día 21)

3. **Optimización Continua**
   - A/B test de headlines landing
   - Mejorar onboarding según feedback
   - Optimizar queries lentas
   - Expandir FAQ según preguntas reales

4. **Preparación Plan Pro**
   - Definir features premium vs free
   - Diseñar página de pricing
   - Planificar migración free → paid

**Métricas de Éxito FASE 5:**

- 100+ emails en waitlist
- 50+ usuarios beta activos
- Tasa de activación (onboarding completo): >70%
- Retención día 7: >50%
- NPS (Net Promoter Score): >40

---

## 📈 Métricas y KPIs

### Landing Page

- **Tráfico:** Page views, usuarios únicos, fuentes
- **Conversión:** Tasa signup (target: >15%)
- **Engagement:** Tiempo en página (target: >2 min), scroll depth

### Aplicación Beta

- **Activación:** % usuarios que completan onboarding (target: >70%)
- **Engagement:** Queries por usuario/día (target: >5)
- **Retención:** Usuarios activos día 7 (target: >50%)
- **Performance:** Latencia promedio queries (target: <3seg)
- **Calidad:** Tasa de error (target: <5%)

### Satisfacción

- **NPS:** Net Promoter Score (target: >40)
- **Feedback:** Survey post-onboarding (5 preguntas)
- **Support:** Tiempo respuesta tickets (target: <24h)

---

## ⚠️ Riesgos y Mitigaciones

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|--------------|---------|------------|
| Performance degrada con +50 usuarios | Media | Alto | Implementar cache, rate limiting, monitoreo |
| Tráfico bajo en landing | Alta | Medio | Campaña LinkedIn Ads ($200), outreach directo |
| Usuarios abandonan en onboarding | Media | Alto | Simplificar wizard, añadir tooltips contextuales |
| Bugs críticos post-lanzamiento | Media | Alto | Testing exhaustivo Fase 3, rollback plan |
| Costes infra exceden presupuesto | Baja | Medio | Usar free tiers, monitorear uso, auto-scaling limits |
| Competencia lanza antes | Baja | Medio | Acelerar timeline, diferenciar con UX superior |

---

## 💰 Estimación de Recursos

### Tiempo de Desarrollo

- **Total:** 13 días full-time (2.5 semanas)
- **Desglose:**
  - Landing page: 3 días
  - Backend waitlist/auth: 2 días
  - App beta hardening: 4 días
  - Testing y refinamiento: 3 días
  - Deploy y lanzamiento: 1 día

### Costes Operativos (Mensual, primeros 3 meses)

- **Infraestructura:**
  - Railway/Fly.io: $10-20/mes (tier hobby)
  - Vercel: $0 (tier gratis)
  - Qdrant Cloud: $0-25 (starter)
  - PostgreSQL: $0 (Railway incluido)
  - Redis: $0 (Railway incluido)
- **Servicios:**
  - Resend (emails): $0 (3k emails/mes gratis)
  - Google Analytics: $0
  - Dominio: $12/año (~$1/mes)
- **Total estimado:** $15-50/mes

### Costes Marketing (Opcional)

- LinkedIn Ads: $200-500 (primeros 1000 clicks)
- Product Hunt promoción: $0-100
- **Total marketing:** $200-600 one-time

---

## 🎯 Criterios de Éxito

### Lanzamiento Exitoso (Día 13)

✅ Landing page live y funcional
✅ 10+ emails capturados en primeras 48h
✅ Aplicación beta accesible con 0 errores críticos
✅ Primeros 5 usuarios completan onboarding

### Beta Exitosa (Día 30)

✅ 100+ emails en waitlist
✅ 50+ usuarios beta invitados
✅ 30+ usuarios activos (query en últimos 7 días)
✅ NPS >40
✅ 0 downtime no planificado

### Preparación para Crecimiento (Día 60)

✅ Plan Pro diseñado y precificado
✅ Roadmap Q1 definido según feedback
✅ Infraestructura soporta 200 usuarios
✅ Proceso de ventas B2B establecido

---

## 📚 Documentación Requerida

### Para Desarrollo

- [ ] API Spec de endpoint `/api/waitlist`
- [ ] Schema de tabla `waitlist`
- [ ] Guía de setup email service (Resend)
- [ ] Runbook de deployment

### Para Usuarios

- [ ] FAQ completo (15+ preguntas)
- [ ] Tutorial de onboarding (video + texto)
- [ ] Términos de servicio beta
- [ ] Política de privacidad

### Para Marketing

- [ ] Brand guidelines (colores, logos, tono)
- [ ] Copy de landing aprobado
- [ ] Assets (video demo, screenshots, GIFs)
- [ ] Plan de contenido redes sociales

---

## 🚦 Decisiones Pendientes

### Críticas (Requieren decisión antes de Fase 1)

1. **Dominio:** ¿Usar subdominio existente o registrar nuevo? (Ej: `anclora.app` vs `app.anclora.com`)
2. **Landing separada vs integrada:** ¿Deploy independiente en Vercel o integrado en Next.js app?
3. **Servicio de email:** ¿Resend, SendGrid, o Mailgun?
4. **Estrategia de invitaciones:** ¿Acceso inmediato o approval manual de waitlist?

### Importantes (Requieren decisión antes de Fase 3)

1. **Plan Pro timing:** ¿Cuándo introducir pricing? (Recomendado: día 45)
2. **Límites beta:** ¿50 docs suficiente o permitir más a power users?
3. **Marketing budget:** ¿Invertir en LinkedIn Ads o crecimiento 100% orgánico?
4. **Product Hunt:** ¿Lanzar en PH día 1 o esperar a tener tracción?

---

## 📞 Próximos Pasos

### Inmediatos (Hoy)

1. Revisar y aprobar esta propuesta
2. Decidir sobre cuestiones críticas (dominio, landing separada, email service)
3. Crear tareas detalladas en `tasks.md`
4. Iniciar Fase 0: setup de infraestructura

### Esta Semana

1. Completar Fase 0 y Fase 1
2. Wireframes de landing aprobados
3. Primer draft de copy completo
4. Backend waitlist testeado

### Próxima Semana

1. Completar Fase 2 (app beta hardened)
2. Testing end-to-end exhaustivo
3. Preparación de contenido marketing
4. Deploy a staging y validación final

---

**Documento creado:** 2025-10-20
**Autor:** Claude Code
**Estado:** 🟡 Pendiente de aprobación
**Siguiente acción:** Crear `tasks.md` detallado tras aprobación
