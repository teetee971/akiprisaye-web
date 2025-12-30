#!/usr/bin/env pwsh

# Script de diagnostic pour A KI PRI SA YÉ
Write-Host "🔍 Diagnostic A KI PRI SA YÉ" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan
Write-Host ""

# Vérification de la structure des dossiers
Write-Host "📁 Vérification de la structure..." -ForegroundColor Yellow

$requiredDirs = @("assets", "public")
$requiredFiles = @("index.html", "manifest.json", "service-worker.js")

foreach ($dir in $requiredDirs) {
    if (Test-Path $dir) {
        Write-Host "✅ $dir" -ForegroundColor Green
    } else {
        Write-Host "❌ $dir manquant" -ForegroundColor Red
    }
}

foreach ($file in $requiredFiles) {
    if (Test-Path $file) {
        Write-Host "✅ $file" -ForegroundColor Green
    } else {
        Write-Host "❌ $file manquant" -ForegroundColor Red
    }
}

Write-Host ""

# Vérification des images critiques
Write-Host "🖼️  Vérification des images critiques..." -ForegroundColor Yellow

$criticalImages = @(
    "assets/84ba022c-9450-4e4f-841b-64d5363aaae1_lg.webp",
    "assets/b3ced496-7272-4600-b46e-c14cf625667e_lg.webp", 
    "assets/0d3bd9ac-734a-4f7d-b671-6dc715ae9e94_lg.webp",
    "assets/icon_192.png",
    "assets/icon_256.png",
    "assets/icon_512.png"
)

$imageIssues = 0
foreach ($img in $criticalImages) {
    if (Test-Path $img) {
        $size = (Get-Item $img).Length
        if ($size -gt 0) {
            Write-Host "✅ $img ($([math]::Round($size/1KB, 2)) KB)" -ForegroundColor Green
        } else {
            Write-Host "⚠️  $img (fichier vide)" -ForegroundColor Yellow
            $imageIssues++
        }
    } else {
        Write-Host "❌ $img manquant" -ForegroundColor Red
        $imageIssues++
    }
}

Write-Host ""

# Vérification des serveurs
Write-Host "🌐 Vérification des serveurs..." -ForegroundColor Yellow

$ports = @(5173, 8001)
foreach ($port in $ports) {
    try {
        $connection = Test-NetConnection -ComputerName "localhost" -Port $port -WarningAction SilentlyContinue -ErrorAction SilentlyContinue
        if ($connection.TcpTestSucceeded) {
            Write-Host "✅ Serveur sur port $port" -ForegroundColor Green
        } else {
            Write-Host "❌ Aucun serveur sur port $port" -ForegroundColor Red
        }
    } catch {
        Write-Host "❌ Erreur lors du test du port $port" -ForegroundColor Red
    }
}

Write-Host ""

# Résumé
Write-Host "📊 RÉSUMÉ" -ForegroundColor Cyan
Write-Host "==========" -ForegroundColor Cyan

if ($imageIssues -eq 0) {
    Write-Host "✅ Toutes les images critiques sont présentes" -ForegroundColor Green
} else {
    Write-Host "⚠️  $imageIssues probleme(s) d'images detecte(s)" -ForegroundColor Yellow
}

# Suggestions
Write-Host ""
Write-Host "💡 SUGGESTIONS DE RÉSOLUTION" -ForegroundColor Cyan
Write-Host "=============================" -ForegroundColor Cyan
Write-Host "1. Vérifiez les images dans le navigateur: http://localhost:5173/diagnostic.html" -ForegroundColor White
Write-Host "2. Version améliorée disponible: http://localhost:5173/index_improved.html" -ForegroundColor White
Write-Host "3. Pour relancer Vite: npm run dev" -ForegroundColor White
Write-Host "4. Pour les logs détaillés, ouvrez la console du navigateur (F12)" -ForegroundColor White

Write-Host ""
Write-Host "🔧 Diagnostic terminé!" -ForegroundColor Green
