# Design: Beta Launch with Landing Page

> **Estado:** 🟡 En revisión
> **Fecha:** 2025-10-20
> **Autor:** Claude Code

---

## 1. Decisiones de Arquitectura

### 1.1 Landing Page: Separada vs Integrada

#### RECOMENDACIÓN: Landing Separada

#### Arquitectura Propuesta

```text
┌─────────────────────────────────────────────────────────────┐
│                      LANDING PAGE                           │
│  Dominio: www.anclora.com (o anclora.com)                 │
│  Stack: Next.js standalone @ apps/landing/                 │
│  Deploy: Vercel (gratis, CDN global, edge functions)       │
│  Propósito: Marketing, conversión, SEO                     │
└─────────────────────────────────────────────────────────────┘
                             │
                             │ CTA → "Solicitar Acceso"
                             ↓
┌─────────────────────────────────────────────────────────────┐
│                    WAITLIST API                             │
│  Endpoint: POST app.anclora.com/api/waitlist               │
│  Backend: FastAPI                                           │
│  Database: PostgreSQL (tabla waitlist)                     │
│  Email: Hostinger SMTP (noreply@anclora.com)              │
└─────────────────────────────────────────────────────────────┘
                             │
                             │ Invitación email con credenciales
                             ↓
┌─────────────────────────────────────────────────────────────┐
│                    APLICACIÓN BETA                          │
│  Dominio: app.anclora.com                                  │
│  Stack: Next.js @ apps/web/ + FastAPI @ apps/api/          │
│  Deploy: Railway/Fly.io/AWS                                 │
│  Propósito: Producto funcional, usuarios registrados       │
└─────────────────────────────────────────────────────────────┘

CONFIGURACIÓN DNS (anclora.com en Hostinger):
├── A/AAAA record @ → Vercel IP (landing)
├── CNAME www → cname.vercel-dns.com (landing)
└── CNAME app → [railway/fly.io endpoint] (aplicación beta)
```text

#### Ventajas de Separación

1. **Marketing Ágil:** Iterar copy y diseño sin tocar código de producto
2. **Performance:** Landing estática optimizada para conversión, CDN global
3. **SEO:** Mejor indexación, meta tags específicos para marketing
4. **A/B Testing:** Experimentos sin afectar app
5. **Escalabilidad:** Independencia de deploys, rollbacks sin impacto cruzado
6. **Costes:** Landing gratis en Vercel, app paga solo lo necesario

#### Desventajas (Mitigadas)

- Gestión de 2 repos/deploys → **Mitigación:** Monorepo, scripts de deploy unificados
- Consistencia de branding → **Mitigación:** Design tokens compartidos

---

### 1.2 Stack Técnico Landing Page

```typescript
// apps/landing/
{
  "framework": "Next.js 15.0",
  "rendering": "Static Site Generation (SSG)",
  "styling": "Tailwind CSS 3.4",
  "animations": "Framer Motion",
  "forms": "React Hook Form + Zod",
  "analytics": "Google Analytics 4 + Vercel Analytics",
  "seo": "next-seo",
  "deployment": "Vercel (free tier)"
}
```text

#### Estructura de Directorio

```text
apps/landing/
├── app/
│   ├── layout.tsx           # Root layout, GA4, fonts
│   ├── page.tsx             # Homepage (landing principal)
│   ├── thank-you/page.tsx   # Post-signup confirmation
│   └── privacy/page.tsx     # Política de privacidad
├── components/
│   ├── Hero.tsx             # Above the fold, CTA primario
│   ├── ProblemSolution.tsx  # Pain points → Solución
│   ├── Features.tsx         # Características con capturas
│   ├── UseCases.tsx         # Casos de uso (grid)
│   ├── FAQ.tsx              # Accordion de preguntas
│   ├── EmailCapture.tsx     # Formulario de email
│   └── ui/                  # Componentes reutilizables (Button, Input)
├── lib/
│   ├── api.ts               # Cliente HTTP para /api/waitlist
│   ├── analytics.ts         # GA4 event tracking
│   └── design-tokens.ts     # Colores, tipografías, espaciados
├── public/
│   ├── videos/demo.mp4      # Video demo
│   ├── images/              # Screenshots, iconos
│   └── favicon.ico
└── content/
    └── copy.ts              # Todo el texto centralizado
```text

---

### 1.3 Email Service: SMTP Hostinger (Existente)

#### DECISIÓN FINAL: Usar SMTP de Hostinger

El proyecto ya tiene servicio de email contratado en Hostinger con el dominio `anclora.com`.

**Email accounts disponibles:**
- `antonio@anclora.com` (principal)
- `hola@anclora.com` (alias existente)
- Capacidad de crear más aliases: `soporte@anclora.com`, `noreply@anclora.com`, etc.

