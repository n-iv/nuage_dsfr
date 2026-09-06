# Changelog

Toutes les évolutions notables de nuage_dsfr. Le numéro de version suit la branche Nextcloud ciblée (33.0.x) et sert de cache-busting des URL css/js.

## [Non publié]

- Dépôt public sur gitlab.mim-libre.fr, miroir GitHub, archive de déploiement (`make dist`), licence AGPL-3.0.
- Menu compte : le bouton « Afficher le QR code pour se connecter à l'application mobile » n'est plus masqué (il l'était par erreur, et seulement sur la première page).
- Pages guest sans formulaire (« Compte connecté » en fin de login flow, erreurs) : couleur de texte posée sur `.guest-box` et ses paragraphes, boutons `a.button` habillés comme les autres.
- `functional.css` : retrait des trois masquages de la section « Mobile et bureau », qui n'existe plus (code mort).
- `dsfr-header.js` : surcharge de traduction (fr) du texte du dialogue QR code : « Scannez le code à l’aide du client mobile que vous souhaitez connecter ».

## [33.0.8] - 2026-08-27

- Corrections de régressions Nextcloud 33 (fil d'ariane de la corbeille, sections Notifications et Partage).
- Recherche locale projetée dans l'en-tête : observation de `body` (le `#content` servi est remplacé par Vue au montage).

## [33.0.7] - 2026-07-31

- Portage Nextcloud 33 : en-tête deux rangées, libellés d'actions, barre de recherche DSFR, previews de thèmes.
- Assistant retiré des paramètres personnels.

## [32.x] - juillet 2026

- Première version : tokens clair/sombre, mire de connexion, pages publiques, bloc-marque et navigation textuelle.
