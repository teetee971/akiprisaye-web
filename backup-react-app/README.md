# 🌴 A KI PRI SA YÉ

[![CI/CD](https://github.com/teetee971/akiprisaye-web/actions/workflows/deploy.yml/badge.svg)](https://github.com/teetee971/akiprisaye-web/actions)

Application de **comparaison de prix** pour les **Territoires d'Outre-Mer (DOM-TOM)**.  
Elle permet de suivre les prix, comparer entre territoires et repérer les meilleures enseignes.  

🌐 Déploiement en ligne : [https://akiprisaye.pages.dev](https://akiprisaye.pages.dev)

---

## 🚀 Fonctionnalités

- 📊 **Page d'accueil** avec statistiques animées  
- 🛒 **Catalogue de produits** avec filtres avancés  
- 📈 **Comparateur de prix** avec graphiques interactifs  
- 🗺️ **Carte interactive des territoires** (/carte)  
- 🏆 **Palmarès des enseignes** (/palmares)  
- 📱 **Design responsive** adapté mobile et desktop  

---

## 🛠️ Stack technique

- **Frontend** : React + Vite + TailwindCSS  
- **CI/CD** : GitHub Actions → Cloudflare Pages  
- **Design** : Thème tropical moderne et immersif  

---

## ⚙️ Déploiement local

```bash
# Cloner le projet
git clone https://github.com/teetee971/akiprisaye-web.git
cd akiprisaye-web

# Installer les dépendances
npm install

# Lancer en mode dev
npm run dev

# Build de production
npm run build

# Aperçu du build
npm run preview