**Ventajas:**
- ✅ Ya está pagado (coste $0 adicional)
- ✅ Dominio propio profesional (@anclora.com)
- ✅ Mayor deliverability (dominio establecido)
- ✅ Control total sobre la infraestructura
- ✅ Sin límites de servicios externos

**Configuración SMTP (Hostinger):**
```python
SMTP_HOST = "smtp.hostinger.com"
SMTP_PORT = 465  # SSL
SMTP_USER = "noreply@anclora.com"  # Crear este alias
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD")
```

#### Integración con Python

#### Opción A: smtplib (estándar)

```python
# apps/api/clients/email_client.py
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional
import os

class EmailClient:
    def __init__(self):
        self.smtp_host = "smtp.hostinger.com"
        self.smtp_port = 465
        self.smtp_user = "noreply@anclora.com"
        self.smtp_password = os.getenv("SMTP_PASSWORD")

    async def send_email(
        self,
        to: str,
        subject: str,
        html: str,
        from_email: str = "noreply@anclora.com",
        from_name: str = "Anclora"
    ) -> bool:
        """Send email via Hostinger SMTP."""
        try:
            message = MIMEMultipart("alternative")
            message["Subject"] = subject
            message["From"] = f"{from_name} <{from_email}>"
            message["To"] = to

            html_part = MIMEText(html, "html")
            message.attach(html_part)

            with smtplib.SMTP_SSL(self.smtp_host, self.smtp_port) as server:
                server.login(self.smtp_user, self.smtp_password)
                server.sendmail(from_email, to, message.as_string())

            return True
        except Exception as e:
            logger.error(f"Failed to send email: {e}")
            return False
```

#### Opción B: FastAPI-Mail (recomendado para async)

```python
# apps/api/clients/email_client.py
from fastapi_mail import FastMail, MessageSchema, ConnectionConfig
from pydantic import EmailStr
import os

conf = ConnectionConfig(
    MAIL_USERNAME="noreply@anclora.com",
    MAIL_PASSWORD=os.getenv("SMTP_PASSWORD"),
    MAIL_FROM="noreply@anclora.com",
    MAIL_PORT=465,
    MAIL_SERVER="smtp.hostinger.com",
    MAIL_STARTTLS=False,
    MAIL_SSL_TLS=True,
    USE_CREDENTIALS=True,
    VALIDATE_CERTS=True
)

fm = FastMail(conf)

async def send_email(
    to: EmailStr,
    subject: str,
    html: str,
    from_name: str = "Anclora"
) -> bool:
    """Send email via Hostinger SMTP."""
    try:
        message = MessageSchema(
            subject=subject,
            recipients=[to],
            body=html,
            subtype="html"
        )
        await fm.send_message(message)
        return True
    except Exception as e:
        logger.error(f"Failed to send email: {e}")
        return False
```

#### Aliases de Email Recomendados

Crear estos aliases en Hostinger para la beta:

1. **`noreply@anclora.com`** - Emails automáticos (confirmaciones, notificaciones)
2. **`soporte@anclora.com`** - Respuestas de usuarios, tickets
3. **`beta@anclora.com`** - Invitaciones beta (opcional)

**Configuración en .env:**

```bash
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=465
SMTP_USER=noreply@anclora.com
SMTP_PASSWORD=tu_password_seguro_aqui
SMTP_FROM=noreply@anclora.com
SMTP_FROM_NAME=Anclora
```

#### Dependencias Python

```bash
# Opción A (estándar, ya incluido en Python)
# No requiere instalación adicional

# Opción B (recomendado)
pip install fastapi-mail
```text

---

### 1.4 Autenticación: JWT con Refresh Tokens (Opcional)

#### Decisión de Implementación

##### Fase Beta: Solo Access Tokens (24h TTL)

Razón: Simplicidad, menor complejidad para beta con usuarios limitados.

##### Fase Post-Beta: Refresh Tokens

Implementar cuando se escale a >100 usuarios activos.

#### Schema JWT

```python
# Access Token Payload
{
  "sub": "user_id",          # Subject (user ID)
  "email": "user@example.com",
  "role": "beta_user",       # Roles: admin, beta_user, pro_user
  "exp": 1672531200,         # Expiration (24h desde emisión)
  "iat": 1672444800,         # Issued at
  "jti": "unique_token_id"   # Token ID (para revocación si necesario)
}
```text

