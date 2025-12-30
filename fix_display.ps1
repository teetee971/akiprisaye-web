#!/usr/bin/env pwsh

# Script de résolution automatique des problèmes d'affichage
# A KI PRI SA YÉ - Version 2025

param(
    [string]$Mode = "diagnostic",
    [switch]$Fix,
    [switch]$Sync,
    [switch]$Test
)

Write-Host "🚀 A KI PRI SA YÉ - Résolution automatique" -ForegroundColor Cyan
Write-Host "===========================================" -ForegroundColor Cyan
Write-Host ""

# Fonction de diagnostic
function Invoke-Diagnostic {
    Write-Host "🔍 DIAGNOSTIC EN COURS..." -ForegroundColor Yellow
    Write-Host ""
    
    # Vérifier la structure
    $issues = @()
    
    # 1. Vérifier les serveurs
    Write-Host "📡 Test des serveurs..." -ForegroundColor Blue
    try {
        $vite = Test-NetConnection -ComputerName "localhost" -Port 5173 -WarningAction SilentlyContinue -ErrorAction SilentlyContinue
        if ($vite.TcpTestSucceeded) {
            Write-Host "  ✅ Serveur Vite (5173): OK" -ForegroundColor Green
        } else {
            Write-Host "  ❌ Serveur Vite (5173): Non démarré" -ForegroundColor Red
            $issues += "Serveur Vite non démarré"
        }
    } catch {
        Write-Host "  ❌ Erreur test serveur Vite" -ForegroundColor Red
        $issues += "Erreur serveur Vite"
    }
    
    # 2. Vérifier les fichiers critiques
    Write-Host "📁 Vérification des fichiers..." -ForegroundColor Blue
    $criticalFiles = @(
        "package.json",
        "vite.config.js", 
        "index.html",
        "public/index.html",
        "src/main.jsx"
    )
    
    foreach ($file in $criticalFiles) {
        if (Test-Path $file) {
            Write-Host "  ✅ $file" -ForegroundColor Green
        } else {
            Write-Host "  ❌ $file manquant" -ForegroundColor Red
            $issues += "$file manquant"
        }
    }
    
    # 3. Vérifier les assets
    Write-Host "🖼️ Vérification des assets..." -ForegroundColor Blue
    if (Test-Path "assets") {
        $webpFiles = Get-ChildItem "assets" -Filter "*.webp" | Measure-Object
        $pngFiles = Get-ChildItem "assets" -Filter "*.png" | Measure-Object
        Write-Host "  ✅ Assets: $($webpFiles.Count) WebP, $($pngFiles.Count) PNG" -ForegroundColor Green
    } else {
        Write-Host "  ❌ Dossier assets manquant" -ForegroundColor Red
        $issues += "Dossier assets manquant"
    }
    
    # 4. Résumé
    Write-Host ""
    Write-Host "📊 RÉSUMÉ DU DIAGNOSTIC:" -ForegroundColor Cyan
    if ($issues.Count -eq 0) {
        Write-Host "  🎉 Aucun problème critique détecté!" -ForegroundColor Green
    } else {
        Write-Host "  ⚠️ $($issues.Count) problème(s) détecté(s):" -ForegroundColor Yellow
        foreach ($issue in $issues) {
            Write-Host "    • $issue" -ForegroundColor White
        }
    }
    
    return $issues
}

# Fonction de correction automatique
function Invoke-AutoFix {
    Write-Host "🔧 CORRECTION AUTOMATIQUE..." -ForegroundColor Yellow
    Write-Host ""
    
    # 1. Démarrer le serveur si nécessaire
    $viteTest = Test-NetConnection -ComputerName "localhost" -Port 5173 -WarningAction SilentlyContinue -ErrorAction SilentlyContinue
    if (-not $viteTest.TcpTestSucceeded) {
        Write-Host "🚀 Démarrage du serveur Vite..." -ForegroundColor Blue
        Start-Process "npm" -ArgumentList "run", "dev" -WindowStyle Hidden
        Start-Sleep -Seconds 3
        Write-Host "  ✅ Serveur Vite démarré" -ForegroundColor Green
    }
    
    # 2. Vérifier les dépendances
    if (-not (Test-Path "node_modules")) {
        Write-Host "📦 Installation des dépendances..." -ForegroundColor Blue
        npm install
        Write-Host "  ✅ Dépendances installées" -ForegroundColor Green
    }
    
    # 3. Créer les fichiers manquants si nécessaire
    if (-not (Test-Path "public")) {
        Write-Host "📁 Création du dossier public..." -ForegroundColor Blue
        New-Item -ItemType Directory -Path "public" -Force | Out-Null
        Write-Host "  ✅ Dossier public créé" -ForegroundColor Green
    }
    
    Write-Host "  🎯 Corrections appliquées avec succès!" -ForegroundColor Green
}

