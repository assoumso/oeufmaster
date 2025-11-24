# Script de mise à jour automatique de l'APK pour ŒufMaster Pro
# Ce script automatise la mise à jour de votre APK après modifications

Write-Host "🔄 Mise à jour de l'APK ŒufMaster Pro" -ForegroundColor Cyan
Write-Host "=======================================" -ForegroundColor Cyan

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
.\gradlew assembleDebug
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erreur lors de la construction de l'APK" -ForegroundColor Red
    exit 1
}
Write-Host "✅ APK construite avec succès" -ForegroundColor Green

# Étape 4 : Afficher les informations
Write-Host "🎉 Mise à jour terminée avec succès !" -ForegroundColor Green
Write-Host "📍 Emplacement de l'APK :" -ForegroundColor Yellow
Write-Host "   $(Get-Location)\app\build\outputs\apk\debug\app-debug.apk" -ForegroundColor White

# Retour au dossier principal
Set-Location ..
Write-Host "✅ Script terminé !" -ForegroundColor Green