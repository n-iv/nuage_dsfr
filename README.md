# nuage_dsfr

Habillage DSFR (thèmes clair et sombre) et en-tête institutionnel à deux
rangées pour la plateforme Nuage. Application Nextcloud minimale : un
manifeste, un listener, une feuille de style, un script : aucun build,
aucune dépendance, aucun état.

## Architecture

- `lib/` : enregistre un listener sur `BeforeTemplateRenderedEvent`
  (pages en session) et `BeforeLoginTemplateRenderedEvent` (mire).
  API vérifiées sur la branche `stable32` du serveur.
- `css/dsfr.css` : la couche de tokens clair/sombre validée, plus la
  Section 4bis (en-tête deux rangées), gardée par la classe body
  `dsfr-header-ready`.
- `js/dsfr-header.js` : construit l'intitulé de service (nom d'instance
  via `OC.theming.name` + nom d'hôte) et la navigation textuelle en
  LISANT le menu d'applications Vue, sans jamais le modifier. Fail-open :
  en cas d'échec, la classe n'est pas posée et l'interface standard
  habillée est servie.

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
   libellés de nav), trois populations de thème (clair explicite,
   sombre explicite, thème système + OS sombre), mire, modales,
   états des boutons.
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
     commentaire de la Section 4).
