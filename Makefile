
# apps
NODE ?= node
BROWSERIFY ?= $(NODE) ./node_modules/.bin/browserify

static/build.js: client.js
	$(BROWSERIFY) < $< > $@

clean:
	rm static/build.js

.PHONY: clean