#### Endpoints de Autenticación
```text

POST /auth/register
  Request:  { email, password }
  Response: { user: {...}, access_token }

POST /auth/login
  Request:  { email, password }
  Response: { access_token, token_type: "bearer", user: {...} }

POST /auth/forgot-password
  Request:  { email }
  Response: { message: "Reset link sent" }

POST /auth/reset-password
  Request:  { token, new_password }
  Response: { message: "Password reset successful" }

GET /auth/me (requiere auth)
  Response: { user: {...} }
```text

---

## 2. Diseño de Base de Datos

### 2.1 Nueva Tabla: `waitlist`

```sql
CREATE TABLE waitlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  referral_source VARCHAR(100),     -- 'linkedin', 'twitter', 'direct', etc.
  created_at TIMESTAMP DEFAULT NOW(),
  invited BOOLEAN DEFAULT FALSE,
  invited_at TIMESTAMP,

  CONSTRAINT email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$')
);

CREATE INDEX idx_waitlist_email ON waitlist(email);
CREATE INDEX idx_waitlist_created_at ON waitlist(created_at DESC);
CREATE INDEX idx_waitlist_invited ON waitlist(invited) WHERE invited = FALSE;
```text

### 2.2 Modificación Tabla: `users`

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  hashed_password VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'beta_user',  -- 'admin', 'beta_user', 'pro_user'
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  -- Límites beta
  max_documents INT DEFAULT 50,
  max_queries_per_hour INT DEFAULT 50,

  -- Onboarding
  onboarding_completed BOOLEAN DEFAULT FALSE,
  onboarding_completed_at TIMESTAMP,

  CONSTRAINT email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$')
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
```text

### 2.3 Nueva Tabla: `analytics_events`

```sql
CREATE TABLE analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  event_type VARCHAR(100) NOT NULL,  -- 'document_uploaded', 'query_performed', 'error_occurred'
  metadata JSONB,                     -- Datos adicionales (filename, query, error_code)
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_analytics_user_id ON analytics_events(user_id);
CREATE INDEX idx_analytics_event_type ON analytics_events(event_type);
CREATE INDEX idx_analytics_created_at ON analytics_events(created_at DESC);

-- Ejemplo de consulta para métricas
-- Total queries hoy por usuario
SELECT user_id, COUNT(*) as query_count
FROM analytics_events
WHERE event_type = 'query_performed'
  AND created_at >= CURRENT_DATE
GROUP BY user_id
ORDER BY query_count DESC;
```text

---

## 3. API Contracts

### 3.1 Waitlist Endpoint

```typescript
// POST /api/waitlist
interface WaitlistRequest {
  email: string;              // Required, validated
  referral_source?: string;   // Optional, tracked
}

interface WaitlistResponse {
  success: true;
  message: string;            // "Added to waitlist"
  position?: number;          // Position in queue (optional)
}

interface WaitlistError {
  success: false;
  error: string;              // "Invalid email" | "Email already registered"
  code: string;               // "INVALID_EMAIL" | "DUPLICATE_EMAIL" | "RATE_LIMIT_EXCEEDED"
}

// Rate Limiting
// Header: X-RateLimit-Limit: 5
// Header: X-RateLimit-Remaining: 4
// Header: X-RateLimit-Reset: 1672531200 (Unix timestamp)
```text

### 3.2 Auth Endpoints

```typescript
// POST /auth/register
interface RegisterRequest {
  email: string;
  password: string;  // Min 8 chars, validado frontend y backend
}

interface RegisterResponse {
  user: {
    id: string;
    email: string;
    role: string;
    created_at: string;
  };
  access_token: string;
}

// POST /auth/login
interface LoginRequest {
  email: string;
  password: string;
}

interface LoginResponse {
  access_token: string;
  token_type: "bearer";
  user: {
    id: string;
    email: string;
    role: string;
  };
}

// Error Responses (ambos endpoints)
interface AuthError {
  detail: string;  // "Invalid credentials" | "User already exists"
  code: string;    // "INVALID_CREDENTIALS" | "USER_EXISTS"
}
```text

### 3.3 Ingestion Status Endpoint (Async)

```typescript
// GET /ingest/status/{job_id}
interface IngestionStatusResponse {
  job_id: string;
  status: "pending" | "processing" | "completed" | "failed";
  progress: number;              // 0-100
  message?: string;              // Human-readable status
  document_id?: string;          // Si completed
  error?: string;                // Si failed
  created_at: string;
  updated_at: string;
}
```text

---

## 4. Frontend: Landing Page Design

### 4.0 Estrategia de Messaging (Basado en Análisis de Mercado 2025)

**Posicionamiento clave:**
- Mercado RAG: $1.2-3.8B (2025) → $165B (2034) - momento ideal para lanzar
- **vs NotebookLM:** Resuelve su problema #1 (citas incorrectas) + sin límite 500k palabras
- **vs RAG tradicionales:** Listo en 5 minutos, sin necesidad de ser MLops engineer

**Diferenciadores REALES del MVP (enfatizar):**
✅ Citas verificables (similarity scores + metadata: filename, page, score)
✅ Multilenguaje ES/EN nativo
✅ Sin límites artificiales de palabras
✅ Privacidad total (self-hostable, no depende de Google)
✅ Fácil de usar (drag & drop)

**Features NO prometer (roadmap futuro):**
❌ Colaboración tiempo real (v1.1)
❌ Procesamiento imágenes/tablas (v1.2)
❌ 20+ integraciones (v1.3)
❌ Graph RAG (v2.0)

**Estrategia:** Honestidad + roadmap claro = confianza de early adopters

### 4.1 Hero Section (Above the Fold)
```text

