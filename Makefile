TARGET=nacl_raw.js
NACLVERSION=20110221
NACLUNPACKED=nacl-$(NACLVERSION)

PYTHON=python
EMCC=`which emcc`

all: $(TARGET)

$(TARGET): subnacl
	$(PYTHON) $(EMCC) \
		-s LINKABLE=1 \
		-s EXPORTED_FUNCTIONS="$$(cat subnacl/naclexports.sh)" \
		--js-library nacl_randombytes_node.js \
		--post-js subnacl/naclapi.js \
		-O1 -o $@ \
		-I subnacl/include \
		keys.c \
		$$(find subnacl -name '*.c')

clean:
	rm -f $(TARGET)

veryclean: clean
	rm -rf subnacl
	rm -rf $(NACLUNPACKED)

subnacl: import.py
	tar -jxvf $(NACLUNPACKED).tar.bz2
	python import.py $(NACLUNPACKED)
