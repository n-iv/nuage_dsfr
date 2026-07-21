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
		// local. Sur les pages publiques #nextcloud est un simple div :
		// pas de lien à réécrire.
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
	 * Construit la navigation textuelle en lisant le menu Vue existant.
	 * Retourne true si la nav est en place et peuplée.
	 */
	function buildNav() {
		if (document.querySelector('nav.' + NAV_CLASS)) {
			return true;
		}
		var header = document.getElementById('header');
		if (!header) {
			return false;
		}
		var entries = header.querySelectorAll('.app-menu .app-menu-entry');
		if (entries.length === 0) {
			return false;
		}

		var nav = document.createElement('nav');
		nav.className = NAV_CLASS;
		nav.setAttribute('aria-label', 'Applications');

		var built = 0;
		entries.forEach(function (li) {
			var a = li.querySelector('a');
			if (!a || !a.href) {
				return;
			}
			var excluded = EXCLUDED_APP_PATHS.some(function (p) {
				return a.href.indexOf(p) !== -1;
			});
			if (excluded) {
				return;
			}
			var text = entryLabel(li, a);
			if (text === '') {
				return;
			}
			var item = document.createElement('a');
			item.className = 'dsfr-nav__item';
			item.href = a.href;
			item.textContent = text;
			if (li.classList.contains('app-menu-entry--active')) {
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

	function apply() {
		var navDone = false;
		try {
			// Bloc-marque et intitulé : indépendants de la nav : ils ne
			// dépendent que du lien d'accueil, présent dès le rendu serveur.
			buildBlocMarque();
			buildServiceTitle();
			if (buildNav()) {
				document.body.classList.add(READY_CLASS);
				navDone = true;
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
		// Le menu d'applications est rendu par Vue après DOMContentLoaded :
		// on observe le header jusqu'à sa matérialisation, borné dans le temps.
		var header = document.getElementById('header') || document.body;
		var observer = new MutationObserver(function () {
			if (apply()) {
				observer.disconnect();
			}
		});
		observer.observe(header, { childList: true, subtree: true });
		window.setTimeout(function () {
			observer.disconnect();
		}, OBSERVE_TIMEOUT_MS);
	}

	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', start);
	} else {
		start();
	}
})();
