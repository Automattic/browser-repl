
# apps
NODE ?= node
NPM ?= npm
BROWSERIFY ?= $(NODE) ./node_modules/.bin/browserify

build: install static/build.js

install:
	$(NPM) install

static/build.js: client.js package.json
	mkdir -p static
	$(BROWSERIFY) $< > $@

clean:
	rm static/build.js

.PHONY: install build clean