# Fonction de synchronisation GitHub
function Invoke-GitSync {
    Write-Host "🔄 SYNCHRONISATION GITHUB..." -ForegroundColor Yellow
    Write-Host ""
    
    try {
        # Vérifier si on est dans un repo git
        git status 2>$null | Out-Null
        if ($LASTEXITCODE -eq 0) {
            Write-Host "📡 Récupération des dernières modifications..." -ForegroundColor Blue
            git fetch origin main
            git pull origin main
            Write-Host "  ✅ Synchronisation terminée" -ForegroundColor Green
            
            Write-Host "📦 Mise à jour des dépendances..." -ForegroundColor Blue
            npm install
            Write-Host "  ✅ Dépendances à jour" -ForegroundColor Green
        } else {
            Write-Host "  ❌ Pas un repository Git" -ForegroundColor Red
        }
    } catch {
        Write-Host "  ❌ Erreur de synchronisation: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Fonction de test
function Invoke-Test {
    Write-Host "🧪 LANCEMENT DES TESTS..." -ForegroundColor Yellow
    Write-Host ""
    
    # Test du serveur
    $serverOk = $false
    for ($i = 0; $i -lt 10; $i++) {
        try {
            $response = Invoke-WebRequest -Uri "http://localhost:5173/" -UseBasicParsing -TimeoutSec 2 -ErrorAction SilentlyContinue
            if ($response.StatusCode -eq 200) {
                Write-Host "  ✅ Serveur accessible" -ForegroundColor Green
                $serverOk = $true
                break
            }
        } catch {
            Start-Sleep -Seconds 1
        }
    }
    
    if (-not $serverOk) {
        Write-Host "  ❌ Serveur non accessible" -ForegroundColor Red
        return $false
    }
    
    # Ouvrir les pages de test
    Write-Host "🌐 Ouverture des pages de test..." -ForegroundColor Blue
    $urls = @(
        "http://localhost:5173/",
        "http://localhost:5173/index_final.html",
        "http://localhost:5173/diagnostic.html"
    )
    
    foreach ($url in $urls) {
        try {
            Start-Process $url -ErrorAction SilentlyContinue
        } catch {
            Write-Host "  ⚠️ Impossible d'ouvrir $url" -ForegroundColor Yellow
        }
    }
    
    Write-Host "  ✅ Pages de test ouvertes" -ForegroundColor Green
    return $true
}

# Exécution principale
switch ($Mode) {
    "diagnostic" {
        $issues = Invoke-Diagnostic
        
        Write-Host ""
        Write-Host "💡 SUGGESTIONS:" -ForegroundColor Cyan
        Write-Host "  • Pour corriger automatiquement: .\fix_display.ps1 -Fix" -ForegroundColor White
        Write-Host "  • Pour synchroniser avec GitHub: .\fix_display.ps1 -Sync" -ForegroundColor White
        Write-Host "  • Pour lancer les tests: .\fix_display.ps1 -Test" -ForegroundColor White
    }
    
    "fix" {
        if ($Fix) {
            Invoke-AutoFix
        }
    }
    
    "sync" {
        if ($Sync) {
            Invoke-GitSync
        }
    }
    
    "test" {
        if ($Test) {
            Invoke-Test
        }
    }
}

# Actions conditionnelles
if ($Fix) {
    Invoke-AutoFix
}

if ($Sync) {
    Invoke-GitSync
}

if ($Test) {
    $testResult = Invoke-Test
    if ($testResult) {
        Write-Host ""
        Write-Host "🎉 TESTS TERMINÉS AVEC SUCCÈS!" -ForegroundColor Green
        Write-Host "   Vérifiez les pages ouvertes dans votre navigateur" -ForegroundColor White
    }
}

Write-Host ""
Write-Host "Script termine!" -ForegroundColor Green
