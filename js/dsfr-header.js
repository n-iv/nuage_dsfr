/**
 * nuage_dsfr - en-tête DSFR à deux rangées.
 *
 * Rangée 1 (le #header Nextcloud existant) : bloc-marque + intitulé de
 * service injecté (« Nuage » + nom d'hôte), actions à droite inchangées.
 * Rangée 2 (créée ici) : navigation textuelle des applications, à la
 * manière du fr-header DSFR (cf. impots.gouv.fr).
 *
 */

(function () {
	'use strict';

	var NAV_CLASS = 'dsfr-nav';
	var READY_CLASS = 'dsfr-header-ready';
	var BRAND_READY_CLASS = 'dsfr-brand-ready';
	var OBSERVE_TIMEOUT_MS = 8000;

	/**
	 * Bloc-marque typographique. Le fr-logo du DSFR est lui-même du
	 * HTML/CSS (pas une image) : c'est ce qui lui permet de suivre les
	 * thèmes. Lignes de l'intitulé officiel (casse gérée par le CSS).
	 */
	var BRAND_LINES = ['Ministère', 'de l\u2019Éducation', 'nationale'];

	/**
	 * URL canonique du lien d'accueil (bloc-marque). Vide = lue depuis le
	 * theming (occ theming:config url), exposée dans window._theme.baseUrl.
	 * Le repli ignore la valeur d'usine nextcloud.com. Sur un nœud
	 * GlobalScale, configurer le theming url sur l'adresse MAÎTRE.
	 */
	var BRAND_HOME_URL = '';

	/**
	 * Les valeurs du theming (nom, slogan) arrivent HTML-échappées dans
	 * window._theme (l&#039; etc.) : décodage sûr via un textarea détaché
	 * (aucune exécution possible dans ce contexte).
	 */
	function decodeEntities(s) {
		var t = document.createElement('textarea');
		t.innerHTML = s;
		return t.value;
	}

	/**
	 * Applications exclues de la navigation (politique fonctionnelle Nuage).
	 * L'ancienne règle CSS nth-child du menu d'icônes (theming_customcss)
	 * ne peut pas couvrir cette nav : l'exclusion se fait ici, à la source
	 * de la projection.
	 */
	var EXCLUDED_APP_PATHS = ['/apps/photos/'];

	/**
	 * Bloc-marque typographique : drapeau, intitulé, devise : construits
	 * DANS le lien d'accueil (#nextcloud) qui reste la cible cliquable.
	 * L'image du theming est masquée par CSS sous BRAND_READY_CLASS,
	 * jamais retirée (la mire de connexion continue de la servir).
	 */
	function buildBlocMarque() {
		if (document.querySelector('.dsfr-brand')) {
			return;
		}
		var logoLink = document.getElementById('nextcloud');
		if (!logoLink) {
			return;
		}
		var brand = document.createElement('div');
		brand.className = 'dsfr-brand';

		var flag = document.createElement('span');
		flag.className = 'dsfr-brand__flag';
		flag.setAttribute('aria-hidden', 'true');
		brand.appendChild(flag);

		var name = document.createElement('span');
		name.className = 'dsfr-brand__name';
		BRAND_LINES.forEach(function (line) {
			var l = document.createElement('span');
			l.className = 'dsfr-brand__line';
			l.textContent = line;
			name.appendChild(l);
		});
		brand.appendChild(name);

		var devise = document.createElement('span');
		devise.className = 'dsfr-brand__devise';
		devise.setAttribute('aria-hidden', 'true');
		brand.appendChild(devise);

		// Lien d'accueil : adresse canonique (maître) plutôt que le nœud
		// local. Sur les pages publiques #nextcloud est un simple div.
		var home = BRAND_HOME_URL;
		if (!home) {
			try {
				var b = window._theme && window._theme.baseUrl;
				if (b && String(b).indexOf('nextcloud.com') === -1) {
					home = decodeEntities(String(b));
				}
			} catch (e) { /* href d'origine conservé */ }
		}
		if (home && logoLink.tagName === 'A') {
			logoLink.href = home;
		}

		// En premier enfant : sur les pages publiques, #nextcloud contient
		// aussi le titre du partage (.header-info), qui doit rester après
		// le bloc-marque et l'intitulé de service.
		logoLink.insertBefore(brand, logoLink.firstChild);

		// Bascule image → bloc-marque seulement quand Marianne est active :
		// avant ça, le texte rendrait en police de repli puis se
		// retaillerait au font-swap (flash au chargement).
		var reveal = function () {
			document.body.classList.add(BRAND_READY_CLASS);
		};
		if (document.fonts && document.fonts.load) {
			Promise.all([
				document.fonts.load('700 1em Marianne'),
				document.fonts.load('400 1em Marianne'),
			]).then(reveal, reveal);
		} else {
			reveal();
		}
	}

	/**
	 * Intitulé de service à droite du bloc-marque :
	 * nom de l'instance (theming NC) + nom d'hôte en sous-titre.
	 */
	function buildServiceTitle() {
		if (document.querySelector('.dsfr-service')) {
			return;
		}
		var logo = document.getElementById('nextcloud');
		if (!logo || !logo.parentElement) {
			return;
		}
		var name = 'Nuage';
		try {
			if (window.OC && window.OC.theming && window.OC.theming.name) {
				name = decodeEntities(String(window.OC.theming.name));
			}
		} catch (e) { /* valeur par défaut conservée */ }

		var wrap = document.createElement('div');
		wrap.className = 'dsfr-service';

		var title = document.createElement('span');
		title.className = 'dsfr-service__title';
		title.textContent = name;

		var tagline = document.createElement('span');
		tagline.className = 'dsfr-service__tagline';
		// Slogan du theming, injecté par le serveur dans window._theme
		var slogan = '';
		try {
			if (window._theme && window._theme.slogan) {
				slogan = decodeEntities(String(window._theme.slogan));
			} else if (window.OC && window.OC.theming && window.OC.theming.slogan) {
				slogan = decodeEntities(String(window.OC.theming.slogan));
			}
		} catch (e) { /* repli conservé */ }
		tagline.textContent = slogan || window.location.hostname;

		wrap.appendChild(title);
		wrap.appendChild(tagline);
		// Juste après le bloc-marque quand il existe (ordre : bloc-marque,
		// intitulé, puis - pages publiques - titre du partage) ; sinon
		// après le porte-logo (repli, bloc-marque non construit).
		var brand = document.querySelector('.dsfr-brand');
		if (brand) {
			brand.insertAdjacentElement('afterend', wrap);
		} else {
			logo.insertAdjacentElement('afterend', wrap);
		}
	}

	/**
	 * Extrait le libellé d'une entrée du menu d'applications.
	 */
	function entryLabel(li, a) {
		var label = li.querySelector('.app-menu-entry__label');
		if (label && label.textContent.trim() !== '') {
			return label.textContent.trim();
		}
		return a.getAttribute('aria-label') || a.getAttribute('title') || '';
	}

	/**
	 * Entrées de navigation depuis l'état initial serveur
	 * (#initial-state-core-apps, base64 JSON), présent dans le flux AVANT
	 * #header : la nav se construit pendant l'analyse du document, sans
	 * attendre l'exécution des bundles Vue - c'est ce qui supprime la
	 * pause visuelle entre deux pages. [VERIF] id et format de l'état.
	 */
	function navItemsFromState() {
		var el = document.getElementById('initial-state-core-apps');
		if (!el || !el.value) {
			return null;
		}
		var list;
		try {
			list = JSON.parse(atob(el.value));
		} catch (e) {
			return null;
		}
		if (list && typeof list === 'object' && !Array.isArray(list)) {
			list = Object.keys(list).map(function (k) { return list[k]; });
		}
		if (!Array.isArray(list)) {
			return null;
		}
		var items = [];
		list.forEach(function (e) {
			if (!e || e.type !== 'link' || !e.href || !e.name) {
				return;
			}
			items.push({
				href: String(e.href),
				text: decodeEntities(String(e.name)),
				active: !!e.active,
			});
		});
		return items.length ? items : null;
	}

	/**
	 * Repli : extraction depuis le menu Vue existant (état initial absent
	 * ou illisible) - l'ancienne voie, qui attend le montage Vue.
	 */
	function navItemsFromMenu() {
		var header = document.getElementById('header');
		if (!header) {
			return null;
		}
		var entries = header.querySelectorAll('.app-menu .app-menu-entry');
		if (entries.length === 0) {
			return null;
		}
		var items = [];
		entries.forEach(function (li) {
			var a = li.querySelector('a');
			if (!a || !a.href) {
				return;
			}
			var text = entryLabel(li, a);
			if (text === '') {
				return;
			}
			items.push({
				href: a.href,
				text: text,
				active: li.classList.contains('app-menu-entry--active'),
			});
		});
		return items.length ? items : null;
	}

	/**
	 * Construit la navigation textuelle (état initial d'abord, menu Vue en
	 * repli). Retourne true si la nav est en place et peuplée.
	 */
	function buildNav() {
		if (document.querySelector('nav.' + NAV_CLASS)) {
			return true;
		}
		var header = document.getElementById('header');
		if (!header) {
			return false;
		}
		var items = navItemsFromState() || navItemsFromMenu();
		if (!items) {
			return false;
		}

		var nav = document.createElement('nav');
		nav.className = NAV_CLASS;
		nav.setAttribute('aria-label', 'Applications');

		var built = 0;
		items.forEach(function (it) {
			var excluded = EXCLUDED_APP_PATHS.some(function (p) {
				return it.href.indexOf(p) !== -1;
			});
			if (excluded) {
				return;
			}
			var item = document.createElement('a');
			item.className = 'dsfr-nav__item';
			item.href = it.href;
			item.textContent = it.text;
			if (it.active) {
				item.classList.add('dsfr-nav__item--active');
				item.setAttribute('aria-current', 'page');
			}
			nav.appendChild(item);
			built++;
		});

		if (built === 0) {
			return false;
		}
		header.insertAdjacentElement('afterend', nav);
		return true;
	}

	/**
	 * Projection du champ de recherche local (NcAppNavigationSearch, en
	 * tête de la sidebar) dans la colonne droite de l'en-tête, où la
	 * Section 4bis l'habille en fr-search-bar. Le nœud est DÉPLACÉ, pas
	 * cloné : Vue garde ses références, le champ reste réactif. Un jalon
	 * (nœud commentaire) marque l'emplacement d'origine pour restitution :
	 * passage sous le seuil mobile, ou re-rendu Vue qui recrée un champ
	 * dans la sidebar (le nœud périmé est alors rendu à son jalon, où Vue
	 * peut le démonter proprement). Un position:fixed depuis la sidebar
	 * n'est pas peint au-dessus du header (confinement d'empilement du
	 * conteneur de navigation, vérifié sur banc) : le déplacement est le
	 * seul chemin. [VERIF] classe .app-navigation__search.
	 */
	var SEARCH_MQ = '(min-width: 1024px)';
	// Posée sur body quand le champ est projeté : c'est elle qui masque la
	// barre unifiée en CSS. Ne PAS s'appuyer sur :has(.app-navigation__search)
	// côté header : Firefox (mesuré 151) ne réévalue pas :has quand le nœud
	// est déplacé dans le header - la règle ne s'appliquait qu'après un
	// restyle fortuit. La classe, posée par le même code qui déplace le
	// nœud, est réévaluée partout, sans plancher de version navigateur.
	var SEARCH_PROJECTED_CLASS = 'dsfr-search-projected';
	var searchOrigin = null;   // jalon dans la sidebar
	var searchNode = null;     // nœud actuellement projeté

	function restoreSearch() {
		if (searchNode && searchOrigin && searchOrigin.parentNode) {
			searchOrigin.parentNode.insertBefore(searchNode, searchOrigin);
			searchOrigin.parentNode.removeChild(searchOrigin);
		}
		searchNode = null;
		searchOrigin = null;
		document.body.classList.remove(SEARCH_PROJECTED_CLASS);
	}

	function projectSearch() {
		var headerEnd = document.querySelector('#header .header-end');
		if (!headerEnd || !document.body.classList.contains(READY_CLASS)) {
			return;
		}
		if (!window.matchMedia(SEARCH_MQ).matches) {
			restoreSearch();
			return;
		}
		// Le champ côté sidebar (jamais celui déjà projeté). NcAppNavigation
		// rend toujours le conteneur __search, même sans recherche (div vide
		// sur Activité par ex.) : seuls les conteneurs peuplés comptent.
		var candidate = null;
		var nodes = document.querySelectorAll('div.app-navigation__search');
		for (var i = 0; i < nodes.length; i++) {
			if (!headerEnd.contains(nodes[i]) && nodes[i].firstElementChild) {
				candidate = nodes[i];
				break;
			}
		}
		if (!candidate) {
			// Pas de champ côté sidebar ET nœud projeté démonté ou vidé par
			// Vue : rendre la main à la barre unifiée (la classe tombe).
			if (searchNode && (!searchNode.parentNode || !searchNode.firstElementChild)) {
				restoreSearch();
			}
			return;
		}
		// Vue a recréé un champ dans la sidebar : rendre le périmé d'abord
		restoreSearch();
		searchOrigin = document.createComment('dsfr-search-origin');
		candidate.parentNode.insertBefore(searchOrigin, candidate);
		headerEnd.appendChild(candidate);
		searchNode = candidate;
		document.body.classList.add(SEARCH_PROJECTED_CLASS);
	}

	var searchWatched = false;
	function watchSearch() {
		if (searchWatched) {
			return;
		}
		searchWatched = true;
		var safeProject = function () {
			try {
				projectSearch();
			} catch (e) { /* fail-open : champ laissé où il est */ }
		};
		safeProject();
		// La sidebar (Vue) monte et se re-rend après l'en-tête : on suit ses
		// apparitions. Observer document.body, jamais un conteneur de
		// contenu : le #content servi est REMPLACÉ par Vue au montage
		// (mesuré en 33.0.7 : nœud déconnecté, observateur muet — la
		// projection ne se déclenchait plus qu'au franchissement du seuil
		// 1024px). body, lui, survit à tous les re-rendus ; la projection
		// reste un no-op quand rien n'a changé.
		try {
			var mql = window.matchMedia(SEARCH_MQ);
			if (mql.addEventListener) {
				mql.addEventListener('change', safeProject);
			} else if (mql.addListener) {
				mql.addListener(safeProject);
			}
			new MutationObserver(safeProject)
				.observe(document.body || document.documentElement,
					{ childList: true, subtree: true });
		} catch (e) { /* fail-open */ }
	}

	/**
	 * Indices précoces pour les espaces réservés CSS : avatar réel (URL
	 * déterministe /avatar/<uid>/64, déjà dans le cache navigateur) et
	 * présence de l'app assistant (sa balise <script> est dans le
	 * document bien avant son exécution, qui crée div#assistant après
	 * les bundles). Idempotent, fail-open.
	 */
	function primePlaceholders() {
		try {
			var uid = document.head && document.head.dataset ? document.head.dataset.user : '';
			if (uid) {
				document.documentElement.style.setProperty(
					'--dsfr-avatar',
					'url("/index.php/avatar/' + encodeURIComponent(uid) + '/64")'
				);
				document.body.classList.add('dsfr-avatar-ready');
			}
			if (document.querySelector('script[src*="/apps/assistant/"]')) {
				document.body.classList.add('dsfr-assistant-pending');
			}
		} catch (e) { /* placeholders génériques conservés */ }
	}

	function apply() {
		var navDone = false;
		try {
			// Bloc-marque et intitulé : indépendants de la nav : ils ne
			// dépendent que du lien d'accueil, présent dès le rendu serveur.
			primePlaceholders();
			buildBlocMarque();
			buildServiceTitle();
			// Pages publiques : bloc-marque + intitulé seulement, jamais de
			// nav ni de deuxième rangée (READY_CLASS). Depuis NC 33 l'état
			// initial core-apps est aussi servi sur ces pages : sans ce
			// garde, une nav « Fichiers » y apparaissait.
			if (document.body && document.body.id === 'body-public') {
				return !!document.querySelector('.dsfr-service');
			}
			if (buildNav()) {
				document.body.classList.add(READY_CLASS);
				navDone = true;
				watchSearch();
			}
		} catch (e) {
			// Fail-open : interface standard conservée, trace pour le support.
			if (window.console && console.warn) {
				console.warn('[nuage_dsfr] en-tête non transformé, interface standard conservée', e);
			}
			return true; // ne pas réessayer en boucle après une exception
		}
		return navDone;
	}

	/**
	 * Surcharges de traduction (français) de chaînes core dont la formulation
	 * ne convient pas à Nuage. Le registre @nextcloud/l10n est global et
	 * partagé : OC.L10N.register fusionne le paquet dans celui de l'app
	 * (la dernière inscription gagne). core/l10n/fr.js est un script
	 * synchrone du <head>, donc déjà inscrit à DOMContentLoaded ; les
	 * composants Vue traduisent au rendu (le dialogue QR à l'ouverture),
	 * bien après. Fail-open : sans OC.L10N, la traduction d'origine reste.
	 * [VERIF] les clés sont les chaînes source anglaises exactes du core.
	 */
	var FR_OVERRIDES = {
		'Use {productName} mobile client you want to connect to scan the code':
			'Scannez le code à l’aide du client mobile que vous souhaitez connecter',
	};

	function overrideTranslations() {
		try {
			var lang = (document.documentElement.lang || '').toLowerCase();
			if (lang.indexOf('fr') !== 0) {
				return;
			}
			if (window.OC && window.OC.L10N && typeof window.OC.L10N.register === 'function') {
				window.OC.L10N.register('core', FR_OVERRIDES);
			}
		} catch (e) { /* traduction d'origine conservée */ }
	}

	/**
	 * Navigation de gauche : repliée par défaut sur écran d'ordinateur, et
	 * état mémorisé dans le navigateur (essai 17/09/2026). NcAppNavigation
	 * s'ouvre à l'initialisation (open = !isMobile) sans rien persister ;
	 * il écoute « toggle-navigation » sur le bus d'événements global
	 * (window._nc_event_bus) et annonce son état par « navigation-toggled »
	 * (au montage, puis 1,5 animation après chaque bascule). Le bus est
	 * créé PARESSEUSEMENT au premier abonnement : à DOMContentLoaded il
	 * peut ne pas exister (ordre perdu une fois sur deux, constaté). On
	 * attend donc l'apparition du panneau dans le DOM (son mounted a
	 * tourné : abonné, bus créé), ou tout de suite s'il est déjà là.
	 * Mémoire : localStorage NAV_STORAGE_KEY = '1' ouvert, '0' replié,
	 * enregistré à chaque « navigation-toggled » reçu APRÈS une
	 * interaction (pointerdown/keydown) ; absent = replié. Avant toute
	 * interaction, un « navigation-toggled » ouvert reçu alors que la
	 * mémoire dit replié est refermé (réouverture par NC pendant l'init).
	 * Activité embarque sa propre copie de @nextcloud/vue : mêmes
	 * événements, classe .app-navigation--closed (avec d) au lieu de
	 * --close : on lit les deux. Mobile (< 1024px) : NC gère. Fail-open.
	 * [VERIF] NcAppNavigation : .app-navigation, --close/--closed,
	 * événements toggle-navigation / navigation-toggled.
	 */
	var NAV_DESKTOP_MIN_WIDTH = 1024;
	var NAV_READY_WINDOW_MS = 4000;
	var NAV_STORAGE_KEY = 'nuage_dsfr.navigation.open';

	function readNavPreference() {
		try {
			return window.localStorage.getItem(NAV_STORAGE_KEY) === '1';
		} catch (e) {
			return false;
		}
	}

	function writeNavPreference(open) {
		try {
			window.localStorage.setItem(NAV_STORAGE_KEY, open ? '1' : '0');
		} catch (e) { /* stockage indisponible : replié à la prochaine page */ }
	}

	function isNavOpen(nav) {
		return !nav.classList.contains('app-navigation--close')
			&& !nav.classList.contains('app-navigation--closed');
	}

	function manageNavigation() {
		try {
			if (window.innerWidth < NAV_DESKTOP_MIN_WIDTH) {
				return;
			}
			var wantOpen = readNavPreference();
			var interacted = false;
			var bus = null;
			var observer = null;

			var onInteract = function () {
				interacted = true;
			};
			document.addEventListener('pointerdown', onInteract, { capture: true, once: true });
			document.addEventListener('keydown', onInteract, { capture: true, once: true });

			var onToggled = function (payload) {
				if (!payload || typeof payload.open !== 'boolean') {
					return;
				}
				if (interacted) {
					if (window.innerWidth >= NAV_DESKTOP_MIN_WIDTH) {
						writeNavPreference(payload.open);
					}
					return;
				}
				if (payload.open && !wantOpen && bus) {
					bus.emit('toggle-navigation', { open: false });
				}
			};

			var ready = function () {
				var nav = document.querySelector('#content-vue .app-navigation');
				bus = window._nc_event_bus || null;
				if (!nav || !bus || typeof bus.emit !== 'function' || typeof bus.subscribe !== 'function') {
					return false;
				}
				bus.subscribe('navigation-toggled', onToggled);
				if (!interacted && !wantOpen && isNavOpen(nav)) {
					bus.emit('toggle-navigation', { open: false });
				}
				return true;
			};

			if (!ready() && document.body) {
				observer = new MutationObserver(function () {
					if (ready() && observer) {
						observer.disconnect();
						observer = null;
					}
				});
				observer.observe(document.body, { childList: true, subtree: true });
				window.setTimeout(function () {
					if (observer) {
						observer.disconnect();
						observer = null;
					}
				}, NAV_READY_WINDOW_MS);
			}
		} catch (e) { /* navigation d'origine */ }
	}

	/**
	 * Vue « Partagés par lien » (/apps/files/sharinglinks) : colonne
	 * « Expire le » et action « Prolonger à 365 jours » (essai 17/09/2026).
	 * Politique nuage : expiration obligatoire, 365 jours au plus
	 * (shareapi_enforce_expire_date, shareapi_expire_after_n_days).
	 * Appuis, tous PRIVÉS (@nextcloud/files v4, objet global
	 * window._nc_files_scope.v4_0, à revérifier à chaque version majeure) :
	 *  - navigation.views : la vue sharinglinks, columns = tableau nu que
	 *    la liste relit à chaque rendu ; une colonne = {id, title,
	 *    render(node, view), sort(a, b)} ;
	 *  - view._view.getContents : enveloppé pour charger, en parallèle,
	 *    tous les partages sortants par lien (un seul GET OCS) : la vue
	 *    regroupe ses lignes PAR FICHIER (première entrée gardée), on
	 *    recalcule donc par fichier la liste des liens et l'expiration la
	 *    plus PROCHE, base du renouvellement ;
	 *  - fileActions : Map id -> action ; contexte v4 {nodes, view,
	 *    folder, contents} passé à enabled/displayName/iconSvgInline/
	 *    exec/execBatch/inline ; la liste met en cache getFileActions()
	 *    et se rafraîchit sur l'événement register:action du registry.
	 * Renouvellement : PUT OCS shares/{id} expireDate=aujourd'hui+365 sur
	 * CHAQUE lien du fichier, puis rechargement de la liste (voir
	 * refreshLinksListing). Fail-open partout : sans scope, vue native.
	 * [VERIF] _nc_files_scope.v4_0.{navigation,fileActions,registry},
	 * view._view, champs OCS file_source/expiration/share_type.
	 */
	var LINKS_VIEW_ID = 'sharinglinks';
	var LINKS_SCOPE_VERSION = 'v4_0';
	var LINKS_DAYS = 365;
	var LINKS_SOON_DAYS = 30;
	var LINKS_POLL_MS = 200;
	var LINKS_POLL_MAX_MS = 15000;
	var LINKS_COLUMN_ID = 'dsfr-expiration';
	var LINKS_ACTION_ID = 'dsfr-extend-links';
	var LINKS_ICON = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="currentColor" d="M19 3h-1V1h-2v2H8V1H6v2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2m0 16H5V8h14zM12 10.5a3.5 3.5 0 0 1 3.06 1.8l1.44-1.44V15h-4.14l1.5-1.5a1.98 1.98 0 0 0-1.86-1.3 2 2 0 0 0-2 2 2 2 0 0 0 2 2c.7 0 1.3-.36 1.66-.9l1.3.85A3.5 3.5 0 1 1 12 10.5"/></svg>';

	/* fileid -> { shares: [{id, expiration}], earliest: Date|null, undated: n } */
	var linkInfoByFileId = {};

	function filesScope() {
		var root = window._nc_files_scope;
		return root && root[LINKS_SCOPE_VERSION] ? root[LINKS_SCOPE_VERSION] : null;
	}

	function ocsSharesUrl(suffix) {
		var base = (window.OC && typeof window.OC.getRootPath === 'function') ? window.OC.getRootPath() : '';
		return base + '/ocs/v2.php/apps/files_sharing/api/v1/shares' + (suffix || '');
	}

	function ocsHeaders() {
		var h = { 'OCS-APIRequest': 'true', 'Accept': 'application/json' };
		if (window.OC && window.OC.requestToken) {
			h.requesttoken = window.OC.requestToken;
		}
		return h;
	}

	function parseOcsDate(value) {
		if (!value || typeof value !== 'string') {
			return null;
		}
		var d = new Date(value.replace(' ', 'T'));
		return isNaN(d.getTime()) ? null : d;
	}

	function formatDate(d) {
		try {
			return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
		} catch (e) {
			return d.toISOString().slice(0, 10);
		}
	}

	function daysUntil(d) {
		var today = new Date();
		today.setHours(0, 0, 0, 0);
		return Math.round((d.getTime() - today.getTime()) / 86400000);
	}

	function isoDateInDays(n) {
		var d = new Date();
		d.setHours(12, 0, 0, 0);
		d.setDate(d.getDate() + n);
		var m = String(d.getMonth() + 1), day = String(d.getDate());
		return d.getFullYear() + '-' + (m.length < 2 ? '0' + m : m) + '-' + (day.length < 2 ? '0' + day : day);
	}

	function buildLinkInfo(entries) {
		var byFile = {};
		entries.forEach(function (e) {
			if (!e || Number(e.share_type) !== 3) {
				return;
			}
			var fileId = String(e.file_source || e.item_source || '');
			if (!fileId) {
				return;
			}
			var info = byFile[fileId] || (byFile[fileId] = { shares: [], earliest: null, undated: 0 });
			var exp = parseOcsDate(e.expiration);
			info.shares.push({ id: String(e.id), expiration: exp });
			if (exp) {
				if (!info.earliest || exp < info.earliest) {
					info.earliest = exp;
				}
			} else {
				info.undated += 1;
			}
		});
		return byFile;
	}

	function loadLinkInfo() {
		return window.fetch(ocsSharesUrl('?format=json&shared_with_me=false'), {
			credentials: 'same-origin',
			headers: ocsHeaders(),
		}).then(function (r) {
			if (!r.ok) {
				throw new Error('OCS ' + r.status);
			}
			return r.json();
		}).then(function (json) {
			var data = json && json.ocs && json.ocs.data;
			linkInfoByFileId = buildLinkInfo(Array.isArray(data) ? data : []);
			return linkInfoByFileId;
		});
	}

	function linkInfoOf(node) {
		if (!node) {
			return null;
		}
		var info = linkInfoByFileId[String(node.fileid)];
		if (info) {
			return info;
		}
		// Repli : attributs de la première entrée OCS recopiés par files_sharing.
		var attrs = node.attributes || {};
		var shareId = attrs['share-id'] || attrs.id;
		if (!shareId) {
			return null;
		}
		var exp = parseOcsDate(attrs.expiration);
		return { shares: [{ id: String(shareId), expiration: exp }], earliest: exp, undated: exp ? 0 : 1 };
	}

	function renderExpiration(node) {
		var el = document.createElement('span');
		el.className = 'dsfr-expiration';
		var info = linkInfoOf(node);
		if (!info || info.shares.length === 0) {
			el.textContent = '';
			return el;
		}
		var parts = [];
		if (info.earliest) {
			var days = daysUntil(info.earliest);
			el.textContent = formatDate(info.earliest);
			if (days < 0) {
				el.classList.add('dsfr-expiration--expired');
				parts.push('expiré');
			} else if (days <= LINKS_SOON_DAYS) {
				el.classList.add('dsfr-expiration--soon');
				parts.push('dans ' + days + ' jour' + (days > 1 ? 's' : ''));
			} else {
				parts.push('dans ' + days + ' jours');
			}
		} else {
			el.textContent = 'sans date';
			el.classList.add('dsfr-expiration--undated');
		}
		if (info.shares.length > 1) {
			parts.push(info.shares.length + ' liens, date la plus proche affichée');
		}
		if (info.undated > 0 && info.earliest) {
			parts.push(info.undated + ' lien' + (info.undated > 1 ? 's' : '') + ' sans date');
		}
		el.title = parts.join(' · ');
		return el;
	}

	function expirationSortKey(node) {
		var info = linkInfoOf(node);
		if (!info || !info.earliest) {
			return Number.MAX_SAFE_INTEGER;
		}
		return info.earliest.getTime();
	}

	function extendShare(shareId, isoDate) {
		return window.fetch(ocsSharesUrl('/' + encodeURIComponent(shareId) + '?format=json'), {
			method: 'PUT',
			credentials: 'same-origin',
			headers: Object.assign({ 'Content-Type': 'application/x-www-form-urlencoded' }, ocsHeaders()),
			body: 'expireDate=' + encodeURIComponent(isoDate),
		}).then(function (r) {
			return r.json().catch(function () { return null; }).then(function (json) {
				var meta = json && json.ocs && json.ocs.meta;
				if (!r.ok || !meta || Number(meta.statuscode) !== 200) {
					throw new Error((meta && meta.message) || ('OCS ' + r.status));
				}
				return true;
			});
		});
	}

	function toast(kind, message) {
		try {
			if (window.OCP && window.OCP.Toast && typeof window.OCP.Toast[kind] === 'function') {
				window.OCP.Toast[kind](message);
			}
		} catch (e) { /* silencieux */ }
	}

	function extendNodeLinks(node) {
		var info = linkInfoOf(node);
		if (!info || info.shares.length === 0) {
			return Promise.resolve(null);
		}
		var isoDate = isoDateInDays(LINKS_DAYS);
		var name = node.displayname || node.basename || '';
		return Promise.all(info.shares.map(function (sh) {
			return extendShare(sh.id, isoDate);
		})).then(function () {
			var d = new Date(isoDate + 'T12:00:00');
			info.shares.forEach(function (sh) { sh.expiration = d; });
			info.earliest = d;
			info.undated = 0;
			linkInfoByFileId[String(node.fileid)] = info;
			toast('success', (info.shares.length > 1 ? info.shares.length + ' liens prolongés' : 'Lien prolongé') + ' jusqu’au ' + formatDate(d) + ' : ' + name);
			return true;
		}, function (err) {
			toast('error', 'Prolongation impossible pour ' + name + ' : ' + (err && err.message ? err.message : 'erreur'));
			return false;
		});
	}

	function isLinksView(ctx) {
		return !!(ctx && ctx.view && ctx.view.id === LINKS_VIEW_ID);
	}

	var extendLinksAction = {
		id: LINKS_ACTION_ID,
		order: -10,
		displayName: function () { return 'Prolonger à ' + LINKS_DAYS + ' jours'; },
		title: function (ctx) {
			var n = ctx && ctx.nodes ? ctx.nodes.length : 0;
			return n > 1 ? 'Prolonger les liens de ' + n + ' fichiers à ' + LINKS_DAYS + ' jours' : 'Prolonger tous les liens de ce fichier à ' + LINKS_DAYS + ' jours';
		},
		iconSvgInline: function () { return LINKS_ICON; },
		enabled: function (ctx) {
			if (!isLinksView(ctx) || !ctx.nodes || ctx.nodes.length === 0) {
				return false;
			}
			return ctx.nodes.every(function (n) { var i = linkInfoOf(n); return !!(i && i.shares.length); });
		},
		inline: function (ctx) { return isLinksView(ctx); },
		exec: function (ctx) {
			return extendNodeLinks(ctx.nodes[0]).then(function (ok) {
				refreshLinksListing(ctx);
				return ok;
			});
		},
		execBatch: function (ctx) {
			return Promise.all(ctx.nodes.map(extendNodeLinks)).then(function (results) {
				refreshLinksListing(ctx);
				return results;
			});
		},
	};

	/* La cellule d'une colonne personnalisée (CustomElementRender) n'est
	   repeinte que si le nœud change ; nos dates vivent à côté du nœud.
	   Rechargement de la liste : FilesList.onUpdatedNode relance
	   fetchContent quand le nœud annoncé est le DOSSIER courant (celui du
	   contexte d'action ; dans cette vue, un Folder d'id 0), ce qui rejoue
	   getContents enveloppé, donc l'appel OCS des liens, et repeint toutes
	   les lignes. Une seule fois par action, après le dernier PUT. */
	function refreshLinksListing(ctx) {
		try {
			var bus = window._nc_event_bus;
			if (ctx && ctx.folder && bus && typeof bus.emit === 'function') {
				bus.emit('files:node:updated', ctx.folder);
			}
		} catch (e) { /* la liste se repeindra au prochain chargement */ }
	}

	var expirationColumn = {
		id: LINKS_COLUMN_ID,
		title: 'Expire le',
		render: function (node) { return renderExpiration(node); },
		sort: function (a, b) { return expirationSortKey(a) - expirationSortKey(b); },
	};

	function registerLinksAction(scope) {
		if (!scope.fileActions) {
			scope.fileActions = new Map();
		}
		if (scope.fileActions.has(LINKS_ACTION_ID)) {
			return;
		}
		scope.fileActions.set(LINKS_ACTION_ID, extendLinksAction);
		try {
			var reg = scope.registry;
			if (reg && typeof reg.dispatchTypedEvent === 'function') {
				reg.dispatchTypedEvent('register:action', new CustomEvent('register:action', { detail: extendLinksAction }));
			} else if (reg && typeof reg.dispatchEvent === 'function') {
				reg.dispatchEvent(new CustomEvent('register:action', { detail: extendLinksAction }));
			}
		} catch (e) { /* la liste relira le registre au prochain montage */ }
	}

	function decorateLinksView(view) {
		if (!view || !Array.isArray(view.columns)) {
			return false;
		}
		if (!view.columns.some(function (c) { return c && c.id === LINKS_COLUMN_ID; })) {
			view.columns.push(expirationColumn);
		}
		var inner = view._view;
		if (inner && typeof inner.getContents === 'function' && !inner.__dsfrLinksWrapped) {
			var original = inner.getContents;
			inner.getContents = function () {
				var args = arguments;
				return Promise.all([
					original.apply(this, args),
					loadLinkInfo().catch(function () { return null; }),
				]).then(function (results) { return results[0]; });
			};
			inner.__dsfrLinksWrapped = true;
		}
		return true;
	}

	function setupLinksView() {
		try {
			if (!document.body || document.body.id !== 'body-user') {
				return;
			}
			var started = Date.now();
			var timer = window.setInterval(function () {
				try {
					var scope = filesScope();
					if (scope) {
						registerLinksAction(scope);
						var nav = scope.navigation;
						var views = nav && nav.views;
						if (Array.isArray(views)) {
							var view = views.find(function (v) { return v && v.id === LINKS_VIEW_ID; });
							if (view && decorateLinksView(view)) {
								window.clearInterval(timer);
								return;
							}
						}
					}
				} catch (e) {
					window.clearInterval(timer);
					return;
				}
				if (Date.now() - started > LINKS_POLL_MAX_MS) {
					window.clearInterval(timer);
				}
			}, LINKS_POLL_MS);
		} catch (e) { /* vue native */ }
	}

	function onDomReady() {
		overrideTranslations();
		manageNavigation();
		setupLinksView();
	}

	function start() {
		if (document.readyState === 'loading') {
			document.addEventListener('DOMContentLoaded', onDomReady);
		} else {
			onDomReady();
		}
		if (apply()) {
			return;
		}
		// Chargé en async depuis le <head> (TemplateListener) : l'exécution
		// peut précéder la matérialisation du body. On observe le document
		// PENDANT son analyse : l'état initial précède #header dans le
		// flux, la nav se construit donc dès l'apparition de l'en-tête,
		// sans attendre les bundles Vue. Borné dans le temps.
		var root = document.getElementById('header') || document.body || document.documentElement;
		var observer = new MutationObserver(function () {
			if (apply()) {
				observer.disconnect();
			}
		});
		observer.observe(root, { childList: true, subtree: true });
		window.setTimeout(function () {
			observer.disconnect();
		}, OBSERVE_TIMEOUT_MS);
	}

	start();
})();