┌─────────────────────────────────────────────────────────────┐
│  NAVBAR: [Logo] ──────────────────── [Demo] [Iniciar Sesión]│
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  [Lado Izquierdo: 50%]                                       │
│                                                               │
│  Headline (H1, 48px, bold):                                  │
│  "Deja de buscar entre miles de documentos."                │
│  "Pregúntale directamente a tu conocimiento empresarial."   │
│                                                               │
│  Subheadline (H2, 24px, regular):                           │
│  "Anclora transforma tus PDFs y documentos en un asistente  │
│   inteligente que responde al instante, con fuentes         │
│   verificadas y sin alucinaciones."                          │
│                                                               │
│  Diferenciador vs NotebookLM (badge/small, destacado):      │
│  "💡 A diferencia de NotebookLM que da citas incorrectas,   │
│   Anclora garantiza cada respuesta con fuentes verificables."│
│                                                               │
│  [Formulario Email]                                          │
│  ┌─────────────────────┐ ┌──────────────┐                   │
│  │ tu@empresa.com      │ │ Solicitar    │                   │
│  │                     │ │ Acceso Beta  │                   │
│  └─────────────────────┘ └──────────────┘                   │
│                                                               │
│  "✅ Gratis durante beta · Sin tarjeta · Acceso prioritario"│
│  "🔥 Únete a los primeros 100 usuarios"                     │
│                                                               │
│  [Lado Derecho: 50%]                                         │
│  ┌───────────────────────────────┐                           │
│  │                               │                           │
│  │     [VIDEO DEMO / GIF]        │                           │
│  │   90 seg: Upload → Query      │                           │
│  │     → Answer con citas        │                           │
│  │   MOSTRAR: similarity scores  │                           │
│  │                               │                           │
│  └───────────────────────────────┘                           │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```text

### 4.2 Sección: Problema → Solución
```text

┌─────────────────────────────────────────────────────────────┐
│                      ¿Te suena familiar?                     │
│                                                               │
│  ❌ "Perdí 3 horas buscando ese informe"                     │
│  ❌ "El soporte me preguntó lo mismo 10 veces"               │
│  ❌ "ChatGPT me dio una respuesta inventada"                 │
│  ❌ "Tenemos conocimiento, pero nadie lo encuentra"          │
│                                                               │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│              Anclora resuelve esto en 3 pasos                │
│                                                               │
│  [1. Sube] → [2. Pregunta] → [3. Respuesta con fuentes]     │
│   Drag PDF      Natural         Citas verificadas           │
│   DOCX, MD      language         Sin inventos                │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```text

### 4.3 Propuesta de Valor (3 Pilares Realistas del MVP)
```text

┌──────────────┬──────────────┬──────────────┐
│   ⏱️ AHORRA  │  ✅ CONFÍA   │  🔒 PRIVADO  │
│   TIEMPO     │   100%       │   TOTAL      │
│              │              │              │
│ 10+ horas    │ Sin          │ Tus datos    │
│ semanales    │ alucinaciones│ nunca salen  │
│              │              │              │
│ Query <3seg  │ Cada         │ Self-hosting │
│ vs búsqueda  │ respuesta    │ disponible   │
│ manual       │ con citas    │              │
│ 15-30 min    │ exactas      │ No depende   │
│              │              │ de Google    │
│              │ Similarity   │              │
│ Métrica REAL │ scores +     │ Diferenciador│
│              │ metadata     │ clave        │
│              │              │              │
│ [📧 CTA]     │ [📧 CTA]     │ [📧 CTA]     │
└──────────────┴──────────────┴──────────────┘

