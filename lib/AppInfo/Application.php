<?php

declare(strict_types=1);

/**
 * Application nuage_dsfr : vecteur d'injection de l'habillage DSFR.
 *
 * Rôle volontairement minimal : enregistrer un listener sur les deux
 * événements de rendu de template (pages connectées + mire de connexion).
 * Toute la logique visuelle vit dans css/dsfr.css et js/dsfr-header.js.
 */

namespace OCA\NuageDsfr\AppInfo;

use OCA\NuageDsfr\Listener\TemplateListener;
use OCP\AppFramework\App;
use OCP\AppFramework\Bootstrap\IBootContext;
use OCP\AppFramework\Bootstrap\IBootstrap;
use OCP\AppFramework\Bootstrap\IRegistrationContext;
use OCP\AppFramework\Http\Events\BeforeLoginTemplateRenderedEvent;
use OCP\AppFramework\Http\Events\BeforeTemplateRenderedEvent;

class Application extends App implements IBootstrap {
	public const APP_ID = 'nuage_dsfr';

	public function __construct() {
		parent::__construct(self::APP_ID);
	}

	public function register(IRegistrationContext $context): void {
		$context->registerEventListener(
			BeforeTemplateRenderedEvent::class,
			TemplateListener::class
		);
		$context->registerEventListener(
			BeforeLoginTemplateRenderedEvent::class,
			TemplateListener::class
		);
	}

	public function boot(IBootContext $context): void {
		// Rien : pas d'état, pas de base, pas de réglages. Un vecteur.
	}
}
