LIBSODIUMVERSION=1.0.10
LIBSODIUMUNPACKED=libsodium-$(LIBSODIUMVERSION)

LIBSODIUM_JS=$(LIBSODIUMUNPACKED)/libsodium-js/lib/libsodium.js

test: all
	npm test

## Builds well with emscripten SDK 1.36.4.
all: lib

clean:
	rm -rf lib

$(LIBSODIUM_JS): $(LIBSODIUMUNPACKED)
	(cd libsodium-1.0.10; ./dist-build/emscripten.sh --sumo)

lib: $(LIBSODIUM_JS) nacl_cooked_prefix.js nacl_cooked.js nacl_cooked_suffix.js
	mkdir -p $@
	cat nacl_cooked_prefix.js $(LIBSODIUM_JS) nacl_cooked.js nacl_cooked_suffix.js \
		> $@/nacl_factory.js

veryclean: clean
	rm -rf subnacl
	rm -rf $(LIBSODIUMUNPACKED)

$(LIBSODIUMUNPACKED): libsodium-$(LIBSODIUMVERSION).tar.gz
	tar -zxvf $<
