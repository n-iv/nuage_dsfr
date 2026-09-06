# nuage_dsfr

Habillage [DSFR](https://www.systeme-de-design.gouv.fr/) (thèmes clair et sombre) et en-tête institutionnel à deux rangées pour Nextcloud, développé pour **Nuage**, le service de stockage et de partage de fichiers du ministère de l'Éducation nationale ([nuage.apps.education.fr](https://nuage.apps.education.fr)).

Application Nextcloud minimale : un manifeste, un listener, deux feuilles de style, un script. Aucun build, aucune dépendance, aucun état.

- Dépôt canonique : <https://gitlab.mim-libre.fr/varlotnicolas/nuage_dsfr>
- Miroir : <https://github.com/n-iv/nuage_dsfr>
- Licence : AGPL-3.0-or-later (voir `COPYING`)

## Ce que fait l'app

- **Tokens DSFR** clair/sombre (et contrastes élevés) appliqués par-dessus les variables CSS de Nextcloud : couleurs, rayons, typographie Marianne.
- **Mire de connexion** et pages guest (flow client, mot de passe perdu, 2FA, erreurs) habillées.
- **En-tête à deux rangées** : rangée 1 = bloc-marque officiel (construit en HTML/CSS, comme le `fr-logo` du DSFR) + intitulé de service (nom de l'instance, slogan) + actions ; rangée 2 = navigation textuelle des applications, à la manière du `fr-header` (cf. impots.gouv.fr). La barre de recherche DSFR prend la colonne droite de la rangée 1.
- **Pages publiques** (partages) : bloc-marque et intitulé, sans navigation.
- **Previews de thèmes** réels dans Apparence et accessibilité.
- **Verrous d'exploitation** (`css/functional.css`) : masquages d'interface propres à l'exploitation de Nuage (sections de paramètres, corbeille, menu contacts…), chargés en session uniquement. Cycle de vie distinct de l'habillage : ces sélecteurs, souvent positionnels, sont les premiers à casser aux montées de version.

La transformation de l'en-tête est **fail-open** : si le script ne peut pas s'appliquer, l'interface Nextcloud standard, habillée CSS, est conservée. Désactivation instantanée et sans reste : `occ app:disable nuage_dsfr`.

## Prérequis

- Nextcloud 33 (`max-version` dans `appinfo/info.xml`).
- **Fontes Marianne** servies par le serveur sous `/themes/<theme>/fonts/Marianne-{Regular,Medium,Bold}.woff2` (chemin attendu : `/themes/nuage/fonts/`). Elles ne sont **pas** dans ce dépôt : la Marianne est exclue de la licence MIT du DSFR (usage réservé à l'État). Ne jamais la commiter, seulement la référencer.
- Valeurs `theming` de l'instance, lues par le script (`occ theming:config …`) : `name` (intitulé de service), `slogan` (sous-titre, repli sur le nom d'hôte), `url` (cible du bloc-marque ; sur un nœud Global Scale, l'adresse du maître), `primary_color` (#000091), `background_color` (#F5F5FE), `productName`.
- Recommandé : `theming_customcss` désactivée (les règles DSFR y feraient doublon) et `firstrunwizard` désactivée.

## Installation

```bash
# Archive au format appstore (nuage_dsfr/ à la racine)
make dist                     # build/nuage_dsfr-v<version>.tar.gz
tar -xzf build/nuage_dsfr-v*.tar.gz -C /chemin/nextcloud/apps/
chown -R www-data:www-data /chemin/nextcloud/apps/nuage_dsfr
sudo -u www-data php occ app:enable nuage_dsfr
```

Kill-switch : `occ app:disable nuage_dsfr` (retour instantané à l'interface standard, ou à `theming_customcss` si elle est encore active).

Le numéro de version de `appinfo/info.xml` sert de cache-busting des URL css/js : le bumper à chaque changement visible.

## Architecture

- `lib/` : enregistre un listener sur `BeforeTemplateRenderedEvent` (pages en session et pages publiques) et `BeforeLoginTemplateRenderedEvent` (mire). Le script d'en-tête est injecté en `<script async>` depuis le `<head>` avec le nonce CSP (la file `addScript` s'exécute après les bundles Vue, trop tard pour éviter un en-tête à moitié vide entre deux pages) ; repli fail-open sur `addScript` si le gestionnaire de nonce (classe privée) change.
- `css/dsfr.css` : tokens clair/sombre, mire (Section 3), en-tête rangée 1 (Section 4), en-tête deux rangées et barre de recherche (Section 4bis, gardée par la classe body `dsfr-header-ready`), pages publiques (4ter), previews de thèmes (Section 11).
- `css/functional.css` : verrous d'exploitation, en session uniquement.
- `img/` : previews de thèmes `theme-{id}.webp`, captures réelles de l'interface à régénérer à chaque évolution visible. Servies sous `/apps/nuage_dsfr/img/` avec un `?v=` manuel à incrémenter (pas de cache-busting par version d'app sur ces URL).
- `js/dsfr-header.js` : construit le bloc-marque et l'intitulé de service (`OC.theming.name`, `window._theme.slogan`), puis la navigation textuelle en **lisant** l'état initial serveur (`#initial-state-core-apps`, repli sur le menu Vue) sans jamais modifier le menu d'applications. Les libellés d'actions (« Notifications », « Mon compte »…) sont du contenu généré CSS : aucun nœud inséré dans le DOM Vue. Exception assumée : `projectSearch()` **déplace** (sans cloner) le champ de recherche local de la sidebar (`NcAppNavigationSearch`) dans la colonne droite de l'en-tête ; le nœud reste réactif pour Vue, un jalon marque l'origine pour restitution (mobile, ou re-rendu Vue qui recrée un champ côté sidebar), observateur sur `body`. Un `position:fixed` depuis la sidebar n'est pas peint au-dessus du header (confinement d'empilement) : le déplacement est le seul chemin. Sans champ local, la barre unifiée, habillée pareil, sert de repli.

## Recette à chaque montée de version Nextcloud

1. Relever `max-version` dans `appinfo/info.xml`, bumper la version.
2. Dérouler : en-tête deux rangées (offset du contenu, libellés de nav), libellés des actions (hover/focus, popovers notifications/compte ancrés), barre de recherche DSFR (modale globale au clic ; sur Fichiers la recherche locale s'ouvre dans la sidebar), marges du conteneur (en-tête, nav et contenu alignés ; « Aide en ligne », iframe `app-external`, reste pleine largeur via la classe `app-<id>` du conteneur), trois populations de thème (clair explicite, sombre explicite, système + OS sombre) plus les deux contrastes élevés, mire, modales, états des boutons ; page Apparence : cinq previews non déformés, section « Paramètres de la barre de navigation » absente, sections voisines intactes.
3. Points de fragilité connus, marqués `[VERIF]` dans les sources :
   - le placement du contenu suit `--header-height`, publiée à la hauteur totale du chrome (rangées 1+2) quand le bandeau est actif ; la rangée 1 se dimensionne via `--dsfr-row1-height` ; la bascule `:root` repose sur `:has()` ;
   - l'extraction des libellés du menu (`.app-menu-entry__label`, repli `aria-label`/`title`) ;
   - le seuil mobile (bandeau retiré < 1024 px) ;
   - le z-index du bandeau (1999) sous le header et ses popovers ;
   - les crochets des libellés d'actions : `#assistant button` (Vue 3 monte le bouton dans le div créé par assistant.js), `#notifications`/`#user-menu` + `.header-menu__trigger` ; la syntaxe `content: "…" / ""` ;
   - la barre de recherche : `#unified-search` est le div `.header-menu` ; barres posées en absolu dans le header-end (jamais en `flex-basis: 100%`) ; le carré Bleu France de la barre unifiée repose sur `.button-vue__wrapper` ; le champ local projeté repose sur `.app-navigation__search` ;
   - les masquages de `functional.css` (« Check this still works at every upgrade! ») ;
   - les previews de thèmes : `.theming__preview--{id}` et `background-image` inline posé par `ThemePreviewItem.vue` (l'override `!important` est le seul mécanisme qui le bat).

## Développement

```bash
make lint          # php -l
make dist          # archive
make deploy-local  # copie l'archive dans ../appli/apps/ (déploiement Ansible de Nuage)
```

Un commit par correctif, `CHANGELOG.md` tenu à jour, version bumpée dans `appinfo/info.xml` uniquement.
