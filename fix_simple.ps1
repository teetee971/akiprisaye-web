<<<<<<< HEAD
# Script de correction automatique de la structure de déploiement
# A KI PRI SA YÉ - Résolution définitive

param(
    [switch]$DryRun,
    [switch]$Execute,
    [switch]$Validate
)

Write-Host "CORRECTION STRUCTURE DÉPLOIEMENT" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

function Test-Prerequisites {
    Write-Host "Vérification des prérequis..." -ForegroundColor Yellow
    
    $issues = @()
    
    # Vérifier les fichiers critiques
    if (-not (Test-Path "index.html")) {
        $issues += "index.html manquant"
    }
    
    if (-not (Test-Path "public/index.html")) {
        $issues += "public/index.html manquant"
    }
    
    if (-not (Test-Path "package.json")) {
        $issues += "package.json manquant"
    }
    
    # Vérifier Git
    try {
        git status 2>$null | Out-Null
        if ($LASTEXITCODE -ne 0) {
            $issues += "Pas un repository Git"
        }
    } catch {
        $issues += "Git non disponible"
    }
    
    if ($issues.Count -gt 0) {
        Write-Host "Prérequis manquants:" -ForegroundColor Red
        foreach ($issue in $issues) {
            Write-Host "  - $issue" -ForegroundColor White
        }
        return $false
    }
    
    Write-Host "Tous les prérequis sont OK" -ForegroundColor Green
    return $true
}

function Show-CurrentStructure {
    Write-Host "Structure actuelle:" -ForegroundColor Blue
    
    # Analyser index.html racine
    if (Test-Path "index.html") {
        $content = Get-Content "index.html" -Raw
        if ($content -match '<title>(.*?)</title>') {
            $title = $matches[1]
            Write-Host "  index.html (racine): $title" -ForegroundColor White
        }
    }
    
    # Analyser public/index.html
    if (Test-Path "public/index.html") {
        $content = Get-Content "public/index.html" -Raw
        if ($content -match '<title>(.*?)</title>') {
            $title = $matches[1]
            Write-Host "  public/index.html: $title" -ForegroundColor White
        }
    }
    
    Write-Host ""
}

function Invoke-StructureFix {
    param([bool]$DryRun = $false)
    
    Write-Host "Application de la correction..." -ForegroundColor Yellow
    
    $steps = @(
        "Sauvegarder index.html actuel → actualites.html",
        "Copier public/index.html → index.html", 
        "Mettre à jour les liens de navigation",
        "Créer un commit Git"
    )
    
    foreach ($step in $steps) {
        Write-Host "  - $step" -ForegroundColor Gray
    }
    
    Write-Host ""
    
    if ($DryRun) {
        Write-Host "MODE DRY-RUN - Aucune modification appliquée" -ForegroundColor Yellow
        return
    }
    
    try {
        # Étape 1: Sauvegarder index.html actuel
        Write-Host "1. Sauvegarde de index.html → actualites.html" -ForegroundColor Blue
        if (Test-Path "actualites.html") {
            Write-Host "   actualites.html existe déjà, création d'une sauvegarde" -ForegroundColor Yellow
            Copy-Item "actualites.html" "actualites.html.bak" -Force
        }
        Move-Item "index.html" "actualites.html" -Force
        Write-Host "   Terminé" -ForegroundColor Green
        
        # Étape 2: Copier l'app React
        Write-Host "2. Copie de public/index.html → index.html" -ForegroundColor Blue  
        Copy-Item "public/index.html" "index.html" -Force
        Write-Host "   Terminé" -ForegroundColor Green
        
        # Étape 3: Mettre à jour les liens (optionnel pour l'instant)
        Write-Host "3. Mise à jour des liens de navigation" -ForegroundColor Blue
        Write-Host "   À faire manuellement si nécessaire" -ForegroundColor Yellow
        
        # Étape 4: Git commit
        Write-Host "4. Création du commit Git" -ForegroundColor Blue
        git add .
        git status --porcelain
        
        $commitMsg = "fix: Deploy React app as main page, move news to actualites.html"
        git commit -m $commitMsg
        Write-Host "   Commit créé: $commitMsg" -ForegroundColor Green
        
        Write-Host ""
        Write-Host "CORRECTION APPLIQUÉE AVEC SUCCÈS!" -ForegroundColor Green
        
    } catch {
        Write-Host "Erreur lors de la correction: $($_.Exception.Message)" -ForegroundColor Red
        
        # Tentative de rollback
        Write-Host "Tentative de rollback..." -ForegroundColor Yellow
        if (Test-Path "actualites.html") {
            Move-Item "actualites.html" "index.html" -Force -ErrorAction SilentlyContinue
        }
    }
}

function Test-PostCorrection {
    Write-Host "Validation post-correction..." -ForegroundColor Yellow
    
    $success = $true
    
    # Vérifier que index.html contient l'app React
    if (Test-Path "index.html") {
        $content = Get-Content "index.html" -Raw
        if ($content -match 'id="root"' -and $content -match 'src="/src/main.jsx"') {
            Write-Host "index.html contient l'app React" -ForegroundColor Green
        } else {
            Write-Host "index.html ne contient pas l'app React" -ForegroundColor Red
            $success = $false
        }
    }
    
    # Vérifier actualites.html
    if (Test-Path "actualites.html") {
        $content = Get-Content "actualites.html" -Raw
        if ($content -match 'Actualités prix.*consommation') {
            Write-Host "actualites.html contient les actualités" -ForegroundColor Green
        } else {
            Write-Host "actualites.html pourrait ne pas contenir les actualités" -ForegroundColor Yellow
        }
    }
    
    return $success
}

