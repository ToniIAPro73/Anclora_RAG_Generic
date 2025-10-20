# Pre-Deployment Checklist Script
# Ejecutar: .\scripts\powershell\pre_deploy_check.ps1

param(
    [switch]$Verbose
)

Write-Host "=== Anclora RAG - Pre-Deployment Checklist ===" -ForegroundColor Cyan
Write-Host ""

$errors = @()
$warnings = @()
$passed = 0

function Test-Step {
    param(
        [string]$Name,
        [scriptblock]$Test,
        [string]$FailMessage,
        [string]$SuccessMessage = "OK",
        [switch]$IsWarning
    )

    Write-Host "[$($passed + $errors.Count + $warnings.Count + 1)] $Name... " -NoNewline

    try {
        $result = & $Test
        if ($result) {
            Write-Host "✓ $SuccessMessage" -ForegroundColor Green
            $script:passed++
            return $true
        } else {
            if ($IsWarning) {
                Write-Host "⚠ $FailMessage" -ForegroundColor Yellow
                $script:warnings += $FailMessage
            } else {
                Write-Host "✗ $FailMessage" -ForegroundColor Red
                $script:errors += $FailMessage
            }
            return $false
        }
    } catch {
        if ($IsWarning) {
            Write-Host "⚠ Error: $($_.Exception.Message)" -ForegroundColor Yellow
            $script:warnings += "$Name - $($_.Exception.Message)"
        } else {
            Write-Host "✗ Error: $($_.Exception.Message)" -ForegroundColor Red
            $script:errors += "$Name - $($_.Exception.Message)"
        }
        return $false
    }
}

Write-Host "## 1. Verificando Entorno Local" -ForegroundColor Yellow
Write-Host ""

# Git status
Test-Step -Name "Git working directory clean" -Test {
    $status = git status --porcelain
    return ($status.Length -eq 0)
} -FailMessage "Hay cambios sin commitear" -IsWarning

# Node version
Test-Step -Name "Node.js instalado" -Test {
    $null = node --version 2>&1
    return $LASTEXITCODE -eq 0
} -FailMessage "Node.js no encontrado" -SuccessMessage "$(node --version)"

# Docker running
Test-Step -Name "Docker Desktop corriendo" -Test {
    $null = docker version 2>&1
    return $LASTEXITCODE -eq 0
} -FailMessage "Docker no está corriendo" -IsWarning

Write-Host ""
Write-Host "## 2. Verificando Landing Page (apps/landing)" -ForegroundColor Yellow
Write-Host ""

# Landing dependencies
Test-Step -Name "Dependencias instaladas" -Test {
    return (Test-Path "apps/landing/node_modules")
} -FailMessage "Ejecutar: cd apps/landing && npm install"

# Landing build works
Test-Step -Name "Build exitoso" -Test {
    Push-Location apps/landing
    npm run build 2>&1 | Out-Null
    $result = $LASTEXITCODE -eq 0
    Pop-Location
    return $result
} -FailMessage "Build falla. Ver logs con: cd apps/landing && npm run build"

# vercel.json exists
Test-Step -Name "vercel.json configurado" -Test {
    return (Test-Path "apps/landing/vercel.json")
} -FailMessage "Crear vercel.json" -SuccessMessage "Configuración Vercel presente"

# .env.example exists
Test-Step -Name ".env.example presente" -Test {
    return (Test-Path "apps/landing/.env.example")
} -FailMessage "Crear .env.example con variables documentadas" -IsWarning

Write-Host ""
Write-Host "## 3. Verificando Backend API (apps/api)" -ForegroundColor Yellow
Write-Host ""

# Python dependencies
Test-Step -Name "requirements.txt presente" -Test {
    return (Test-Path "apps/api/requirements.txt")
} -FailMessage "requirements.txt no encontrado"

# Dockerfile exists
Test-Step -Name "Dockerfile existe" -Test {
    return (Test-Path "infra/docker/Dockerfile")
} -FailMessage "Dockerfile no encontrado"

# Waitlist endpoint exists
Test-Step -Name "Endpoint waitlist presente" -Test {
    return (Test-Path "apps/api/routes/waitlist.py")
} -FailMessage "routes/waitlist.py no encontrado"

# Email client exists
Test-Step -Name "Cliente email configurado" -Test {
    return (Test-Path "apps/api/clients/email_client.py")
} -FailMessage "clients/email_client.py no encontrado"

# SQL init script
Test-Step -Name "Script init DB presente" -Test {
    return (Test-Path "apps/api/database/create_waitlist_tables.sql")
} -FailMessage "SQL init script no encontrado"

