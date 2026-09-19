# Changelog

Toutes les évolutions notables de nuage_dsfr. Le numéro de version suit la branche Nextcloud ciblée (33.0.x) et sert de cache-busting des URL css/js.

## [Non publié]

- Essai : vue « Partagés par lien » avec une colonne « Expire le » triable (date la plus proche parmi les liens du fichier) et une action « Prolonger à 365 jours », en ligne et en lot, qui repousse tous les liens du fichier (API OCS ; appuis privés de @nextcloud/files v4) ; colonne Taille masquée dans cette vue.
- Visualiseur (PDF, images, vidéos) : bandeau de titre et marges du conteneur ramenés à la hauteur d'en-tête native (50px) au lieu des 144px du mode deux rangées ; le « chapeau » noir au-dessus des PDF disparaît.
- Essai : navigation de gauche repliée par défaut sur ordinateur, ouverte au bouton sandwich, état mémorisé dans le navigateur (localStorage) d'une page à l'autre.
- Essai : au-delà de 1848px de viewport, la navigation et le panneau latéral droit sortent dans les gouttières DSFR (esprit fr-sidemenu) ; le cadre de contenu garde les marges du conteneur et la liste de fichiers s'aligne sur l'en-tête.
- Panneaux dans les gouttières : les deux se déploient en tiroir, de sous le contenu vers l'extérieur (miroir du petit écran, où NC les déploie du bord vers l'intérieur) ; avant, fondu à gauche et glissement depuis la marge à droite.
- Pages de partage public : le pied de page (fixe, centré par translation chez NC) recevait la marge du conteneur DSFR en plus de son centrage, d'où un cadre décalé de deux marges et coupé à droite ; il est désormais calé sur la largeur du conteneur.
- Corbeille : la colonne « Supprimé par » n'est plus masquée (indispensable dans un dossier partagé) ; seule « Modifié » reste masquée pour laisser sa place au Nom dans le conteneur DSFR.
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
