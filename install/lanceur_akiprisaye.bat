
@echo off
setlocal ENABLEEXTENSIONS

REM Titre de la fenêtre
title Lancement de A Ki Pri Sa Yé

REM Chemin du fichier à vérifier
set EXE_PATH="C:\A Ki Pri Sa Yé\akiprisaye.exe"

REM Vérifie si le fichier existe
if not exist %EXE_PATH% (
    echo [❌] Le fichier akiprisaye.exe est introuvable dans le dossier.
    echo Vérifiez que le programme a bien été installé.
    pause
    exit /b
)

REM Vérifie que le fichier est bien un exécutable valide (simple test de signature binaire PE)
set /p HEADER=<%EXE_PATH%
echo %HEADER% | findstr /C:"MZ" >nul
if errorlevel 1 (
    echo [⚠️] Le fichier existe, mais il ne semble pas être un exécutable valide.
    echo Merci de remplacer akiprisaye.exe par la version PC officielle de l'application.
    pause
    exit /b
)

REM Lancer l'exécutable
echo [✅] Lancement de A Ki Pri Sa Yé...
start "" %EXE_PATH%
exit