NOTA: Enfatizar features REALES del MVP vs aspiracionales
- ✅ Citas verificables (resuelve problema #1 de NotebookLM)
- ✅ Multilenguaje ES/EN
- ✅ Sin límites artificiales (no como NotebookLM 500k palabras)
NO mencionar: colaboración tiempo real, multimodal, Graph RAG
```text

### 4.4 Casos de Uso
```text

┌────────────────┬────────────────┐
│ 🎧 SOPORTE     │ ⚖️ LEGAL       │
│ Respuestas     │ Búsqueda en    │
│ instantáneas   │ contratos y    │
│ de manuales    │ regulaciones   │
├────────────────┼────────────────┤
│ 🚀 ONBOARDING  │ 🔧 TÉCNICO     │
│ Nuevo personal │ Documentación  │
│ accede a       │ siempre        │
│ conocimiento   │ al día         │
└────────────────┴────────────────┘
```text

### 4.5 FAQ (Accordion)
```text

┌─────────────────────────────────────────────────────────────┐
│  Preguntas Frecuentes                                        │
│                                                               │
│  ▼ ¿Es seguro subir documentos sensibles?                   │
│     Sí. Tus documentos se procesan de forma privada...      │
│                                                               │
│  ▶ ¿Cuántos documentos puedo ingestar?                      │
│  ▶ ¿Funciona en español?                                    │
│  ▶ ¿Necesito conocimientos técnicos?                        │
│  ▶ ¿Qué formatos soporta?                                   │
│  ▶ ¿Puedo invitar a mi equipo?                              │
│  ▶ ¿Cuánto cuesta después de beta?                          │
│  ▶ ¿Puedo exportar mis datos?                               │
│  ▶ ¿Cómo garantizan que no hay alucinaciones?               │
│  ▶ ¿Qué pasa con mis datos al final de la beta?             │
└─────────────────────────────────────────────────────────────┘
```text

---

## 5. UX Flows

### 5.1 Flow: Waitlist → Invitación → Onboarding
```text

┌──────────────────────────────────────────────────────────────┐
│ 1. Usuario visita landing                                    │
│    └─> Lee propuesta de valor                                │
│    └─> Ve video demo                                         │
│    └─> Completa formulario email                             │
└──────────────────────────────────────────────────────────────┘
                        ↓
┌──────────────────────────────────────────────────────────────┐
│ 2. Backend procesa                                           │
│    └─> Valida email (formato, no duplicado)                 │
│    └─> Inserta en tabla waitlist                            │
│    └─> Envía email confirmación                             │
│    └─> Redirect a /thank-you                                │
└──────────────────────────────────────────────────────────────┘
                        ↓
┌──────────────────────────────────────────────────────────────┐
│ 3. Usuario recibe email de confirmación                     │
│    "¡Gracias! Estás en lista de espera."                    │
│    "Te notificaremos cuando tengamos un lugar."              │
└──────────────────────────────────────────────────────────────┘
                        ↓ (días después)
┌──────────────────────────────────────────────────────────────┐
│ 4. Admin invita usuario (manual o automático)               │
│    └─> Backend marca invited = TRUE                         │
│    └─> Envía email invitación con link registro             │
└──────────────────────────────────────────────────────────────┘
                        ↓
┌──────────────────────────────────────────────────────────────┐
│ 5. Usuario accede a app.anclora.app/register                │
│    └─> Completa formulario (email prefill, password)        │
│    └─> Backend crea usuario, retorna JWT                    │
│    └─> Frontend guarda token, redirect a /dashboard         │
└──────────────────────────────────────────────────────────────┘
                        ↓
┌──────────────────────────────────────────────────────────────┐
│ 6. Onboarding Wizard se muestra (si no completado)          │
│    Paso 1: "Sube tu primer documento"                       │
│    └─> Drag & drop o file picker                            │
│    └─> Ingesta asíncrona con progress bar                   │
│    Paso 2: "Haz tu primera pregunta"                        │
│    └─> Input con placeholder                                │
│    └─> Muestra respuesta con citas                          │
│    Paso 3: "Explora características"                        │
│    └─> Tour rápido con tooltips                             │
│    └─> Marcar onboarding_completed = TRUE                   │
└──────────────────────────────────────────────────────────────┘
                        ↓
┌──────────────────────────────────────────────────────────────┐
│ 7. Usuario activo                                            │
│    └─> Dashboard con chat y docs                            │
│    └─> Puede subir más documentos (hasta límite)            │
│    └─> Hacer queries ilimitadas (con rate limit)            │
└──────────────────────────────────────────────────────────────┘
```text

### 5.2 Flow: Ingesta Asíncrona
```text

┌──────────────────────────────────────────────────────────────┐
│ 1. Usuario sube archivo                                      │
│    Frontend: UploadZone.tsx                                  │
│    └─> Validaciones: tipo, tamaño, límites                  │
│    └─> POST /ingest con FormData                            │
└──────────────────────────────────────────────────────────────┘
                        ↓
┌──────────────────────────────────────────────────────────────┐
│ 2. Backend encola job                                        │
│    Backend: routes/ingest.py                                 │
│    └─> Validar autenticación                                │
│    └─> Verificar límites (max 50 docs)                      │
│    └─> Crear job en Redis Queue                             │
│    └─> Retornar {job_id, status: "pending"}                 │
└──────────────────────────────────────────────────────────────┘
                        ↓
┌──────────────────────────────────────────────────────────────┐
│ 3. Frontend inicia polling                                   │
│    GET /ingest/status/{job_id} cada 2 segundos              │
│    └─> Muestra progress bar animada                         │
│    └─> Mensaje: "Procesando documento..."                   │
└──────────────────────────────────────────────────────────────┘
                        ↓
┌──────────────────────────────────────────────────────────────┐
│ 4. Worker procesa job                                        │
│    Worker: workers/ingest_worker.py                          │
│    └─> Parse documento (PDF/DOCX/TXT/MD)                    │
│    └─> Chunking (512 tokens, 80 overlap)                    │
│    └─> Generar embeddings (nomic-embed)                     │
│    └─> Insertar en Qdrant                                   │
│    └─> Guardar metadata en Postgres                         │
│    └─> Actualizar job status: "completed"                   │
└──────────────────────────────────────────────────────────────┘
                        ↓
┌──────────────────────────────────────────────────────────────┐
│ 5. Frontend detecta completed                                │
│    └─> Detener polling                                       │
│    └─> Toast: "✅ Documento procesado"                      │
│    └─> Actualizar lista de documentos                       │
│    └─> Track evento: document_uploaded                      │
└──────────────────────────────────────────────────────────────┘
```text

---

## 6. Performance & Optimización

### 6.1 Cache Strategy

#### VectorStoreIndex Cache

```python
# apps/api/rag/pipeline.py
from cachetools import TTLCache
from datetime import timedelta

# Cache global de índices (TTL 1 hora)
_index_cache = TTLCache(maxsize=100, ttl=3600)

def get_vector_index(user_id: str, force_refresh: bool = False):
    """Obtener índice vectorial cacheado."""
    cache_key = f"index:{user_id}"

    if not force_refresh and cache_key in _index_cache:
        logger.info(f"Cache HIT for user {user_id}")
        return _index_cache[cache_key]

    logger.info(f"Cache MISS for user {user_id}, creating index...")
    index = VectorStoreIndex.from_vector_store(
        vector_store=get_qdrant_client(),
        embed_model=EMBED_MODEL
    )
    _index_cache[cache_key] = index
    return index
```python

#### LLM Client Singleton

```python
# apps/api/clients/llm_client.py
from functools import lru_cache
from llama_index.llms.gemini import Gemini

@lru_cache(maxsize=1)
def get_gemini_client():
    """Singleton LLM client."""
    return Gemini(
        api_key=os.getenv("GEMINI_API_KEY"),
        model=os.getenv("GEMINI_MODEL", "models/gemini-2.0-flash")
    )
```python

### 6.2 Rate Limiting

```python
# apps/api/middleware.py
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)

