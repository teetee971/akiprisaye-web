#!/usr/bin/env pwsh
# A KI PRI SA YE - Diagnostic simple

Write-Host "=== DIAGNOSTIC A KI PRI SA YE ===" -ForegroundColor Cyan
Write-Host ""

# Test serveur Vite
Write-Host "Test du serveur Vite..." -ForegroundColor Yellow
try {
    $viteTest = Test-NetConnection -ComputerName "localhost" -Port 5173 -WarningAction SilentlyContinue -ErrorAction SilentlyContinue
    if ($viteTest.TcpTestSucceeded) {
        Write-Host "OK - Serveur Vite actif sur port 5173" -ForegroundColor Green
    } else {
        Write-Host "PROBLEME - Serveur Vite non actif" -ForegroundColor Red
        Write-Host "Solution: npm run dev" -ForegroundColor Yellow
    }
} catch {
    Write-Host "ERREUR - Test serveur impossible" -ForegroundColor Red
}

Write-Host ""

# Test des fichiers
Write-Host "Test des fichiers critiques..." -ForegroundColor Yellow
$files = @("package.json", "vite.config.js", "index.html")
foreach ($file in $files) {
    if (Test-Path $file) {
        Write-Host "OK - $file" -ForegroundColor Green
    } else {
        Write-Host "MANQUE - $file" -ForegroundColor Red
    }
}

Write-Host ""

# Test des assets
Write-Host "Test des assets..." -ForegroundColor Yellow
if (Test-Path "assets") {
    $webp = (Get-ChildItem "assets" -Filter "*.webp" | Measure-Object).Count
    $png = (Get-ChildItem "assets" -Filter "*.png" | Measure-Object).Count
    Write-Host "OK - Assets: $webp WebP, $png PNG" -ForegroundColor Green
} else {
    Write-Host "PROBLEME - Dossier assets manquant" -ForegroundColor Red
}

Write-Host ""

# Test des URLs
Write-Host "Test des URLs..." -ForegroundColor Yellow
$urls = @(
    "http://localhost:5173/",
    "http://localhost:5173/index_final.html", 
    "http://localhost:5173/diagnostic.html"
)

foreach ($url in $urls) {
    try {
        $response = Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 3 -ErrorAction SilentlyContinue
        if ($response.StatusCode -eq 200) {
            Write-Host "OK - $url" -ForegroundColor Green
        } else {
            Write-Host "PROBLEME - $url (Status: $($response.StatusCode))" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "ECHEC - $url" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "=== SOLUTIONS RECOMMANDEES ===" -ForegroundColor Cyan
Write-Host "1. Si serveur arrete: npm run dev" -ForegroundColor White
Write-Host "2. Tester version optimisee: http://localhost:5173/index_final.html" -ForegroundColor White  
Write-Host "3. Diagnostic detaille: http://localhost:5173/diagnostic.html" -ForegroundColor White
Write-Host "4. Si problemes persistent: Synchroniser avec GitHub" -ForegroundColor White
Write-Host ""
