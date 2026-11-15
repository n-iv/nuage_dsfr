# Changelog

Toutes les évolutions notables de nuage_dsfr. Le numéro de version suit la branche Nextcloud ciblée (33.0.x) et sert de cache-busting des URL css/js.

## [Non publié]

- Nextcloud 34 : la page Paramètres est devenue une appli Vue (`main#app-content-vue`, nav `.app-navigation` sans id) : toute la couche fonctionnelle des Paramètres de `functional.css` ne visait plus rien (profil, e-mail, téléphone, adresse, réseaux sociaux, mot de passe, 2FA, WebAuthn, entrées Assistant, Disponibilités, Flux, Office réapparaissaient). Règles réécrites sur `body#body-settings` et sur les ids stables `#account-property-*` (plus de `nth-child`), valides en 33 et en 34.
- Nextcloud 34 : le contenu des Paramètres passait sous l'en-tête (titre et bouton de dépli de la navigation cachés, barre de défilement horizontale) : le module CSS de SettingsApp annule la marge de `#content`, le parent reprend `margin-top: var(--header-height)` et `height: var(--body-height)`.
- Nextcloud 34 : la recherche unifiée a un nouveau markup (`search.unified-search-input > button.unified-search-input__button`), posé au centre de l'en-tête natif ; sans recherche locale il ne restait qu'une loupe nue. Barre fr-search-bar reconstruite sur ce markup, dans la même case que la barre 33.
- Nextcloud 34 : les panneaux d'en-tête (notifications, compte) étaient translucides (`--color-main-background-blur` sans flou) : fond plein `--dsfr-bg-default`.
- Nextcloud 34 : la navigation des Paramètres (nouveau `NcAppNavigation`) suit la même mécanique que les autres pages : repli mémorisé, tiroir dans la gouttière au-delà de 1848px (`body#body-settings` ajouté aux règles) ; son bouton de dépli était caché par le décalage de contenu corrigé ci-dessus.
- Nextcloud 34 : la colonne « Expire le » manquait au chargement direct de la vue « Partagés par lien » (l'en-tête de liste lit `activeView.columns` par un `shallowRef`, figé avant notre décoration) : la vue active est remplacée par un jumeau après décoration, ce qui force le recalcul (34 seulement).
- Nextcloud 34 (qualification de la 34.0.6) : quatre verrous des Paramètres ne tenaient plus. Notifications d'activité : le groupe « Agenda, contacts et tâches » était réapparu et « Partage » était masqué à sa place (le groupe a changé de rang, `tbody:nth-child(4)` ne le visait plus) ; il est ancré sur les ids de ses cases (`#calendar_email`…). Notifications : le réglage de son d'appel Talk était réapparu (les cases sont devenues des interrupteurs, classe `checkbox-radio-switch-switch`). Vie privée : « Qui a accès à vos données ? » était réapparu (la section ne porte plus `settings-section--limit-width`). Partage : le transfert de propriété était réapparu (le montage Vue fait disparaître `#files-personal-settings`), la section se reconnaît aux classes de module `_transferOwnership__*`. Règles valides en 33 et en 34.
- Corbeille : « Supprimer définitivement » réapparaissait en lot en 34 (barre de sélection déplacée) et n'avait jamais été masqué dans le menu « … » de chaque ligne. Les trois entrées (« Vider », lot, ligne) sont masquées par les attributs de test `data-cy-*` de l'app files, limitées à la vue corbeille ; purge automatique seulement, comme la règle le voulait.
- Ctrl+F : le cœur ouvre la recherche unifiée partout (écouteur global, chemins d'exception codés en dur). Dans un document ouvert (Texte, PDF, images), Ctrl+F est laissé au navigateur, qui fait sa recherche dans la page ; dans Fichiers, il met le focus dans le champ de recherche projeté dans l'en-tête, celui qui filtre la liste.
- Tutoriels et Assistance (app external) : l'iframe, laissée pleine largeur, calculait les marges de son propre fr-container sur le viewport et sa barre de défilement, son contenu dépassait d'une vingtaine de pixels de chaque côté ; elle est calée sur le conteneur DSFR élargi d'1rem, le contenu intérieur s'aligne sur le reste.
- Nav textuelle : l'app « Office » livrée par Nextcloud 34 est exclue (`/apps/office/`), comme Photos ; elle est aussi désactivée par le déploiement (`not_installed_apps_base`).
- Navigation repliée : le panneau apparaissait furtivement à chaque chargement et à chaque changement d'application (NcAppNavigation se monte toujours ouvert, notre fermeture arrivait après, animée). Le script pose `html.dsfr-nav-closed` dès son exécution quand la mémoire dit replié ; le CSS y impose l'état replié sans transition jusqu'à la fermeture réelle par NC, la première interaction ou 4 s (fail-open).
- Pages de partage public : un « Assistant Nuage » fantôme (icône + libellé, inerte) restait peint dans l'en-tête. Cause : la réservation pré-Vue de l'entrée assistant se déclenchait sur n'importe quel script de l'app (elle sert ses scripts de références de fichiers sur les pages publiques) alors que seul `assistant-main`, servi en session uniquement, crée `div#assistant`. Le test JS ne vise plus que `assistant-main` hors `body-public`, et la règle CSS est conditionnée à `dsfr-header-ready` comme les autres espaces réservés ; rien ne change en session (même instant de peinture).
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
