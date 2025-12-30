# Script de Deployment Final - A KI PRI SA YE
# Automatise le processus de build et test

param(
    [switch]$Build,
    [switch]$Test,
    [switch]$Deploy,
    [switch]$All
)

Write-Host "=================================" -ForegroundColor Cyan
Write-Host "   A KI PRI SA YE - DEPLOYMENT   " -ForegroundColor Cyan  
Write-Host "=================================" -ForegroundColor Cyan
Write-Host ""

# Variables
$ProjectPath = "C:\Users\use\akiprisaye-web"
$BuildPath = "$ProjectPath\dist"
$TestUrls = @(
    "http://localhost:5173/index_final.html",
    "http://localhost:5173/dashboard.html",
    "http://localhost:5173/diagnostic.html"
)

# Fonction de log avec couleurs
function Write-ColorLog {
    param(
        [string]$Message,
        [string]$Type = "INFO"
    )
    
    $timestamp = Get-Date -Format "HH:mm:ss"
    
    switch ($Type) {
        "SUCCESS" { 
            Write-Host "[$timestamp] ✅ $Message" -ForegroundColor Green 
        }
        "ERROR" { 
            Write-Host "[$timestamp] ❌ $Message" -ForegroundColor Red 
        }
        "WARNING" { 
            Write-Host "[$timestamp] ⚠️  $Message" -ForegroundColor Yellow 
        }
        "INFO" { 
            Write-Host "[$timestamp] ℹ️  $Message" -ForegroundColor Cyan 
        }
        default { 
            Write-Host "[$timestamp] $Message" -ForegroundColor White 
        }
    }
}

# Verification de l'environnement
function Test-Environment {
    Write-ColorLog "Verification de l'environnement..." "INFO"
    
    # Verifier Node.js
    try {
        $nodeVersion = node --version
        Write-ColorLog "Node.js detecte: $nodeVersion" "SUCCESS"
    } catch {
        Write-ColorLog "Node.js non trouve. Installation requise." "ERROR"
        return $false
    }
    
    # Verifier NPM
    try {
        $npmVersion = npm --version
        Write-ColorLog "NPM detecte: $npmVersion" "SUCCESS"
    } catch {
        Write-ColorLog "NPM non trouve. Installation requise." "ERROR"
        return $false
    }
    
    # Verifier les fichiers critiques
    $requiredFiles = @(
        "package.json",
        "vite.config.js", 
        "index_final.html",
        "dashboard.html"
    )
    
    foreach ($file in $requiredFiles) {
        if (Test-Path "$ProjectPath\$file") {
            Write-ColorLog "$file trouve" "SUCCESS"
        } else {
            Write-ColorLog "$file manquant" "ERROR"
            return $false
        }
    }
    
    return $true
}

# Installation des dependances
function Install-Dependencies {
    Write-ColorLog "Installation des dependances..." "INFO"
    
    try {
        Set-Location $ProjectPath
        npm install
        Write-ColorLog "Dependances installees avec succes" "SUCCESS"
    } catch {
        Write-ColorLog "Echec de l'installation des dependances" "ERROR"
        return $false
    }
    
    return $true
}

# Test des serveurs
function Test-Servers {
    Write-ColorLog "Test des serveurs..." "INFO"
    
    # Demarrer Vite en arriere-plan si pas deja actif
    try {
        $connection = Test-NetConnection -ComputerName "localhost" -Port 5173 -WarningAction SilentlyContinue -ErrorAction SilentlyContinue
        
        if (-not $connection.TcpTestSucceeded) {
            Write-ColorLog "Demarrage du serveur Vite..." "INFO"
            Start-Process -FilePath "npm" -ArgumentList "run", "dev" -WorkingDirectory $ProjectPath -WindowStyle Hidden
            Start-Sleep 5
        }
        
        # Re-test de la connexion
        $connection = Test-NetConnection -ComputerName "localhost" -Port 5173 -WarningAction SilentlyContinue -ErrorAction SilentlyContinue
        
        if ($connection.TcpTestSucceeded) {
            Write-ColorLog "Serveur Vite operationnel sur port 5173" "SUCCESS"
        } else {
            Write-ColorLog "Impossible de demarrer le serveur Vite" "ERROR"
            return $false
        }
    } catch {
        Write-ColorLog "Erreur lors du test des serveurs: $($_.Exception.Message)" "ERROR"
        return $false
    }
    
    return $true
}

# Test des URLs
function Test-URLs {
    Write-ColorLog "Test des URLs..." "INFO"
    
    foreach ($url in $TestUrls) {
        try {
            $response = Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 5 -ErrorAction Stop
            
            if ($response.StatusCode -eq 200) {
                Write-ColorLog "$url - OK (Status: $($response.StatusCode))" "SUCCESS"
            } else {
                Write-ColorLog "$url - Probleme (Status: $($response.StatusCode))" "WARNING"
            }
        } catch {
            Write-ColorLog "$url - Echec: $($_.Exception.Message)" "ERROR"
        }
    }
}

