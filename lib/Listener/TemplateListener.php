<?php

declare(strict_types=1);

/**
 * Injection des ressources DSFR :
 *  - CSS partout (mire de connexion comprise : les règles y sont scopées
 *    body#body-login, sans effet ailleurs) ;
 *  - JS structurel en session et sur les pages publiques (partages) :
 *    bloc-marque + intitulé de service partout où un #nextcloud existe ;
 *    la nav textuelle (rangée 2) ne se construit que si un menu
 *    d'applications est présent, donc jamais côté public (fail-open).
 *    La mire, elle, n'a ni menu ni bloc-marque à transformer : CSS seul.
 *
 * Le versioning de l'app (info.xml) sert de cache-busting : chaque bump de
 * version invalide les URL css/js chez les clients.
 */

namespace OCA\NuageDsfr\Listener;

use OCA\NuageDsfr\AppInfo\Application;
use OCP\AppFramework\Http\Events\BeforeLoginTemplateRenderedEvent;
use OCP\AppFramework\Http\Events\BeforeTemplateRenderedEvent;
use OCP\EventDispatcher\Event;
use OCP\EventDispatcher\IEventListener;
use OCP\Util;

/**
 * @template-implements IEventListener<BeforeTemplateRenderedEvent|BeforeLoginTemplateRenderedEvent>
 */
class TemplateListener implements IEventListener {
	public function handle(Event $event): void {
		if ($event instanceof BeforeLoginTemplateRenderedEvent) {
			$this->addFontPreloads();
			Util::addStyle(Application::APP_ID, 'dsfr');
			return;
		}

		if ($event instanceof BeforeTemplateRenderedEvent) {
			$this->addFontPreloads();
			Util::addStyle(Application::APP_ID, 'dsfr');
			$this->addEarlyScript();
			if ($event->isLoggedIn()) {
				// Couche fonctionnelle (verrous d'exploitation) : en session
				// uniquement — ses cibles (settings, corbeille) n'existent
				// pas sur les pages publiques.
				Util::addStyle(Application::APP_ID, 'functional');
			}
		}
	}

	/**
	 * dsfr-header.js en <script async> depuis le <head>, plutôt que via
	 * Util::addScript : la file addScript est différée et s'exécute APRÈS
	 * les bundles Vue (plusieurs centaines de ms), laissant l'en-tête à
	 * moitié vide entre deux pages. En async, le script (petit, en cache)
	 * s'exécute pendant l'analyse du document et construit bloc-marque,
	 * intitulé et nav dès l'apparition de #header. La CSP des pages
	 * applicatives contient 'strict-dynamic' : 'self' y est ignoré, le
	 * NONCE est indispensable (vérifié : sans lui, script bloqué). Le
	 * gestionnaire de nonce n'a pas d'API publique [VERIF] : repli
	 * fail-open sur la file addScript (différée, plus tardive) si la
	 * classe privée bouge. Le ?v= reprend le cache-busting par version
	 * d'app d'addScript.
	 */
	private function addEarlyScript(): void {
		try {
			$nonce = \OCP\Server::get(\OC\Security\CSP\ContentSecurityPolicyNonceManager::class)
				->getNonce();
			$version = \OCP\Server::get(\OCP\App\IAppManager::class)
				->getAppVersion(Application::APP_ID);
			$url = \OCP\Server::get(\OCP\IURLGenerator::class)
				->linkTo(Application::APP_ID, 'js/dsfr-header.js') . '?v=' . urlencode($version);
			Util::addHeader('script', [
				'src' => $url,
				'async' => 'async',
				'nonce' => $nonce,
			], '');
		} catch (\Throwable $e) {
			Util::addScript(Application::APP_ID, 'dsfr-header');
		}
	}

	/**
	 * Préchargement des Marianne pour génération du logo
	 */
	private function addFontPreloads(): void {
		foreach (['Marianne-Regular', 'Marianne-Medium', 'Marianne-Bold'] as $font) {
			Util::addHeader('link', [
				'rel' => 'preload',
				'href' => '/themes/nuage/fonts/' . $font . '.woff2',
				'as' => 'font',
				'type' => 'font/woff2',
				'crossorigin' => 'anonymous',
			]);
		}
	}
}
