
# apps
NODE ?= node
NPM ?= npm
BROWSERIFY ?= $(NODE) ./node_modules/.bin/browserify

build: static/build.js

node_modules: package.json
	$(NPM) install

static/build.js: client.js node_modules
	mkdir -p static
	$(BROWSERIFY) $< > $@

clean:
	rm static/build.js

.PHONY: install build clean
