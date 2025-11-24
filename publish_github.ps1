# Script de publication automatique de l'APK sur GitHub pour ŒufMaster Pro
# Ce script automatise la mise à jour et la publication de votre APK sur GitHub

Write-Host "🚀 Publication de l'APK ŒufMaster Pro sur GitHub" -ForegroundColor Cyan
Write-Host "==============================================" -ForegroundColor Cyan

# Vérifier que nous sommes dans le bon dossier
if (!(Test-Path "package.json")) {
    Write-Host "❌ Erreur : Ce script doit être exécuté depuis le dossier racine du projet" -ForegroundColor Red
    exit 1
}

# Étape 1 : Construction de l'application web
Write-Host "📦 Étape 1 : Construction de l'application web..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erreur lors de la construction web" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Application web construite avec succès" -ForegroundColor Green

# Étape 2 : Synchronisation avec Capacitor
Write-Host "📱 Étape 2 : Synchronisation avec Capacitor..." -ForegroundColor Yellow
npx cap sync android
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erreur lors de la synchronisation Capacitor" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Synchronisation Capacitor réussie" -ForegroundColor Green

# Étape 3 : Construction de l'APK
Write-Host "🏗️ Étape 3 : Construction de l'APK..." -ForegroundColor Yellow
Set-Location android
.\gradlew assembleDebug --no-daemon
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erreur lors de la construction de l'APK" -ForegroundColor Red
    exit 1
}
Write-Host "✅ APK construite avec succès" -ForegroundColor Green

# Étape 4 : Préparation pour GitHub
Write-Host "📤 Étape 4 : Préparation pour la publication GitHub..." -ForegroundColor Yellow

# Créer un dossier pour les releases s'il n'existe pas
$releaseDir = "..\releases"
if (!(Test-Path $releaseDir)) {
    New-Item -ItemType Directory -Path $releaseDir | Out-Null
}

# Copier l'APK dans le dossier releases
$sourceApk = "app\build\outputs\apk\debug\app-debug.apk"
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$destApk = "$releaseDir\ŒufMaster-Pro-v1.0-$timestamp.apk"

if (Test-Path $sourceApk) {
    Copy-Item -Path $sourceApk -Destination $destApk -Force
    Write-Host "✅ APK copiée vers : $destApk" -ForegroundColor Green
} else {
    Write-Host "❌ Erreur : APK source non trouvée" -ForegroundColor Red
    exit 1
}

# Retour au dossier principal
Set-Location ..

# Étape 5 : Instructions pour GitHub
Write-Host "🎉 Construction terminée avec succès !" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Prochaines étapes pour publier sur GitHub :" -ForegroundColor Yellow
Write-Host "1. Connectez-vous à votre compte GitHub : https://github.com/login" -ForegroundColor White
Write-Host "2. Allez sur votre dépôt : https://github.com/assoumso/oeufmaster" -ForegroundColor White
Write-Host "3. Cliquez sur 'Releases' dans le menu de gauche" -ForegroundColor White
Write-Host "4. Cliquez sur 'Create a new release'" -ForegroundColor White
Write-Host "5. Créez un nouveau tag (ex: v1.0.0)" -ForegroundColor White
Write-Host "6. Ajoutez un titre et une description" -ForegroundColor White
Write-Host "7. Glissez-déposez l'APK : $destApk" -ForegroundColor White
Write-Host "8. Cliquez sur 'Publish release'" -ForegroundColor White
Write-Host ""
Write-Host "📍 Emplacement de l'APK : $destApk" -ForegroundColor Cyan
Write-Host "✅ Script terminé !" -ForegroundColor Green