NACLRAW=nacl_raw.js
NACLVERSION=20110221
NACLUNPACKED=nacl-$(NACLVERSION)

PYTHON=python
EMCC=`which emcc`

all: node browser

$(NACLRAW): subnacl
	$(PYTHON) $(EMCC) \
		-s LINKABLE=1 \
		-s EXPORTED_FUNCTIONS="$$(cat subnacl/naclexports.sh)" \
		--js-library nacl_randombytes_node.js \
		--post-js subnacl/naclapi.js \
		-O1 --closure 1 -o $@ \
		-I subnacl/include \
		keys.c \
		$$(find subnacl -name '*.c')

clean:
	rm -f $(NACLRAW)
	rm -rf node browser

node: $(NACLRAW) nacl_node_prefix.js nacl_cooked.js nacl_node_suffix.js
	mkdir -p $@
	cp $(NACLRAW) $@
	cat nacl_node_prefix.js nacl_cooked.js nacl_node_suffix.js > $@/nacl.js

browser: $(NACLRAW) nacl_browser_prefix.js nacl_cooked.js nacl_browser_suffix.js
	mkdir -p $@
	cat nacl_browser_prefix.js $(NACLRAW) nacl_cooked.js nacl_browser_suffix.js > $@/nacl.js

veryclean: clean
	rm -rf subnacl
	rm -rf $(NACLUNPACKED)

subnacl: import.py
	tar -jxvf $(NACLUNPACKED).tar.bz2
	python import.py $(NACLUNPACKED)
