# nuage_dsfr

Habillage DSFR (thèmes clair et sombre) et en-tête institutionnel à deux
rangées pour la plateforme Nuage. Application Nextcloud minimale : un
manifeste, un listener, une feuille de style, un script : aucun build,
aucune dépendance, aucun état.

## Architecture

- `lib/` : enregistre un listener sur `BeforeTemplateRenderedEvent`
  (pages en session et pages publiques : partages) et
  `BeforeLoginTemplateRenderedEvent` (mire).
  API vérifiées sur la branche `stable32` du serveur.
- `css/dsfr.css` : la couche de tokens clair/sombre validée, plus la
  Section 4bis (en-tête deux rangées, libellés des actions à droite des
  icônes, barre de recherche DSFR sous les liens rapides - colonne droite
  de la rangée 1, comme ia.numerique.gouv.fr), gardée par la classe body
  `dsfr-header-ready`, et la Section 11 (previews de thèmes dans
  Apparence et accessibilité).
- `css/functional.css` : verrous d'exploitation et masquages d'interface
  (settings, corbeille…), chargé en session uniquement.
- `img/` : previews de thèmes (theme-{id}.webp) : captures réelles de
  l'UI prises avec l'outillage Playwright (~/git/playwright,
  `tools/capture-previews.mjs`), à régénérer à chaque évolution visible.
  Servies statiquement sous /apps/nuage_dsfr/img/ et référencées par la
  Section 11 avec un ?v= manuel (pas de cache-busting par version d'app
  sur ces URL : incrémenter à chaque changement de visuel).
- `js/dsfr-header.js` : construit l'intitulé de service (nom d'instance
  via `OC.theming.name` + nom d'hôte) et la navigation textuelle en
  LISANT le menu d'applications Vue, sans jamais le modifier. Fail-open :
  en cas d'échec, la classe n'est pas posée et l'interface standard
  habillée est servie. Sur les pages publiques (pas de menu
  d'applications), seuls bloc-marque et intitulé sont construits ; le
  titre du partage reste après eux dans `#nextcloud` (Section 4ter du
  CSS). Les libellés d'actions (« Assistant Nuage », « Notifications »,
  « Mon compte ») sont du contenu généré CSS pur : aucun nœud inséré
  dans le DOM Vue. Exception assumée : `projectSearch()` DÉPLACE (sans
  cloner) le champ de recherche local de la sidebar
  (NcAppNavigationSearch) dans la colonne droite de l'en-tête - le nœud
  reste réactif pour Vue ; jalon d'origine + restitution (mobile, ou
  re-rendu Vue qui recrée un champ côté sidebar), observateur permanent
  sur #content. Un position:fixed depuis la sidebar n'est pas peint
  au-dessus du header (confinement d'empilement, vérifié sur banc) : le
  déplacement est le seul chemin. Sur les pages sans champ local, la
  barre de recherche unifiée, habillée pareil, sert de repli (bascule
  :has dans le header-end).

Les règles fonctionnelles (masquages settings, corbeille, partages, menu
photos) restent dans `theming_customcss` : cycles de vie distincts. Lors
de la bascule, retirer de `customcss` les sections DSFR devenues
redondantes et n'y garder que le fonctionnel.

Les fontes Marianne restent servies depuis `/themes/nuage/fonts/`
(rôle `nc-theming`) : aucun chemin ne change. Si ce dépôt devient public
un jour : la fonte Marianne est EXCLUE de la licence MIT du DSFR (usage
réservé à l'État) : ne jamais la commiter, seulement la référencer.

## Installation

```bash
# Déposer le dossier dans le répertoire d'apps (via Ansible) :
chown -R www-data:www-data nuage_dsfr

occ app:enable nuage_dsfr
```

## Kill-switch

```bash
occ app:disable nuage_dsfr
```

Retour instantané à l'interface standard (ou à l'habillage
`theming_customcss` s'il est encore actif). Aucune donnée, aucun état :
la désactivation est sans reste.

## Maintenance à chaque montée de version Nextcloud

1. Relever `max-version` dans `appinfo/info.xml`, bump de version
   (le numéro de version sert de cache-busting des URL css/js).
2. Dérouler la recette : en-tête deux rangées (offset du contenu,
   libellés de nav), libellés des actions d'en-tête (hover/focus,
   popovers notifications/compte bien ancrés), barre de recherche DSFR
   sous les liens rapides (modale globale au clic ; sur les pages
   Fichiers la recherche locale s'ouvre dans la sidebar),
   marges du conteneur DSFR (en-tête, nav et contenu applicatif alignés ;
   « Aide en ligne » - app-external, iframe déjà conteneurisée - reste
   pleine largeur, repère natif : classe `app-<id>` du conteneur de
   contenu),
   trois populations de thème (clair explicite, sombre explicite, thème
   système + OS sombre) plus les deux contrastes élevés, mire, modales,
   états des boutons ; page Apparence : cinq previews (captures réelles)
   non déformés, opendyslexic d'origine, section « Paramètres de la
   barre de navigation » absente, sections voisines intactes.
3. Points de fragilité connus, marqués [VERIF] dans les sources :
   - le placement du contenu suit `--header-height`, publiée à la hauteur
     totale du chrome (rangées 1+2) quand le bandeau est actif ; la rangée 1
     se dimensionne exclusivement via `--dsfr-row1-height` ; la bascule
     :root repose sur `:has()` (dégradé sans : bas de page tronqué de 48px) ;
   - l'extraction des libellés du menu (`.app-menu-entry__label`,
     repli `aria-label`/`title`) ;
   - le seuil mobile (bandeau retiré < 1024 px) ;
   - le z-index du bandeau (1999) sous le header NC et ses popovers ;
   - le bloc-marque sur fond sombre (plaque claire proposée en
     commentaire de la Section 4) ;
   - les crochets des libellés d'actions : `#assistant` est le div de
     montage créé par assistant.js (Vue 3 monte le bouton DEDANS : le
     crochet est `#assistant button`), `#notifications`/`#user-menu` +
     `.header-menu__trigger` ; la syntaxe `content: "…" / ""`
     (navigateur ancien : déclaration ignorée, icône seule) ;
   - la barre de recherche : `#unified-search` est l'id du DIV
     `.header-menu` (le bouton est anonyme) ; barres posées en ABSOLU
     dans le header-end (jamais en flex-basis 100 % : gonfle la largeur
     max-content du header-end et écrase le header-start) ; le carré
     Bleu France de la barre unifiée repose sur la classe interne
     `.button-vue__wrapper` (si elle change : barre fonctionnelle mais
     sans carré bleu) ; le champ local projeté repose sur
     `.app-navigation__search` et les classes NcAppNavigationSearch ;
   - les accroches du masquage « Paramètres de la barre de navigation »
     (`[class*="userSectionAppMenu"]`, `[data-test-id="btn-apporder-reset"]`,
     functional.css) ;
   - les previews de thèmes : classes `.theming__preview--{id}` et
     background-image posé en style inline par ThemePreviewItem.vue
     (l'override auteur `!important` est le seul mécanisme qui le bat) ;
     les captures elles-mêmes datent : les régénérer via
     `~/git/playwright/tools/capture-previews.mjs` après toute
     évolution visible de l'interface.
