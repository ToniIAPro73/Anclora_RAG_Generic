<#
.SYNOPSIS
    Primera prueba de ingesta en Anclora RAG
#>

$ErrorActionPreference = "Stop"
Write-Host "`n🧪 Test de Ingesta - Anclora RAG" -ForegroundColor Cyan

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot ".." "..")).Path
$resourcesPath = Join-Path $repoRoot "tests/resources"
if (-not (Test-Path $resourcesPath)) {
    New-Item -ItemType Directory -Path $resourcesPath | Out-Null
}

Push-Location $repoRoot

# 1. Crear documento de prueba
Write-Host "`n1️⃣ Creando documento de prueba..." -ForegroundColor Yellow
$testDoc = @"
# Documento de Prueba: Ejemplo de uso de Meta Prompt para el Diseño de la Marca Anclora

### ROL ###

Actuarás como un diseñador gráfico y de comunicación visual, con especialización en el diseño de marca, producto digital y creacción de logos.

### OBJETIVO ###

El objetivo es elaborar un diseño de marca estructuro en función de los datos aportados en la tarea.

### INSTRUCCIONES PROCEDIMENTALES ###

Desglosa la tarea en la siguiente secuencia de pasos:

[
	1) Fundamentos estratégicos

		Propósito & visión (por qué existes y a dónde vas).

		Posicionamiento (para quién, qué problema resuelves, categoría).

		Propuesta de valor & diferenciadores.

		Valores & arquetipo de marca.

		Territorio visual y verbal (conceptos y metáforas guía).

	2) Identidad verbal

		Naming (marca, producto, planes, features).

		Tagline y mensajes pilar (3–5).

		Tono de voz (atributos + do’s & don’ts).

		Microcopy UX (vacíos, errores, vaciados, vacíos de datos).

		Guía multilingüe (ES/EN): estilo, localismos y formalidad.

	3) Identidad visual

		Logo system (horizontal, vertical, isotipo, reducción mínima).

		Paleta (base, acentos, estados; contraste AA/AAA).

		Tipografías (jerarquías y usos).

		Iconografía & pictogramas (línea, grosor, ritmo).

		Ilustración/fotografía (estilo, encuadre, fondos).

		Light/Dark mode (reglas de inversión/adaptación).

		Motion brand (curvas, duraciones, “firma” de interacción).

	4) Design System (UI)

		Design tokens (color, tipografía, espaciado, radios, sombras, z-index).

		Componentes base (Button, Input, Select, Card, Modal, Navbar, Toast).

		Patrones (onboarding, vacíos, loading, paginación, búsqueda).

		Accesibilidad (focus states visibles, navegación teclado, ARIA).

		Documentación (Storybook/Penpot/Figma + notas de uso).

	5) Experiencia y contenidos

		Arquitectura de información (navegación, sitemap).

		Plantillas (landing, pricing, blog, help center, emails).

		SEO/ASO & Open Graph (títulos, descripciones, previews).

		Sistema de ilustraciones para features y estados.

	6) Marketing & Growth kit

		Landing principal (sección hero, prueba social, CTA).

		Emailing (transaccional + marketing; firmas de correo).

		Redes & Ads (formatos, safe areas, variantes).

		Press kit (logo, paletas, usos permitidos/prohibidos).

	7) Gobernanza de marca

		Brand book (PDF/Notion) y changelog de diseño.

		Convenciones de nombre (componentes, assets, tokens).

		Checklist de QA de marca por release.

		Métricas: consistencia (auditorías UI), accesibilidad (Lighthouse), activación/conversión, NPS, recall de marca.

	8) Legal & licencias

		Uso tipográfico (licencias).

		Derechos de imágenes/ilustraciones.

		Registro de marca y políticas de uso.

		Cumplimiento (GDPR, cookies, accesibilidad EN 301 549).

]

Utiliza un lenguaje profesional y claro. 

Modelo recomendado: por tratarse de ideación visual, propongo GPT-4o o GPT-5 Thinking en modo creativo (~1.1)

### ESPECIFICACIONES DE FORMATO ###

El resultado final se va a dividir en dos entregables en formato Markdown:

 A) El primer entregable deberá incluir los siguientes puntos:

    1) Fundamentos estratégicos
	2) Identidad verbal
	3) Identidad visual
	4) Design System (UI)
	5) Experiencia y contenidos
	6) Marketing & Growth kit
	7) Gobernanza de marca
	8) Legal & licencias

 B) El segundo entregable sera un MVP de marca con los siguientes elementos:
 
    1) Brand One-Pager (propósito, posicionamiento, tono, paleta, tipografías, 3 mensajes pilar)
    2) Tokens base (JSON/CSS variables) + UI kit mínimo (Buttons, Inputs, Card, Navbar, Toast con estados y tamaños)	
    3) Landing v1 + email transaccional (plantillas)
	
