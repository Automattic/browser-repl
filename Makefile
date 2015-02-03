
# apps
NODE ?= node
BROWSERIFY ?= $(NODE) ./node_modules/.bin/browserify

build: static/build.js

static/build.js: client.js package.json
	mkdir -p static
	$(BROWSERIFY) $< > $@

clean:
	rm static/build.js

.PHONY: build clean
