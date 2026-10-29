# MEOART (make.easy.oeuvre) — écrire, publier, être lu et référencé

- `/ecrire/` : l’application d’écriture (privée, non indexée).
- `/`, `/livre/<titre>/`, `/livre/<titre>/<chapitre>/`, `/auteur/<nom>/` : pages publiques statiques, générées par `build.mjs`, indexables par Google/Bing (sitemap.xml, robots.txt, Schema.org Book/Chapter/Person).

## 1. Supabase (gratuit)
1. SQL Editor → exécuter tout `supabase/schema.sql` (relançable). Il crée aussi les droits et vous autorise à publier (`publishers`).
2. Authentication → URL Configuration : Site URL = https://meoart.netlify.app

## 2. Netlify — le build doit tourner, donc dépôt Git (gratuit)
1. Créez un compte GitHub gratuit, un dépôt, et envoyez-y le contenu de ce dossier (Add file → Upload files).
2. Netlify → votre site → Site configuration → Build & deploy → Link repository.
3. Build & deploy → Build hooks → créez un hook, copiez son URL.
4. Site configuration → Environment variables, ajoutez : `SUPABASE_URL`, `SUPABASE_ANON_KEY` (mêmes valeurs que config.js), `BUILD_HOOK_URL` (URL du hook).
5. Chaque push Git, ou le bouton « 🚀 Mettre le site à jour » de l’application, régénère le site.

## 3. Publier
Projet : renseigner le **nom d’artiste** (obligatoire), vrai nom (facultatif, public si rempli), présentation. Livre : résumé, couverture. Passer les chapitres terminés au statut **Publié**, puis « Publier » (enregistre) et « Mettre le site à jour » (déploie). « Dépublier » retire le livre au prochain déploiement. Les brouillons ne sont jamais envoyés à la table publique.

## 4. Être trouvé sur Google / Bing
Ajoutez https://meoart.netlify.app dans Google Search Console et Bing Webmaster Tools (gratuits), vérifiez la propriété, soumettez `https://meoart.netlify.app/sitemap.xml`, puis demandez l’indexation des pages principales. L’indexation prend de quelques jours à plusieurs semaines et n’est jamais garantie ; un sous-domaine netlify.app pèse peu : un domaine à votre nom aide à terme (payant).

## 5. Import et marque-pages
Import PDF/DOCX/TXT : page du projet (nouveau livre) ou d’un livre (nouvelle saison). Les PDF scannés (images) ne sont pas lisibles sans OCR. Vérifiez toujours le résultat. Marque-pages : bouton « 🔖 Marquer ici » et liste « 📑 », enregistrés sur l’appareil du lecteur (pas de compte nécessaire).

## Limites et coûts (vérifiés en octobre 2026, à reconfirmer)
Netlify gratuit : 300 crédits/mois ; un déploiement en production coûte 15 crédits (≈ 20 déploiements/mois), la bande passante consomme aussi des crédits. Crédits épuisés = déploiements bloqués. Groupez vos publications. Supabase gratuit : un projet inactif peut être mis en pause ; le site public statique reste en ligne.
Non testé en réel ici : connexion Supabase, build hook et indexation. Pas encore fait : commentaires, historique des versions, export PDF/DOCX.