### HERRAMIENTAS RECOMENDADAS ###

Las herramientas recomendadas (priorizando open-source / no-code) son:

 * Penpot (alternativa OSS a Figma) o Figma Free para colaboración.

 * Storybook para documentar componentes.

 * Tailwind + Style Dictionary para tokens; Radix UI / shadcn/ui para base accesible.

 * Phosphor / Lucide (iconos OSS).

 * LottieFiles para micro-animaciones.

 * Notion/Anytype para brand book vivo.

 * Contrast.tools / Axe para accesibilidad.	


### TAREA SOBRE LA QUE APLICAR EL META PROMPT ###

	
Documento Estratégico de Marca: Ecosistema Anclora
Para: Equipo de Diseño de Marca
De: Alex, Experto en Marketing
Asunto: Fundamentos para la Creación de la Identidad Visual del Ecosistema "Anclora"
Fecha: 9 de octubre de 2025

1. La Filosofía Central: El ADN de Anclora
Para diseñar una marca memorable, primero debemos entender su propósito fundamental. No vendemos productos; ofrecemos transformación.

Nombre de la Marca Principal: Anclora

Concepto Central (La Gran Idea): En un océano digital caótico, lleno de información desbordante y complejidad técnica, Anclora es el punto de estabilidad, control y progreso. Es el ancla que permite a los emprendedores y creadores de contenido no solo sobrevivir, sino navegar con propósito y seguridad para alcanzar sus metas. La marca representa fuerza, enfoque y seguridad en un entorno cambiante.

La Directiva Principal (Misión): La misión de Anclora es equipar a emprendedores, creadores y pequeñas empresas con un ecosistema de herramientas y sistemas inteligentes e integrados que les devuelvan el control sobre su negocio digital. Anclora transforma la complejidad tecnológica en una ventaja competitiva.


Visión a Largo Plazo: Ser el sistema operativo de referencia para el emprendedor digital moderno, un ecosistema donde la creación de contenido, la automatización del marketing y la inteligencia de negocio convergen de forma fluida y eficaz.

2. El Personaje Atractivo y el Tono de Voz
La marca Anclora debe comunicarse como una entidad específica, un "Personaje Atractivo". Esto es crucial para construir una relación con la audiencia, no solo una transacción.


Identidad del Personaje: El Líder / El Mentor Analítico. Anclora no es un vendedor agresivo. Es un guía experto y calmado que ha recorrido el camino y ahora ofrece el mapa y las herramientas a otros. Es una figura de autoridad que inspira confianza a través de la lógica, los datos y los resultados demostrables.


Tono de Voz:

Autoritativo y Seguro: Comunica con la certeza de un experto.

Claro y Directo: Sin ambigüedades ni jerga innecesaria. Prioriza la claridad sobre la "prosa elegante".

Estratégico y Lógico: Basa sus recomendaciones en principios y datos. Piensa siempre en términos de ROI y eficiencia.

Empoderador: El objetivo final es darle al cliente el control y la confianza en sus propias capacidades, amplificadas por las herramientas de Anclora.

3. El Cliente Ideal (El Avatar)
No podemos hablarle a todo el mundo. Nos dirigimos a un perfil muy específico.

Nombre del Avatar: El "Emprendedor Visionario".

Descripción: Hombres y mujeres de 25 a 50 años. Son fundadores de startups, creadores de contenido (youtubers, podcasters, bloggers), coaches, consultores o dueños de pequeños negocios digitales.

Puntos de Dolor:

Se sienten abrumados por la cantidad de herramientas digitales que necesitan ("el síndrome del objeto brillante").

Pierden tiempo valioso en tareas manuales y repetitivas que podrían automatizarse.

Luchan por conectar los puntos entre su contenido, sus campañas de marketing y sus ventas.

Les preocupa la seguridad de sus activos digitales y los datos de sus clientes.

Saben que la IA es el futuro, pero no saben cómo implementarla de forma práctica y efectiva en su negocio.

Sueños y Deseos:

Desean un sistema "todo en uno" que simplifique su operación.

Anhelan tener más tiempo para dedicarse a su "zona de genialidad" (crear, enseñar, vender) en lugar de a la gestión técnica.

Quieren claridad y control sobre sus métricas de negocio para tomar decisiones basadas en datos.

Buscan construir un negocio escalable, rentable y seguro.

4. El Ecosistema Anclora: La Escalera de Valor
El ecosistema de sub-marcas no es una lista aleatoria de productos. Es una "Escalera de Valor" perfectamente diseñada. Guía a nuestro Avatar desde un problema inicial y de bajo coste hasta la solución más completa y premium. Cada sub-marca es un peldaño que aumenta en valor y precio.


