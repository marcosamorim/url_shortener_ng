.DEFAULT_GOAL := help

NPM ?= npm

.PHONY: help install dev start build watch test clean bump-patch bump-minor bump-major

help:
	@echo "Common commands:"
	@echo "  make install     - install dependencies"
	@echo "  make dev         - start Angular dev server"
	@echo "  make start       - start SSR server (node server.cjs)"
	@echo "  make build       - build production bundle"
	@echo "  make watch       - build in watch mode (development)"
	@echo "  make test        - run unit tests"
	@echo "  make clean       - remove build/cache artifacts"
	@echo "  make bump-patch  - npm version patch (commit + tag)"
	@echo "  make bump-minor  - npm version minor (commit + tag)"
	@echo "  make bump-major  - npm version major (commit + tag)"

install:
	$(NPM) install

dev:
	$(NPM) run start:dev

start:
	$(NPM) run start

build:
	$(NPM) run build

watch:
	$(NPM) run watch

test:
	$(NPM) run test

clean:
	rm -rf dist .angular/cache

bump-patch:
	$(NPM) version patch

bump-minor:
	$(NPM) version minor

bump-major:
	$(NPM) version major
