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

	function start() {
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
