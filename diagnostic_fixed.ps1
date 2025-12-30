#!/usr/bin/env pwsh

# Script de diagnostic pour A KI PRI SA YE - Version corrigee
Write-Host "Diagnostic A KI PRI SA YE" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan
Write-Host ""

# Verification de la structure des dossiers
Write-Host "Verification de la structure..." -ForegroundColor Yellow

$requiredDirs = @("assets", "public")
$requiredFiles = @("index.html", "manifest.json", "service-worker.js")

foreach ($dir in $requiredDirs) {
    if (Test-Path $dir) {
        Write-Host "OK $dir" -ForegroundColor Green
    } else {
        Write-Host "MANQUE $dir" -ForegroundColor Red
    }
}

foreach ($file in $requiredFiles) {
    if (Test-Path $file) {
        Write-Host "OK $file" -ForegroundColor Green
    } else {
        Write-Host "MANQUE $file" -ForegroundColor Red
    }
}

Write-Host ""

# Verification des images critiques
Write-Host "Verification des images critiques..." -ForegroundColor Yellow

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
            Write-Host "OK $img ($([math]::Round($size/1KB, 2)) KB)" -ForegroundColor Green
        } else {
            Write-Host "VIDE $img" -ForegroundColor Yellow
            $imageIssues++
        }
    } else {
        Write-Host "MANQUE $img" -ForegroundColor Red
        $imageIssues++
    }
}

Write-Host ""

# Verification des serveurs
Write-Host "Verification des serveurs..." -ForegroundColor Yellow

$ports = @(5173, 8001)
$serverStatus = @{}

foreach ($port in $ports) {
    try {
        $connection = Test-NetConnection -ComputerName "localhost" -Port $port -WarningAction SilentlyContinue -ErrorAction SilentlyContinue
        if ($connection.TcpTestSucceeded) {
            Write-Host "OK Serveur sur port $port" -ForegroundColor Green
            $serverStatus[$port] = "Running"
        } else {
            Write-Host "ECHEC Aucun serveur sur port $port" -ForegroundColor Red
            $serverStatus[$port] = "Stopped"
        }
    } catch {
        Write-Host "ERREUR Test du port $port" -ForegroundColor Red
        $serverStatus[$port] = "Error"
    }
}

Write-Host ""

# Resume
Write-Host "RESUME" -ForegroundColor Cyan
Write-Host "==========" -ForegroundColor Cyan

if ($imageIssues -eq 0) {
    Write-Host "OK Toutes les images critiques sont presentes" -ForegroundColor Green
} else {
    Write-Host "PROBLEME $imageIssues image(s) avec des problemes" -ForegroundColor Yellow
}

# Verification detaillee des URLs
Write-Host ""
Write-Host "TEST DES URLS" -ForegroundColor Cyan
Write-Host "=============" -ForegroundColor Cyan

$testUrls = @(
    "http://localhost:5173/",
    "http://localhost:5173/index.html",
    "http://localhost:5173/index_improved.html",
    "http://localhost:5173/diagnostic.html",
    "http://localhost:8001/"
)

foreach ($url in $testUrls) {
    try {
        $response = Invoke-WebRequest -Uri $url -TimeoutSec 5 -UseBasicParsing -ErrorAction SilentlyContinue
        if ($response.StatusCode -eq 200) {
            Write-Host "OK $url (Status: $($response.StatusCode))" -ForegroundColor Green
        } else {
            Write-Host "PROBLEME $url (Status: $($response.StatusCode))" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "ECHEC $url - $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Suggestions
Write-Host ""
Write-Host "SUGGESTIONS DE RESOLUTION" -ForegroundColor Cyan
Write-Host "=============================" -ForegroundColor Cyan
Write-Host "1. Verifiez les images dans le navigateur: http://localhost:5173/diagnostic.html" -ForegroundColor White
Write-Host "2. Version amelioree disponible: http://localhost:5173/index_improved.html" -ForegroundColor White
Write-Host "3. Pour relancer Vite: npm run dev" -ForegroundColor White
Write-Host "4. Pour les logs detailles, ouvrez la console du navigateur (F12)" -ForegroundColor White

Write-Host ""
Write-Host "Diagnostic termine!" -ForegroundColor Green
