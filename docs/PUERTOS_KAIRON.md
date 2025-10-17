# Anclora Kairon - Port Configuration

## Overview
Anclora Kairon es una aplicación web con landing page y aplicación principal. Esta configuración de puertos evita conflictos con otros proyectos del ecosistema Anclora.

## Port Assignment

| Service       | Port  | Description                          | Status      |
|---------------|-------|--------------------------------------|-------------|
| Landing Page  | 5174  | Página de marketing (Vite dev)       | ✅ Active   |
| Main App      | 5175  | Aplicación principal (Vite dev)      | ✅ Active   |
| Production    | 4173  | Build de producción                  | 🔄 Preview  |
| API Backend   | 8073  | API REST (si aplica)                 | ⏳ Planned  |
| Database      | 5473  | Base de datos (si aplica)            | ⏳ Planned  |

## Development Commands

### Landing Page Development
```bash
# Desde el directorio raíz del proyecto
npm run dev:landing      # Servidor en puerto 5174
npm run build:landing    # Build para producción
npm run preview:landing  # Preview del build
```

### Main Application Development
```bash
# Desde el directorio raíz del proyecto
npm run dev:app         # Servidor en puerto 5174
npm run build:app       # Build para producción
npm run preview:app     # Preview del build
```

### Both Services (Recommended for full development)
```bash
# Desde el directorio raíz del proyecto
npm run dev             # Ambos servicios simultáneamente
```

## Port Conflict Resolution

Esta configuración evita conflictos con:

### Anclora RAG Generic (Ports: 3030, 8030, 5462, 6363, 6389, 11464)
- ✅ **No conflict**: Kairon usa puertos 517x vs RAG usa 3030, 8030, 5xxx, 6xxx, 1xxxx

### Anclora Flow (Ports: 3020, 8020, 5452)
- ✅ **No conflict**: Kairon usa puertos 517x vs Flow usa 3020, 8020, 5452

### Other Common Services
- ✅ **No conflict**: Evita puertos comunes como 3000, 3001, 5000, 8000, 8080

## Production Deployment

### Landing Page
- **Domain**: `https://anclorakairon.com` (puerto 443)
- **Build**: Usar `npm run build:landing` y servir desde puerto 4173 en desarrollo

### Main Application
- **Domain**: `https://app.anclorakairon.com` (puerto 443)
- **Build**: Usar `npm run build:app` y servir desde puerto estándar

## Network Access

### Local Development
- **Landing**: http://localhost:5174
- **App**: http://localhost:5175
- **Network**: Disponible en red local usando `--host` flag

### Docker Deployment (Future)
```bash
# Ejemplo de configuración Docker
docker run -p 5173:5173 -p 5174:5174 anclora-kairon
```

## Troubleshooting

### Port Already in Use
```bash
# Encontrar qué proceso usa el puerto
netstat -ano | findstr :5174

# Matar proceso (Windows)
taskkill /PID <PID> /F

# Matar proceso (Unix/Mac)
kill -9 <PID>
```

### Alternative Ports (si es necesario)
```bash
# Si 5174 está ocupado, usar:
npm run dev:landing -- --port 5176

# Si 5175 está ocupado, usar:
npm run dev:app -- --port 5177
```

## Multi-Project Development

Para trabajar simultáneamente en múltiples proyectos Anclora:

1. **Anclora Kairon**: Puertos 5173-5174
2. **Anclora Flow**: Puertos 3020, 8020, 5452
3. **Anclora RAG Generic**: Puertos 3030, 8030, 5462+

Esto permite ejecutar todas las aplicaciones simultáneamente sin conflictos.

## Terminal Auto-Setup

Para automatizar la verificación de entorno y puertos al abrir un nuevo terminal:

### PowerShell Setup
```powershell
# Add to PowerShell profile (~/.config/powershell/Microsoft.PowerShell_profile.ps1)
# Execute this command in the project directory:
& "src\scripts\init-terminal.ps1"
```

### CMD Setup
```cmd
REM Add to CMD auto-run (create shortcut with target):
REM cmd.exe /k "src\scripts\init-terminal.bat"
```

### VS Code Terminal Setup
1. Abre VS Code en el directorio del proyecto
2. Archivo > Preferencias > Configuración
3. Busca "Terminal Integrated: Shell Args Windows"
4. Añade el siguiente argumento:
   ```json
   "terminal.integrated.shellArgs.windows": [
     "-NoExit",
     "-Command",
     "& 'src\\scripts\\init-terminal.ps1'"
   ]
   ```

## Development Scripts

### Available NPM Scripts
```bash
npm run setup           # Check environment and ports
npm run check-ports     # Verify port availability
npm run kill-ports      # Force kill occupied ports
npm run dev:clean       # Clean start (kill ports + setup + dev)
npm run dev:landing:clean # Clean start landing page
```

### Manual Port Management
```bash
# Check specific port
node src/scripts/dev-setup.js

# Kill specific port
node src/scripts/kill-ports.js --port 5174

# Auto-setup (recommended)
node src/scripts/auto-setup.js
```

## Last Updated
- **Date**: 2025-10-13
- **Status**: Active development
- **Ports**: Verified available
- **Auto-setup**: Scripts created and tested