# Aplicar a rutas específicas
@router.post("/api/waitlist")
@limiter.limit("5/minute")
async def add_to_waitlist(request: Request, ...):
    ...

@router.post("/query")
@limiter.limit("50/hour")
async def query_documents(request: Request, current_user: User, ...):
    ...
```python

### 6.3 Database Connection Pooling

```python
# apps/api/database/postgres_client.py
from sqlalchemy import create_engine
from sqlalchemy.pool import QueuePool

engine = create_engine(
    DATABASE_URL,
    poolclass=QueuePool,
    pool_size=10,          # Conexiones persistentes
    max_overflow=20,       # Conexiones adicionales bajo carga
    pool_timeout=30,
    pool_recycle=3600      # Reciclar conexiones cada hora
)
```python

---

## 7. Monitoring & Observability

### 7.1 Métricas Clave (Google Analytics 4)

#### Landing Page Events

```typescript
// apps/landing/lib/analytics.ts
export const trackEvent = (eventName: string, params?: Record<string, any>) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', eventName, params);
  }
};

// Eventos críticos
trackEvent('cta_click', { location: 'hero', cta_text: 'Solicitar Acceso' });
trackEvent('email_submit', { referral_source: 'linkedin' });
trackEvent('video_play', { video_id: 'demo' });
trackEvent('faq_expand', { question_id: 'seguridad' });
```typescript

#### App Events

```python
# apps/api/services/analytics.py
async def track_event(
    user_id: str,
    event_type: str,
    metadata: Dict[str, Any]
):
    """Track analytics event."""
    event = AnalyticsEvent(
        user_id=user_id,
        event_type=event_type,
        metadata=metadata,
        created_at=datetime.utcnow()
    )
    db.add(event)
    await db.commit()

    # También enviar a GA4 server-side (opcional)
    # await send_to_ga4(event_type, metadata)
