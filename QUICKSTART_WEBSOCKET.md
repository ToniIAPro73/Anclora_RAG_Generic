# 🚀 Quick Start - Testing WebSocket Push Notifications

**Estado**: ✅ Implementación completa - Listo para testing
**Última sesión**: 2025-10-18 04:32 UTC

---

## ⚡ Inicio Rápido (3 pasos)

### 1️⃣ Iniciar el stack de desarrollo

Abre PowerShell en el directorio del proyecto:

```powershell
cd C:\Users\Usuario\Workspace\01_Proyectos\Anclora-RAG-Generic
.\scripts\powershell\start_dev.ps1
```

**Espera 20-30 segundos** a que todo esté listo.

### 2️⃣ Abrir el navegador

Abre: **http://localhost:3030**

### 3️⃣ Probar la funcionalidad

1. Presiona **F12** para abrir DevTools
2. Ve a la pestaña **Console**
3. Arrastra un archivo PDF/TXT/DOCX/MD a la zona de upload
4. Observa los mensajes WebSocket en la consola en tiempo real

---

## ✅ Qué deberías ver

### En la UI (español):

```
Subiendo archivo...
     ↓
En cola...
     ↓
Procesando documento...
     ↓
Analizando documento...    ← NUEVO: paso "parsing"
     ↓
Indexando contenido...     ← NUEVO: paso "indexing"
     ↓
✓ Completado
```

### En la Console (DevTools):

```javascript
WebSocket connected for job abc123-...
{type: "connected", job_id: "abc123", ...}
{type: "job_update", status: "queued", ...}
{type: "job_update", status: "processing", filename: "test.pdf"}
{type: "job_update", status: "processing", step: "parsing", ...}
{type: "job_update", status: "processing", step: "indexing", ...}
{type: "job_update", status: "completed", chunks: 5, ...}
WebSocket disconnected for job abc123
```

---

## 📋 Checklist de Testing

- [ ] Frontend carga correctamente en http://localhost:3030
- [ ] Backend responde en http://localhost:8030/health
- [ ] DevTools → Console abierta
- [ ] Archivo subido (PDF/TXT/DOCX/MD)
- [ ] Mensajes WebSocket aparecen en Console
- [ ] Estados granulares visibles ("Analizando...", "Indexando...")
- [ ] Actualización instantánea (< 1 segundo entre pasos)
- [ ] Documento aparece en el historial al finalizar
- [ ] WebSocket se desconecta limpiamente al terminar

---

## 🐛 Si algo no funciona

### Verificar servicios:

```powershell
# API health
curl http://localhost:8030/health

# Ver logs del backend
docker logs docker-api-1

# Ver logs del worker
docker logs docker-worker-1

# Ver servicios corriendo
docker ps
```

### Reiniciar todo:

```powershell
.\scripts\powershell\stop_dev.ps1
.\scripts\powershell\start_dev.ps1
```

---

## 📚 Documentación Completa

Para más detalles, ver: `docs/WEBSOCKET_STATUS.md`

---

## 🎯 Después del Testing

Si todo funciona correctamente, reporta:
1. ✅ Estados granulares funcionan
2. ✅ WebSocket conecta/desconecta correctamente
3. ✅ Latencia < 1s entre actualizaciones
4. ✅ Sin errores en Console
5. ✅ Documento aparece en historial

**Próximo paso**: Actualizar `docs/ESTADO_PROYECTO.md` marcando:
- Worker RQ: ✅
- Ingesta asíncrona: ✅
- WebSocket Push: ✅

---

**¡Que tengas un buen descanso! 😊**