A continuación, se desglosa el propósito de cada sub-marca dentro de esta escalera, para que el diseño refleje su función específica.

Peldaños Bajos: Herramientas de Creación y Productividad (Atraer y Convertir Leads)
Son las herramientas de entrada, diseñadas para resolver un problema específico y doloroso, actuando como Lead Magnets o productos de bajo coste.

1) Anclora Pdf2Epub: Una herramienta de nicho, simple y directa. Convierte documentos PDF en formatos de e-book. Es un "cebo" perfecto para autores y creadores de contenido.

2) Anclora Press: Una plataforma o servicio para la publicación y distribución de contenido (blogs, newsletters, e-books). Se enfoca en la facilidad de uso y la difusión.

3) Anclora Render: Un servicio o herramienta para la creación de activos visuales (imágenes para redes sociales, miniaturas de vídeo, infografías). Ayuda a los creadores a destacar visualmente.

Peldaños Medios: Sistemas de Crecimiento y Automatización (Optimizar y Escalar)
Una vez que el cliente está en nuestro mundo, le ofrecemos sistemas más robustos para automatizar y hacer crecer su negocio.

4) Anclora Impulso: Un conjunto de herramientas o servicios enfocados en el crecimiento de la audiencia (ej. SEO, gestión de redes sociales, campañas de tráfico). Su nombre lo dice todo: dar impulso.

5) Anclora Flow: Una plataforma de automatización de marketing. Conecta las diferentes partes del negocio (emails, redes sociales, ventas) en flujos de trabajo lógicos. Se trata de eficiencia y sistemas.

6) Anclora Control: Un dashboard de análisis y métricas. Unifica los datos de todas las fuentes para dar al emprendedor una visión clara y el "control" sobre su negocio.

Peldaños Altos: Inteligencia y Seguridad (Dominar y Proteger)
Estas son las ofertas premium. Soluciones avanzadas basadas en IA y seguridad para clientes que buscan la máxima ventaja competitiva.

7) Anclora Kairon: (Kairós es el "momento oportuno" en griego). Un sistema de IA que identifica el mejor momento para lanzar una oferta, enviar un email o publicar contenido, basándose en el comportamiento del usuario. Es inteligencia predictiva.

8) Anclora RAG Generic: Una solución de IA (Retrieval-Augmented Generation) que permite a las empresas crear chatbots o asistentes internos basados en su propia base de conocimiento (documentos, webs, etc.).

9) Anclora RAG Conversion: Una versión especializada de la anterior. Es un agente de IA entrenado específicamente para convertir visitantes en clientes a través de conversaciones personalizadas en un sitio web o e-commerce.

10) Anclora Cortex: El "cerebro" del ecosistema. Una plataforma de inteligencia de negocio que no solo muestra datos (como Control), sino que genera insights y recomendaciones estratégicas proactivas.


11) Anclora Guardian: Un servicio o plataforma de ciberseguridad. Protege los activos digitales del negocio (web, listas de correo, datos de clientes), actuando como el guardián de la fortaleza digital.

12) Anclora Nexus: Es el núcleo central que conecta e integra todo el ecosistema. No es un producto que se venda por separado, sino el "sistema operativo" que hace que todas las demás herramientas funcionen en perfecta armonía. Es el corazón de la propuesta de valor.

5. Directrices para el Diseño Visual
Basado en la estrategia anterior, aquí están las directrices para el equipo de diseño:

Logotipo Principal (Anclora):

Debe evocar el concepto de un ancla de forma moderna, minimalista y tecnológica.

Debe transmitir fuerza, estabilidad y confianza.

Evitar un diseño demasiado literal o náutico. Pensemos más en un ancla como un "punto de conexión" o "centro de gravedad".

Sistema de Sub-marcas:

Debe existir una arquitectura de marca clara. Todas las sub-marcas deben sentirse parte de la misma familia, pero ser distinguibles.

Opción A (Recomendada): Un isologo unificado para "Anclora" que se combine con el nombre de la sub-marca. El diferenciador principal podría ser un color secundario o un pequeño icono secundario para cada sub-marca que represente su función (ej. un gráfico ascendente para Impulso, un cerebro para Cortex, un escudo para Guardian).

Opción B: Variaciones del logo principal de Anclora para cada sub-marca, manteniendo una coherencia formal.

Paleta de Colores:

Primarios: Un azul oscuro o un gris grafito como color principal. Evocan profesionalismo, tecnología, calma y confianza.

Secundario/Acento: Un color vibrante pero elegante para los llamados a la acción y para resaltar elementos. Podría ser un verde esmeralda (crecimiento, resultados), un dorado/ocre (valor premium) o un turquesa (claridad, innovación).

