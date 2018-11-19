LIBSODIUMVERSION=stable-2018-11-19
LIBSODIUMUNPACKED=libsodium-stable

LIBSODIUM_JS=$(LIBSODIUMUNPACKED)/libsodium-js-sumo/lib/libsodium.js

test: all
	npm test

## Builds well with emscripten SDK 1.36.4.
all: lib

clean:
	rm -rf lib

$(LIBSODIUM_JS): $(LIBSODIUMUNPACKED)
	docker run --rm \
		-v $$(pwd)/$(LIBSODIUMUNPACKED):/src \
		--user $$(id -u):$$(id -g) \
		trzeci/emscripten \
		/src/dist-build/emscripten.sh --sumo
	[ -f $@ ] && touch $@

lib: $(LIBSODIUM_JS) nacl_cooked_prefix.js nacl_cooked.js nacl_cooked_suffix.js
	mkdir -p $@
	cat nacl_cooked_prefix.js $(LIBSODIUM_JS) nacl_cooked.js nacl_cooked_suffix.js \
		> $@/nacl_factory.js

veryclean: clean
	rm -rf subnacl
	rm -rf $(LIBSODIUMUNPACKED)

$(LIBSODIUMUNPACKED): libsodium-$(LIBSODIUMVERSION).tar.gz
	tar -zxvf $<
	patch -p0 < libsodium-memory-configuration.patch

.PRECIOUS: $(LIBSODIUM_JS)
