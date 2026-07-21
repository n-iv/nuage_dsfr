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
			Util::addScript(Application::APP_ID, 'dsfr-header');
			if ($event->isLoggedIn()) {
				// Couche fonctionnelle (verrous d'exploitation) : en session
				// uniquement — ses cibles (settings, corbeille) n'existent
				// pas sur les pages publiques.
				Util::addStyle(Application::APP_ID, 'functional');
			}
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
