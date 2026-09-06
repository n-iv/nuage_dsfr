# nuage_dsfr : archive de déploiement au format appstore Nextcloud
# (<app_id>/ à la racine de l'archive), sans dépendance ni build.
#
#   make dist          -> build/nuage_dsfr-v<version>.tar.gz
#   make deploy-local  -> copie l'archive dans ../appli/apps/ (pose Ansible,
#                         rôle nc-apps-local, version épinglée dans pinned_apps)
#   make sign          -> signature appstore (clé ~/.nextcloud/certificates/)
#   make lint          -> php -l sur les sources
#
# La version est celle de appinfo/info.xml : la bumper là, nulle part ailleurs.

app_name  = nuage_dsfr
version  := $(shell grep -oPm1 '(?<=<version>)[^<]+' appinfo/info.xml)
build_dir = build
stage_dir = $(build_dir)/stage
archive   = $(build_dir)/$(app_name)-v$(version).tar.gz
appli_dir = ../appli/apps
cert_dir  = $(HOME)/.nextcloud/certificates

.PHONY: all dist deploy-local sign lint clean version

all: dist

version:
	@echo $(version)

lint:
	@for f in $$(find lib -name '*.php'); do php -l $$f >/dev/null || exit 1; done
	@echo "lint OK"

dist: clean lint
	mkdir -p $(stage_dir)
	rsync -a \
		--exclude=/.git \
		--exclude=/.gitignore \
		--exclude=/.gitlab-ci.yml \
		--exclude=/build \
		--exclude=/Makefile \
		--exclude=/publiccode.yml \
		./ $(stage_dir)/$(app_name)/
	tar -czf $(archive) -C $(stage_dir) $(app_name)
	rm -rf $(stage_dir)
	@echo "$(archive)"

deploy-local: dist
	@test -d $(appli_dir) || { echo "$(appli_dir) introuvable"; exit 1; }
	cp $(archive) $(appli_dir)/
	@echo "$(appli_dir)/$(notdir $(archive)) : épingler $(version) dans pinned_apps (config/inventories/group_vars/all/versions.yml)"

sign: dist
	@test -f $(cert_dir)/$(app_name).key || { echo "clé absente : $(cert_dir)/$(app_name).key"; exit 1; }
	openssl dgst -sha512 -sign $(cert_dir)/$(app_name).key $(archive) | openssl base64

clean:
	rm -rf $(build_dir)