Write-Host ""
Write-Host "## 4. Verificando Seguridad" -ForegroundColor Yellow
Write-Host ""

# .gitignore has .env
Test-Step -Name ".env en .gitignore" -Test {
    $content = Get-Content ".gitignore" -Raw
    return ($content -match "\.env")
} -FailMessage ".env no está en .gitignore (CRÍTICO)"

# .env not committed
Test-Step -Name ".env no commiteado" -Test {
    $tracked = git ls-files ".env" 2>&1
    return ($null -eq $tracked -or $tracked.Length -eq 0)
} -FailMessage ".env está commiteado - ELIMINAR del git history"

# .env.example doesn't have secrets
Test-Step -Name ".env.example sin secretos" -Test {
    if (Test-Path ".env.example") {
        $content = Get-Content ".env.example" -Raw
        return (-not ($content -match "Tresboys" -or $content -match "antonio@"))
    }
    return $true
} -FailMessage ".env.example contiene credenciales reales" -IsWarning

Write-Host ""
Write-Host "## 5. Verificando Documentación" -ForegroundColor Yellow
Write-Host ""

# Deployment guide exists
Test-Step -Name "Guía de deployment presente" -Test {
    return (Test-Path "docs/DEPLOYMENT_GUIDE.md")
} -FailMessage "Crear DEPLOYMENT_GUIDE.md" -SuccessMessage "Guía completa disponible"

# Fase 0 doc exists
Test-Step -Name "Documentación Fase 0" -Test {
    return (Test-Path "docs/FASE_0_IMPLEMENTACION.md")
} -FailMessage "Documentación Fase 0 no encontrada" -IsWarning

# Landing review exists
Test-Step -Name "Revisión landing presente" -Test {
    return (Test-Path "docs/REVISION_LANDING_PAGE.md")
} -FailMessage "Revisión de landing no encontrada" -IsWarning

Write-Host ""
Write-Host "## 6. Verificando Configuración Cloud" -ForegroundColor Yellow
Write-Host ""

# Vercel CLI installed
Test-Step -Name "Vercel CLI instalada" -Test {
    $null = vercel --version 2>&1
    return $LASTEXITCODE -eq 0
} -FailMessage "Instalar: npm i -g vercel" -IsWarning -SuccessMessage "$(vercel --version)"

# Railway CLI installed
Test-Step -Name "Railway CLI instalada" -Test {
    $null = railway --version 2>&1
    return $LASTEXITCODE -eq 0
} -FailMessage "Instalar: npm i -g @railway/cli" -IsWarning -SuccessMessage "$(railway --version)"

Write-Host ""
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host ""

# Summary
$total = $passed + $errors.Count + $warnings.Count
Write-Host "Resultado: $passed/$total checks pasaron" -ForegroundColor $(if ($errors.Count -eq 0) { "Green" } else { "Yellow" })
Write-Host ""

if ($errors.Count -gt 0) {
    Write-Host "❌ ERRORES CRÍTICOS ($($errors.Count)):" -ForegroundColor Red
    $errors | ForEach-Object { Write-Host "  - $_" -ForegroundColor Red }
    Write-Host ""
}

if ($warnings.Count -gt 0) {
    Write-Host "⚠️  WARNINGS ($($warnings.Count)):" -ForegroundColor Yellow
    $warnings | ForEach-Object { Write-Host "  - $_" -ForegroundColor Yellow }
    Write-Host ""
}

if ($errors.Count -eq 0 -and $warnings.Count -eq 0) {
    Write-Host "✅ TODO LISTO PARA DEPLOYMENT!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Próximos pasos:" -ForegroundColor Cyan
    Write-Host "  1. Landing: cd apps/landing && vercel --prod" -ForegroundColor White
    Write-Host "  2. Backend: Configurar proyecto en Railway Dashboard" -ForegroundColor White
    Write-Host "  3. Seguir: docs/DEPLOYMENT_GUIDE.md" -ForegroundColor White
} elseif ($errors.Count -eq 0) {
    Write-Host "⚠️  LISTO CON WARNINGS" -ForegroundColor Yellow
    Write-Host "Puedes proceder pero revisa los warnings arriba" -ForegroundColor Yellow
} else {
    Write-Host "❌ NO LISTO PARA DEPLOYMENT" -ForegroundColor Red
    Write-Host "Corrige los errores críticos antes de desplegar" -ForegroundColor Red
}

Write-Host ""