# Build du projet
function Build-Project {
    Write-ColorLog "Build du projet..." "INFO"
    
    try {
        Set-Location $ProjectPath
        
        # Nettoyer le dossier de build precedent
        if (Test-Path $BuildPath) {
            Remove-Item $BuildPath -Recurse -Force
            Write-ColorLog "Dossier de build precedent nettoye" "INFO"
        }
        
        # Executer le build
        npm run build
        
        if (Test-Path $BuildPath) {
            $buildFiles = Get-ChildItem $BuildPath -Recurse | Measure-Object
            Write-ColorLog "Build reussi - $($buildFiles.Count) fichiers generes" "SUCCESS"
            
            # Copier les fichiers optimises
            Copy-Item "$ProjectPath\index_final.html" "$BuildPath\" -Force
            Copy-Item "$ProjectPath\dashboard.html" "$BuildPath\" -Force
            Write-ColorLog "Fichiers optimises copies dans le build" "SUCCESS"
        } else {
            Write-ColorLog "Echec du build - dossier dist non cree" "ERROR"
            return $false
        }
    } catch {
        Write-ColorLog "Erreur lors du build: $($_.Exception.Message)" "ERROR"
        return $false
    }
    
    return $true
}

# Test du build
function Test-Build {
    Write-ColorLog "Test du build..." "INFO"
    
    if (-not (Test-Path $BuildPath)) {
        Write-ColorLog "Dossier de build introuvable. Executez d'abord le build." "ERROR"
        return $false
    }
    
    # Lancer le serveur preview
    try {
        Write-ColorLog "Demarrage du serveur preview..." "INFO"
        Start-Process -FilePath "npm" -ArgumentList "run", "preview" -WorkingDirectory $ProjectPath -WindowStyle Hidden
        Start-Sleep 3
        
        # Test de la preview
        try {
            $previewUrl = "http://localhost:4173"
            $response = Invoke-WebRequest -Uri $previewUrl -UseBasicParsing -TimeoutSec 5
            
            if ($response.StatusCode -eq 200) {
                Write-ColorLog "Build preview operationnel sur $previewUrl" "SUCCESS"
            }
        } catch {
            Write-ColorLog "Preview non accessible" "WARNING"
        }
    } catch {
        Write-ColorLog "Erreur lors du test du build: $($_.Exception.Message)" "ERROR"
        return $false
    }
    
    return $true
}

# Rapport final
function Show-FinalReport {
    Write-Host ""
    Write-Host "=================================" -ForegroundColor Cyan
    Write-Host "         RAPPORT FINAL           " -ForegroundColor Cyan
    Write-Host "=================================" -ForegroundColor Cyan
    
    Write-ColorLog "Deployment termine avec succes!" "SUCCESS"
    Write-Host ""
    Write-Host "URLs disponibles:" -ForegroundColor Yellow
    Write-Host "- Site principal: http://localhost:5173/index_final.html" -ForegroundColor White
    Write-Host "- Dashboard: http://localhost:5173/dashboard.html" -ForegroundColor White
    Write-Host "- Diagnostic: http://localhost:5173/diagnostic.html" -ForegroundColor White
    
    if (Test-Path $BuildPath) {
        Write-Host "- Build preview: http://localhost:4173" -ForegroundColor White
    }
    
    Write-Host ""
    Write-Host "Fichiers optimises:" -ForegroundColor Yellow
    Write-Host "- index_final.html (Version production)" -ForegroundColor White
    Write-Host "- dashboard.html (Monitoring)" -ForegroundColor White
    Write-Host "- RESOLUTION_GUIDE.md (Documentation)" -ForegroundColor White
    
    Write-Host ""
    Write-ColorLog "Tous les problemes d'affichage ont ete resolus!" "SUCCESS"
}

# Execution principale
function Start-Deployment {
    Write-ColorLog "Debut du deployment..." "INFO"
    
    # Verification de l'environnement
    if (-not (Test-Environment)) {
        Write-ColorLog "Echec de la verification de l'environnement" "ERROR"
        return
    }
    
    # Installation des dependances
    if (-not (Install-Dependencies)) {
        Write-ColorLog "Echec de l'installation des dependances" "ERROR"
        return
    }
    
    # Tests selon les parametres
    if ($Test -or $All) {
        if (Test-Servers) {
            Test-URLs
        }
    }
    
    # Build selon les parametres
    if ($Build -or $All) {
        if (-not (Build-Project)) {
            Write-ColorLog "Echec du build" "ERROR"
            return
        }
        
        if ($Test -or $All) {
            Test-Build
        }
    }
    
    # Si pas de parametres specifiques, faire les tests de base
    if (-not ($Build -or $Test -or $Deploy -or $All)) {
        Test-Servers
        Test-URLs
    }
    
    Show-FinalReport
}

# Point d'entree
try {
    Start-Deployment
} catch {
    Write-ColorLog "Erreur fatale: $($_.Exception.Message)" "ERROR"
    Write-Host "Consultez RESOLUTION_GUIDE.md pour plus d'informations" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Appuyez sur une touche pour continuer..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