Terciarios: Una gama de grises claros y blancos para fondos y espacios limpios.

Tipografía:

Seleccionar una familia tipográfica Sans Serif moderna, limpia y altamente legible. Debe funcionar bien tanto en titulares (con peso) como en cuerpos de texto largos.

Debe sentirse profesional, tecnológica y accesible. Ejemplos de inspiración: Inter, Poppins, Lato.

6. Conclusión para el Equipo de Diseño
Su misión es traducir esta estrategia en una identidad visual que comunique instantáneamente la promesa de Anclora: ser el ancla de la certeza en el mar de la incertidumbre digital. Cada elemento de diseño debe responder a esta idea central.

Estamos construyendo más que una serie de herramientas; estamos construyendo el ecosistema de confianza para la próxima generación de líderes digitales.	
	
"@

$testPath = Join-Path $resourcesPath "test_document.txt"
$testDoc | Out-File -FilePath $testPath -Encoding UTF8 -NoNewline
Write-Host "   ✅ Documento creado: test_document.txt" -ForegroundColor Green

# 2. Ingestar documento
Write-Host "`n2️⃣ Ingiriendo documento en el sistema..." -ForegroundColor Yellow
Write-Host "   ⏳ Esto puede tardar 10-30s en CPU..." -ForegroundColor DarkGray

try {
    $boundary = [System.Guid]::NewGuid().ToString()
    $fileContent = Get-Content $testPath -Raw -Encoding UTF8
    $fileName = "test_document.txt"
    
    $bodyLines = @(
        "--$boundary",
        "Content-Disposition: form-data; name=`"file`"; filename=`"$fileName`"",
        "Content-Type: text/plain",
        "",
        $fileContent,
        "--$boundary--"
    )
    
    $body = $bodyLines -join "`r`n"
    
    $response = Invoke-WebRequest -Uri "http://localhost:8030/ingest" `
        -Method POST `
        -ContentType "multipart/form-data; boundary=$boundary" `
        -Body ([System.Text.Encoding]::UTF8.GetBytes($body)) `
        -UseBasicParsing `
        -TimeoutSec 60
    
    $result = $response.Content | ConvertFrom-Json
    
    Write-Host "   ✅ Ingesta exitosa!" -ForegroundColor Green
    Write-Host "   📄 Archivo: $($result.file)" -ForegroundColor DarkGray
    Write-Host "   🧩 Chunks creados: $($result.chunks)" -ForegroundColor DarkGray
    
} catch {
    Write-Host "   ❌ Error en ingesta: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "`n📋 Logs del API:" -ForegroundColor Yellow
    docker compose -f infra/docker/docker-compose.dev.yml logs --tail=20 api
    exit 1
}

# 3. Verificar colección en Qdrant
Write-Host "`n3️⃣ Verificando colección en Qdrant..." -ForegroundColor Yellow

try {
    $qdrantResponse = Invoke-WebRequest -Uri "http://localhost:6363/collections/documents" `
        -Method GET -UseBasicParsing -TimeoutSec 5
    
    $collection = $qdrantResponse.Content | ConvertFrom-Json
    
    Write-Host "   ✅ Colección 'documents' encontrada" -ForegroundColor Green
    Write-Host "   📊 Puntos almacenados: $($collection.result.points_count)" -ForegroundColor DarkGray
    Write-Host "   📐 Dimensión vectores: $($collection.result.config.params.vectors.size)" -ForegroundColor DarkGray
    
} catch {
    Write-Host "   ⚠️  No se pudo verificar Qdrant: $($_.Exception.Message)" -ForegroundColor Yellow
}

# 4. Resumen
Write-Host "`n🎯 Test de Ingesta Completado Exitosamente" -ForegroundColor Green
Write-Host "`n📊 Resumen:" -ForegroundColor Cyan
Write-Host "   ✅ Documento parseado correctamente" -ForegroundColor DarkGray
Write-Host "   ✅ Embeddings generados" -ForegroundColor DarkGray
Write-Host "   ✅ Vectores almacenados en Qdrant" -ForegroundColor DarkGray

Write-Host "`n💡 Próximos pasos:" -ForegroundColor Cyan
Write-Host "   1. Configurar Ollama con modelo LLM" -ForegroundColor DarkGray
Write-Host "   2. Implementar endpoint /query funcional" -ForegroundColor DarkGray
Write-Host "   3. Probar consulta RAG end-to-end" -ForegroundColor DarkGray

Write-Host "`n🔍 Ver colección en Qdrant Dashboard:" -ForegroundColor Yellow
Write-Host "   http://localhost:6363/dashboard" -ForegroundColor DarkGray

Pop-Location