```python

### 7.2 Dashboards

#### Admin Dashboard (apps/web/app/admin/page.tsx)

```typescript
interface AdminMetrics {
  // Waitlist
  waitlist_total: number;
  waitlist_invited: number;
  waitlist_pending: number;

  // Users
  users_total: number;
  users_active_7d: number;
  users_onboarding_completed: number;

  // Documents
  documents_total: number;
  documents_uploaded_today: number;

  // Queries
  queries_total: number;
  queries_today: number;
  queries_per_user_avg: number;

  // Errors
  errors_24h: number;
  error_rate: number;  // %

  // Performance
  query_latency_p50: number;  // ms
  query_latency_p95: number;  // ms
}
```typescript

---

## 8. Security Considerations

### 8.1 Authentication & Authorization

- **JWT Secret:** 256-bit random key, almacenado en env vars, nunca en código
- **Password Hashing:** bcrypt con cost factor 12
- **Token Expiration:** 24h para access token (beta), 7 días para refresh (post-beta)
- **HTTPS Only:** Todos los cookies y tokens solo via HTTPS
- **CORS:** Whitelist específica para dominios permitidos

### 8.2 Input Validation

- **Email:** Regex + normalización (lowercase, trim)
- **Passwords:** Min 8 caracteres, al menos 1 número, 1 letra
- **File Upload:** Validar MIME type, extensión, tamaño (<10 MB), content hash
- **SQL Injection:** Usar SQLAlchemy ORM, nunca raw queries
- **XSS:** Sanitizar output en frontend, Content-Security-Policy headers

### 8.3 Rate Limiting

| Endpoint | Limit | Razón |
|----------|-------|-------|
| `/api/waitlist` | 5 req/min por IP | Anti-spam |
| `/auth/login` | 10 req/min por IP | Anti-brute force |
| `/auth/register` | 5 req/min por IP | Anti-bots |
| `/ingest` | 10 req/hora por usuario | Proteger recursos |
| `/query` | 50 req/hora por usuario | Fair use beta |

---

## 9. Testing Strategy

### 9.1 Unit Tests (Backend)

```python
# apps/api/tests/test_waitlist.py
import pytest

@pytest.mark.asyncio
async def test_add_to_waitlist_valid_email():
    response = await client.post("/api/waitlist", json={
        "email": "test@example.com",
        "referral_source": "linkedin"
    })
    assert response.status_code == 201
    assert response.json()["success"] is True

@pytest.mark.asyncio
async def test_add_to_waitlist_duplicate_email():
    # First request
    await client.post("/api/waitlist", json={"email": "test@example.com"})
    # Duplicate request
    response = await client.post("/api/waitlist", json={"email": "test@example.com"})
    assert response.status_code == 409
    assert "already registered" in response.json()["error"]

@pytest.mark.asyncio
async def test_rate_limiting():
    # Enviar 6 requests rápidamente
    for _ in range(6):
        response = await client.post("/api/waitlist", json={"email": f"test{_}@example.com"})
    assert response.status_code == 429
```python

### 9.2 Integration Tests

```python
# apps/api/tests/test_user_journey.py
@pytest.mark.asyncio
async def test_full_user_journey():
    # 1. Registrar usuario
    register_response = await client.post("/auth/register", json={
        "email": "journey@test.com",
        "password": "SecurePass123"
    })
    assert register_response.status_code == 201
    token = register_response.json()["access_token"]

    # 2. Login
    login_response = await client.post("/auth/login", json={
        "email": "journey@test.com",
        "password": "SecurePass123"
    })
    assert login_response.status_code == 200

    # 3. Subir documento
    files = {"file": ("test.txt", b"Test content", "text/plain")}
    headers = {"Authorization": f"Bearer {token}"}
    ingest_response = await client.post("/ingest", files=files, headers=headers)
    assert ingest_response.status_code == 202
    job_id = ingest_response.json()["job_id"]

    # 4. Polling status (simplificado)
    status_response = await client.get(f"/ingest/status/{job_id}", headers=headers)
    assert status_response.status_code == 200

    # 5. Query documento
    query_response = await client.post("/query", json={
        "question": "What is the content?"
    }, headers=headers)
    assert query_response.status_code == 200
    assert "answer" in query_response.json()
```python

### 9.3 E2E Tests (Frontend con Playwright - Opcional Fase 3)

```typescript
// apps/web/tests/landing.spec.ts
import { test, expect } from '@playwright/test';

