<?php

declare(strict_types=1);

/**
 * Injection des ressources DSFR :
 *  - CSS partout (mire de connexion comprise : les règles y sont scopées
 *    body#body-login, sans effet ailleurs) ;
 *  - JS structurel (en-tête deux rangées) uniquement en session : la mire
 *    n'a ni menu d'applications ni bloc-marque à transformer.
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
			if ($event->isLoggedIn()) {
				// Couche fonctionnelle (verrous d'exploitation) : en session
				// uniquement — ses cibles (settings, corbeille) n'existent
				// pas sur les pages publiques.
				Util::addStyle(Application::APP_ID, 'functional');
				Util::addScript(Application::APP_ID, 'dsfr-header');
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
