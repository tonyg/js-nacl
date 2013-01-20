TARGET=nacl.js
NACLVERSION=20110221
NACLUNPACKED=nacl-$(NACLVERSION)

PYTHON=python
EMCC=`which emcc`

all: $(TARGET)

$(TARGET): subnacl
	$(PYTHON) $(EMCC) \
		-s LINKABLE=1 \
		-s EXPORTED_FUNCTIONS="$$(cat subnacl/naclexports.sh)" \
		-O2 -o $@ $$(find subnacl -name '*.c') -I subnacl/include

clean:
	rm -f $(TARGET)

veryclean: clean
	rm -rf subnacl
	rm -rf $(NACLUNPACKED)

subnacl: import.py $(NACLUNPACKED)
	python import.py $(NACLUNPACKED)

$(NACLUNPACKED): $(NACLUNPACKED).tar.bz2
	tar -jxvf $<
