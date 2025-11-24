# Guide de Publication de l'APK sur GitHub

## Vue d'ensemble
Ce guide vous explique comment publier votre application APK "ŒufMaster Pro" sur votre dépôt GitHub https://github.com/assoumso/oeufmaster

## 🎯 Objectif
Publier l'APK de votre application Android sur GitHub pour permettre aux utilisateurs de la télécharger.

## 📋 Prérequis
- Votre APK est construite et se trouve dans `releases/ŒufMaster-Pro-v1.0.apk`
- Vous avez un compte GitHub
- Vous avez accès à votre dépôt `assoumso/oeufmaster`

## 🚀 Méthode 1 : Publication Manuelle (Recommandée)

### Étape 1 : Connexion à GitHub
1. Ouvrez votre navigateur et allez sur https://github.com/login
2. Connectez-vous avec vos identifiants

### Étape 2 : Accès au dépôt
1. Allez sur https://github.com/assoumso/oeufmaster
2. Cliquez sur votre dépôt

### Étape 3 : Créer une Release
1. Cliquez sur "Releases" dans le menu de gauche (ou allez directement sur https://github.com/assoumso/oeufmaster/releases)
2. Cliquez sur le bouton "Create a new release" ou "Draft a new release"

### Étape 4 : Configurer la Release
1. **Tag version** : Entrez `v1.0.0` (ou la version de votre choix)
2. **Target** : Sélectionnez la branche principale (souvent `main` ou `master`)
3. **Release title** : Entrez un titre comme "ŒufMaster Pro v1.0.0"
4. **Description** : Ajoutez une description détaillée comme :

```markdown
# ŒufMaster Pro v1.0.0

Application de gestion pour ŒufMaster Pro.

## Fonctionnalités
- Gestion des commandes clients
- Suivi des stocks
- Gestion des dépenses
- Rapports détaillés
- Interface moderne et intuitive

## Installation
1. Téléchargez le fichier APK ci-dessous
2. Activez "Sources inconnues" dans les paramètres de sécurité de votre Android
3. Installez l'APK

## Captures d'écran
[Ajoutez des captures d'écran ici]

## Support
Pour toute question ou problème, veuillez ouvrir une issue sur ce dépôt.
```

### Étape 5 : Ajouter l'APK
1. Faites glisser et déposez le fichier `releases/ŒufMaster-Pro-v1.0.apk` dans la zone "Attach binaries by dropping them here or selecting them"
2. Attendez que le téléversement soit terminé

### Étape 6 : Publier
1. Si votre version est prête, cliquez sur "Publish release"
2. Si vous voulez la publier plus tard, cliquez sur "Save draft"

## ⚡ Méthode 2 : Utilisation du Script Automatisé

### Utilisation du script
1. Ouvrez PowerShell dans le dossier de votre projet
2. Exécutez : `.\publish_github.ps1`
3. Le script va :
   - Construire votre application web
   - Synchroniser avec Capacitor
   - Construire l'APK
   - Copier l'APK dans le dossier releases
   - Afficher les instructions pour la publication manuelle

### Après l'exécution du script
Suivez les instructions affichées à l'écran pour publier sur GitHub.

## 📱 Instructions d'Installation pour les Utilisateurs

Une fois publiée, les utilisateurs peuvent :
1. Aller sur https://github.com/assoumso/oeufmaster/releases
2. Télécharger la dernière version de l'APK
3. Activer "Sources inconnues" dans Android
4. Installer l'application

## 🔄 Mises à jour Futures

Pour publier une nouvelle version :
1. Mettez à jour votre code
2. Exécutez `.\update_apk.ps1` pour créer une nouvelle APK
3. Créez une nouvelle release sur GitHub avec un nouveau numéro de version
4. Téléversez la nouvelle APK

## 📝 Notes Importantes

- **Sécurité** : GitHub scanne automatiquement les fichiers téléversés pour détecter les menaces
- **Taille maximale** : GitHub accepte des fichiers jusqu'à 2GB pour les releases
- **Versions** : Utilisez un schéma de versionnement clair (ex: v1.0.0, v1.1.0, etc.)
- **Descriptions** : Soyez détaillé dans vos descriptions de release

## 🆘 Dépannage

### Problème : "Release already exists"
- Utilisez un numéro de version différent
- Supprimez la release existante si nécessaire

### Problème : "File too large"
- Vérifiez que votre APK fait moins de 2GB
- Optimisez votre build si nécessaire

### Problème : "Network error"
- Réessayez plus tard
- Vérifiez votre connexion Internet

## 📞 Support

Si vous rencontrez des problèmes :
1. Vérifiez que votre APK est bien construite
2. Assurez-vous d'avoir les droits sur le dépôt
3. Contactez le support GitHub si nécessaire

---

**Félicitations !** 🎉 Votre application ŒufMaster Pro est maintenant prête à être publiée sur GitHub !