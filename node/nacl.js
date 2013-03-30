var nacl_raw = require("./nacl_raw.js").Module;
nacl_raw.RandomBytes.crypto = require('crypto');

this.random_bytes = function (count) {
    return nacl_raw.RandomBytes.crypto.randomBytes(count);
};
var nacl = (function () {
    var exports = {};

    //---------------------------------------------------------------------------
    // Horrifying UTF-8 and hex codecs

    function encode_utf8(s) {
	var encoded = unescape(encodeURIComponent(s));
	var result = new Uint8Array(encoded.length);
	for (var i = 0; i < encoded.length; i++) {
	    result[i] = encoded.charCodeAt(i);
	}
	return result;
    }

    function decode_utf8(bs) {
	var encoded = [];
	for (var i = 0; i < bs.length; i++) {
	    encoded.push(String.fromCharCode(bs[i]));
	}
	return decodeURIComponent(escape(encoded.join('')));
    }

    function to_hex(bs) {
	var encoded = [];
	for (var i = 0; i < bs.length; i++) {
	    encoded.push("0123456789abcdef"[(bs[i] >> 4) & 15]);
	    encoded.push("0123456789abcdef"[bs[i] & 15]);
	}
	return encoded.join('');
    }

    //---------------------------------------------------------------------------

    function injectBytes(bs, leftPadding) {
	var p = leftPadding || 0;
	var address = nacl_raw._malloc(bs.length + p);
	nacl_raw.HEAPU8.set(bs, address + p);
	for (var i = address; i < address + p; i++) {
	    nacl_raw.HEAPU8[i] = 0;
	}
	return address;
    }

    function check_injectBytes(function_name, what, thing, expected_length, leftPadding) {
	check_length(function_name, what, thing, expected_length);
	return injectBytes(thing, leftPadding);
    }

    function extractBytes(address, length) {
	var result = new Uint8Array(length);
	result.set(nacl_raw.HEAPU8.subarray(address, address + length));
	return result;
    }

    //---------------------------------------------------------------------------

    function check(function_name, result) {
	if (result !== 0) {
	    throw {message: "nacl_raw." + function_name + " signalled an error"};
	}
    }

    function check_length(function_name, what, thing, expected_length) {
	if (thing.length !== expected_length) {
	    throw {message: "nacl." + function_name + " expected " +
	           expected_length + "-byte " + what + " but got length " + thing.length};
	}
    }

    function Target(length) {
	this.length = length;
	this.address = nacl_raw._malloc(length);
    }

    Target.prototype.extractBytes = function (offset) {
	var result = extractBytes(this.address + (offset || 0), this.length - (offset || 0));
	nacl_raw._free(this.address);
	this.address = null;
	return result;
    };

    function free_all(addresses) {
	for (var i = 0; i < addresses.length; i++) {
	    nacl_raw._free(addresses[i]);
	}
    }

    //---------------------------------------------------------------------------
    // Boxing

    function crypto_box_keypair() {
	var pk = new Target(nacl_raw._crypto_box_PUBLICKEYBYTES);
	var sk = new Target(nacl_raw._crypto_box_SECRETKEYBYTES);
	check("_crypto_box_keypair", nacl_raw._crypto_box_keypair(pk.address, sk.address));
	return {boxPk: pk.extractBytes(), boxSk: sk.extractBytes()};
    }

    function crypto_box_random_nonce() {
	return nacl_raw.RandomBytes.crypto.randomBytes(nacl_raw._crypto_box_NONCEBYTES);
    }

    function crypto_box(msg, nonce, pk, sk) {
	var m = injectBytes(msg, nacl_raw._crypto_box_ZEROBYTES);
	var na = check_injectBytes("crypto_box", "nonce", nonce, nacl_raw._crypto_box_NONCEBYTES);
	var pka = check_injectBytes("crypto_box", "pk", pk, nacl_raw._crypto_box_PUBLICKEYBYTES);
	var ska = check_injectBytes("crypto_box", "sk", sk, nacl_raw._crypto_box_SECRETKEYBYTES);
	var c = new Target(msg.length + nacl_raw._crypto_box_ZEROBYTES);
	check("_crypto_box", nacl_raw._crypto_box(c.address, m, c.length, 0, na, pka, ska));
	free_all([na, pka, ska]);
	return c.extractBytes(nacl_raw._crypto_box_BOXZEROBYTES);
    }

    function crypto_box_open(ciphertext, nonce, pk, sk) {
	var c = injectBytes(ciphertext, nacl_raw._crypto_box_BOXZEROBYTES);
	var na = check_injectBytes("crypto_box", "nonce", nonce, nacl_raw._crypto_box_NONCEBYTES);
	var pka = check_injectBytes("crypto_box", "pk", pk, nacl_raw._crypto_box_PUBLICKEYBYTES);
	var ska = check_injectBytes("crypto_box", "sk", sk, nacl_raw._crypto_box_SECRETKEYBYTES);
	var m = new Target(ciphertext.length + nacl_raw._crypto_box_BOXZEROBYTES);
	check("_crypto_box_open", nacl_raw._crypto_box_open(m.address, c, m.length, 0, na, pka, ska));
	free_all([na, pka, ska]);
	return m.extractBytes(nacl_raw._crypto_box_ZEROBYTES);
    }

    //---------------------------------------------------------------------------
    // Hashing

    function crypto_hash(bs) {
	var address = injectBytes(bs);
	var hash = new Target(nacl_raw._crypto_hash_BYTES);
	check("_crypto_hash", nacl_raw._crypto_hash(hash.address, address, bs.length, 0));
	nacl_raw._free(address);
	return hash.extractBytes();
    }

    function crypto_hash_string(s) {
	return crypto_hash(encode_utf8(s));
    }

    //---------------------------------------------------------------------------
    // Symmetric-key encryption

    //---------------------------------------------------------------------------
    // One-time authentication

    //---------------------------------------------------------------------------
    // Authentication

    //---------------------------------------------------------------------------
    // Authenticated symmetric-key encryption

    //---------------------------------------------------------------------------
    // Signing

    //---------------------------------------------------------------------------
    // Keys

    function crypto_sign_keypair_from_seed(bs) {
	// Hash the bytes to get a secret key. This will be MODIFIED IN
	// PLACE by the call to crypto_sign_keypair_from_raw_sk below.
	var hash = new Uint8Array(crypto_hash(bs));
	var ska = injectBytes(hash.subarray(0, nacl_raw._crypto_sign_SECRETKEYBYTES));
	var pk = new Target(nacl_raw._crypto_sign_PUBLICKEYBYTES);
	check("_crypto_sign_keypair_from_raw_sk",
	      nacl_raw._crypto_sign_keypair_from_raw_sk(pk.address, ska));
	var sk = extractBytes(ska, nacl_raw._crypto_sign_SECRETKEYBYTES);
	nacl_raw._free(ska);
	return {signPk: pk.extractBytes(), signSk: sk};
    }

    function crypto_box_keypair_from_seed(bs) {
	var hash = new Uint8Array(crypto_hash(bs));
	var ska = injectBytes(hash.subarray(0, nacl_raw._crypto_box_SECRETKEYBYTES));
	var pk = new Target(nacl_raw._crypto_box_PUBLICKEYBYTES);
	check("_crypto_scalarmult_curve25519_base",
	      nacl_raw._crypto_scalarmult_curve25519_base(pk.address, ska));
	var sk = extractBytes(ska, nacl_raw._crypto_box_SECRETKEYBYTES);
	nacl_raw._free(ska);
	return {boxPk: pk.extractBytes(), boxSk: sk};
    }

    //---------------------------------------------------------------------------

    exports.encode_utf8 = encode_utf8;
    exports.decode_utf8 = decode_utf8;
    exports.to_hex = to_hex;

    exports.crypto_box_keypair = crypto_box_keypair;
    exports.crypto_box_random_nonce = crypto_box_random_nonce;
    exports.crypto_box = crypto_box;
    exports.crypto_box_open = crypto_box_open;

    exports.crypto_hash = crypto_hash;
    exports.crypto_hash_string = crypto_hash_string;

    exports.crypto_sign_keypair_from_seed = crypto_sign_keypair_from_seed;
    exports.crypto_box_keypair_from_seed = crypto_box_keypair_from_seed;

    return exports;
})();
(function (exports) {
    for (var k in nacl) {
	exports[k] = nacl[k];
    }
})(this);