test('landing page email capture flow', async ({ page }) => {
  await page.goto('/');

  // Verificar hero visible
  await expect(page.locator('h1')).toContainText('Deja de buscar');

  // Completar formulario
  await page.fill('input[type="email"]', 'test@example.com');
  await page.click('button:has-text("Solicitar Acceso")');

  // Verificar redirección a thank-you
  await expect(page).toHaveURL('/thank-you');
  await expect(page.locator('h1')).toContainText('Gracias');
});
```typescript

---

## 10. Deployment Architecture

### 10.1 Fase Beta: Railway (Recomendado)

```yaml
# railway.toml
[build]
  builder = "DOCKERFILE"
  dockerfilePath = "infra/docker/Dockerfile.api"

[deploy]
  startCommand = "uvicorn main:app --host 0.0.0.0 --port $PORT"
  healthcheckPath = "/health"
  healthcheckTimeout = 30
  restartPolicyType = "ON_FAILURE"
  restartPolicyMaxRetries = 3

# Servicios
services:
  - api (FastAPI)
  - web (Next.js)
  - postgres (managed)
  - redis (managed)
  - qdrant (external: Qdrant Cloud Starter $0/mes)
```yaml

#### Costes Estimados (Railway)

- API + Web + Worker: $5-10/mes (Hobby plan)
- Postgres: Incluido
- Redis: Incluido
- Qdrant Cloud: $0-25/mes (starter)
- **Total: $5-35/mes**

### 10.2 Alternativa: Fly.io

```toml
# fly.toml
app = "anclora-api"

[build]
  dockerfile = "infra/docker/Dockerfile.api"

[[services]]
  http_checks = []
  internal_port = 8000
  protocol = "tcp"

  [[services.ports]]
    handlers = ["http"]
    port = 80

  [[services.ports]]
    handlers = ["tls", "http"]
    port = 443
```toml

---

## 11. Rollout Plan

### 11.1 Invite Waves

| Ola | Día | Usuarios | Criterio | Objetivo |
|-----|-----|----------|----------|----------|
| **1** | 1 | 10 | Friends & Family | Validar bugs críticos |
| **2** | 3 | 20 | Network cercano | Feedback detallado |
| **3** | 7 | 30 | Early waitlist | Tracción inicial |
| **4** | 14 | 50 | Resto waitlist | Escalar uso |

### 11.2 Criterios para Siguiente Ola

- ✅ Error rate <5% en ola anterior
- ✅ No bugs P0/P1 sin resolver
- ✅ Feedback survey completado por >50% usuarios
- ✅ Performance estable (P95 <5seg)

---

## 12. Decisiones Finales

### ✅ Decisiones APROBADAS

| ID | Decisión | Elección Final | Justificación |
|----|----------|----------------|---------------|
| **D1** | Arquitectura landing | ✅ **Separada (Vercel)** | Mejor performance, SEO, y flexibilidad marketing |
| **D2** | Dominio | ✅ **anclora.com** | Dominio existente, profesional |
| **D3** | Email service | ✅ **Hostinger SMTP** | Ya contratado, coste $0, dominio propio |

### ❓ Decisiones PENDIENTES

| ID | Decisión | Opciones | Recomendación | Impacto |
|----|----------|----------|---------------|---------|
| **D4** | Invite strategy | Automático / Manual approval | Manual (admin dashboard) | Bloquea T067 |
| **D5** | Product Hunt | Día 1 / Esperar tracción | Esperar (día 7) | No bloqueante |
| **D6** | A/B testing tool | Vercel / Google Optimize / Manual | Vercel Analytics | No bloqueante |

### 📋 Configuración de Infraestructura Confirmada

**Dominios:**
- Landing: `www.anclora.com` o `anclora.com` → Vercel
- App Beta: `app.anclora.com` → Railway/Fly.io

**Email (Hostinger SMTP):**
- Server: `smtp.hostinger.com:465` (SSL)
- Accounts/Aliases a crear:
  - `noreply@anclora.com` - Emails automáticos
  - `soporte@anclora.com` - Support tickets (ya existe como `hola@`)
  - `beta@anclora.com` - Invitaciones (opcional)

**Costes Mensuales Estimados:**
- Landing (Vercel): $0 (free tier)
- Email (Hostinger): $0 (ya incluido)
- App Beta (Railway): $5-20/mes
- Qdrant Cloud: $0-25/mes
- **Total: $5-45/mes** (vs $15-50 original, ahorro de $10-30/mes)

---

**Documento creado:** 2025-10-20
**Estado:** 🟡 Pendiente de decisiones (D1-D4)
**Próximo paso:** Aprobar decisiones críticas y comenzar Fase 0