function Show-NextSteps {
    Write-Host ""
    Write-Host "PROCHAINES ÉTAPES:" -ForegroundColor Cyan
    Write-Host "==================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "1. Pousser les modifications:" -ForegroundColor Blue
    Write-Host "   git push origin main" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "2. Attendre le déploiement Cloudflare (5-10 min)" -ForegroundColor Blue
    Write-Host ""
    Write-Host "3. Vérifier le résultat:" -ForegroundColor Blue
    Write-Host "   https://akiprisaye-web.pages.dev/" -ForegroundColor Cyan
    Write-Host "   https://akiprisaye-web.pages.dev/actualites.html" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "4. Tester localement:" -ForegroundColor Blue
    Write-Host "   npm run dev" -ForegroundColor Yellow
    Write-Host "   npm run build" -ForegroundColor Yellow
    Write-Host ""
}

# Exécution principale
if (-not (Test-Prerequisites)) {
    exit 1
}

Show-CurrentStructure

if ($DryRun -or (-not $Execute -and -not $Validate)) {
    Write-Host "OPTIONS DISPONIBLES:" -ForegroundColor Cyan
    Write-Host "  -DryRun    : Voir ce qui serait fait sans appliquer" -ForegroundColor White
    Write-Host "  -Execute   : Appliquer la correction" -ForegroundColor White  
    Write-Host "  -Validate  : Valider une correction existante" -ForegroundColor White
    Write-Host ""
    Write-Host "Exemple: .\fix_simple.ps1 -Execute" -ForegroundColor Yellow
    
    if (-not $DryRun) {
        exit 0
    }
}

if ($DryRun -or $Execute) {
    Invoke-StructureFix -DryRun:$DryRun
}

if ($Validate -or $Execute) {
    if (Test-PostCorrection) {
        Write-Host "Validation réussie!" -ForegroundColor Green
        Show-NextSteps
    } else {
        Write-Host "Problèmes détectés lors de la validation" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "Script terminé!" -ForegroundColor Green
=======
#!/usr/bin/env pwsh
# Script de correction simplifie - A KI PRI SA YE

Write-Host "=== CORRECTION DEPLOIEMENT A KI PRI SA YE ===" -ForegroundColor Cyan
Write-Host ""

Write-Host "PROBLEME IDENTIFIE:" -ForegroundColor Red
Write-Host "- L'index.html racine (page actualites) est deploye au lieu de l'app React" -ForegroundColor Yellow
Write-Host "- L'app React moderne est dans public/index.html" -ForegroundColor Yellow  
Write-Host "- Cloudflare Pages sert le mauvais fichier" -ForegroundColor Yellow
Write-Host ""

Write-Host "ETAPES DE CORRECTION:" -ForegroundColor Green
Write-Host "1. Sauvegarder l'index.html actuel vers actualites.html" -ForegroundColor White
Write-Host "2. Copier l'app React (public/index.html) vers la racine" -ForegroundColor White
Write-Host "3. Mettre a jour la navigation" -ForegroundColor White
Write-Host ""

Write-Host "EXECUTION EN COURS..." -ForegroundColor Yellow

# Etape 1: Sauvegarder index.html actuel
if (Test-Path "index.html") {
    Write-Host "Sauvegarde: index.html -> actualites.html" -ForegroundColor Blue
    Copy-Item "index.html" "actualites.html" -Force
    Write-Host "OK - Sauvegarde terminee" -ForegroundColor Green
} else {
    Write-Host "ERREUR - index.html non trouve" -ForegroundColor Red
}

# Etape 2: Copier l'app React
if (Test-Path "public/index.html") {
    Write-Host "Copie: public/index.html -> index.html" -ForegroundColor Blue
    Copy-Item "public/index.html" "index.html" -Force
    Write-Host "OK - App React copiee" -ForegroundColor Green
} else {
    Write-Host "ERREUR - public/index.html non trouve" -ForegroundColor Red
}

Write-Host ""
Write-Host "VERIFICATION DES FICHIERS:" -ForegroundColor Cyan

# Verification
if (Test-Path "actualites.html") {
    $size1 = (Get-Item "actualites.html").Length
    Write-Host "OK - actualites.html ($size1 octets)" -ForegroundColor Green
} else {
    Write-Host "MANQUE - actualites.html" -ForegroundColor Red
}

if (Test-Path "index.html") {
    $content = Get-Content "index.html" -Raw
    if ($content -match "div id=.root") {
        Write-Host "OK - index.html contient l'app React" -ForegroundColor Green
    } else {
        Write-Host "PROBLEME - index.html ne contient pas l'app React" -ForegroundColor Red
    }
} else {
    Write-Host "MANQUE - index.html" -ForegroundColor Red
}

Write-Host ""
Write-Host "PROCHAINES ETAPES:" -ForegroundColor Cyan
Write-Host "1. Commit et push vers GitHub:" -ForegroundColor White
Write-Host "   git add ." -ForegroundColor Gray
Write-Host '   git commit -m "Fix: Deploy React app instead of actualites page"' -ForegroundColor Gray
Write-Host "   git push origin main" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Attendre le redeploiement Cloudflare (5-10 min)" -ForegroundColor White
Write-Host ""
Write-Host "3. Verifier: https://akiprisaye-web.pages.dev/" -ForegroundColor White
Write-Host "   Doit afficher l'app React moderne avec carrousel" -ForegroundColor White
Write-Host ""

Write-Host "=== CORRECTION TERMINEE ===" -ForegroundColor Green
>>>>>>> f42714f9887abc941c0fefcc2d18f6eac9694951
