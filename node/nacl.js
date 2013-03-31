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
	return encode_latin1(unescape(encodeURIComponent(s)));
    }

    function encode_latin1(s) {
	var result = new Uint8Array(s.length);
	for (var i = 0; i < s.length; i++) {
	    var c = s.charCodeAt(i);
	    if ((c & 0xff) !== c) throw {message: "Cannot encode string in Latin1", str: s};
	    result[i] = (c & 0xff);
	}
	return result;
    }

    function decode_utf8(bs) {
	return decodeURIComponent(escape(decode_latin1(bs)));
    }

    function decode_latin1(bs) {
	var encoded = [];
	for (var i = 0; i < bs.length; i++) {
	    encoded.push(String.fromCharCode(bs[i]));
	}
	return encoded.join('');
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
	free_all([m, na, pka, ska]);
	return c.extractBytes(nacl_raw._crypto_box_BOXZEROBYTES);
    }

    function crypto_box_open(ciphertext, nonce, pk, sk) {
	var c = injectBytes(ciphertext, nacl_raw._crypto_box_BOXZEROBYTES);
	var na = check_injectBytes("crypto_box_open",
				   "nonce", nonce, nacl_raw._crypto_box_NONCEBYTES);
	var pka = check_injectBytes("crypto_box_open",
				    "pk", pk, nacl_raw._crypto_box_PUBLICKEYBYTES);
	var ska = check_injectBytes("crypto_box_open",
				    "sk", sk, nacl_raw._crypto_box_SECRETKEYBYTES);
	var m = new Target(ciphertext.length + nacl_raw._crypto_box_BOXZEROBYTES);
	check("_crypto_box_open", nacl_raw._crypto_box_open(m.address, c, m.length, 0, na, pka, ska));
	free_all([c, na, pka, ska]);
	return m.extractBytes(nacl_raw._crypto_box_ZEROBYTES);
    }

    function crypto_box_precompute(pk, sk) {
	var pka = check_injectBytes("crypto_box_precompute",
				    "pk", pk, nacl_raw._crypto_box_PUBLICKEYBYTES);
	var ska = check_injectBytes("crypto_box_precompute",
				    "sk", sk, nacl_raw._crypto_box_SECRETKEYBYTES);
	var k = new Target(nacl_raw._crypto_box_BEFORENMBYTES);
	check("_crypto_box_beforenm",
	      nacl_raw._crypto_box_beforenm(k.address, pka, ska));
	free_all([pka, ska]);
	return {boxK: k.extractBytes()};
    }

    function crypto_box_precomputed(msg, nonce, state) {
	var m = injectBytes(msg, nacl_raw._crypto_box_ZEROBYTES);
	var na = check_injectBytes("crypto_box_precomputed",
				   "nonce", nonce, nacl_raw._crypto_box_NONCEBYTES);
	var ka = check_injectBytes("crypto_box_precomputed",
				   "boxK", state.boxK, nacl_raw._crypto_box_BEFORENMBYTES);
	var c = new Target(msg.length + nacl_raw._crypto_box_ZEROBYTES);
	check("_crypto_box_afternm",
	      nacl_raw._crypto_box_afternm(c.address, m, c.length, 0, na, ka));
	free_all([m, na, ka]);
	return c.extractBytes(nacl_raw._crypto_box_BOXZEROBYTES);
    }

    function crypto_box_open_precomputed(ciphertext, nonce, state) {
	var c = injectBytes(ciphertext, nacl_raw._crypto_box_BOXZEROBYTES);
	var na = check_injectBytes("crypto_box_open_precomputed",
				   "nonce", nonce, nacl_raw._crypto_box_NONCEBYTES);
	var ka = check_injectBytes("crypto_box_open_precomputed",
				   "boxK", state.boxK, nacl_raw._crypto_box_BEFORENMBYTES);
	var m = new Target(ciphertext.length + nacl_raw._crypto_box_BOXZEROBYTES);
	check("_crypto_box_open_afternm",
	      nacl_raw._crypto_box_open_afternm(m.address, c, m.length, 0, na, ka));
	free_all([c, na, ka]);
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

    function crypto_stream_random_nonce() {
	return nacl_raw.RandomBytes.crypto.randomBytes(nacl_raw._crypto_stream_NONCEBYTES);
    }

    function crypto_stream(len, nonce, key) {
	var na = check_injectBytes("crypto_stream",
				   "nonce", nonce, nacl_raw._crypto_stream_NONCEBYTES);
	var ka = check_injectBytes("crypto_stream",
				   "key", key, nacl_raw._crypto_stream_KEYBYTES);
	var out = new Target(len);
	check("_crypto_stream", nacl_raw._crypto_stream(out.address, len, 0, na, ka));
	free_all([na, ka]);
	return out.extractBytes();
    }

    function crypto_stream_xor(msg, nonce, key) {
	var na = check_injectBytes("crypto_stream_xor",
				   "nonce", nonce, nacl_raw._crypto_stream_NONCEBYTES);
	var ka = check_injectBytes("crypto_stream_xor",
				   "key", key, nacl_raw._crypto_stream_KEYBYTES);
	var ma = injectBytes(msg);
	var out = new Target(msg.length);
	check("_crypto_stream_xor",
	      nacl_raw._crypto_stream_xor(out.address, ma, msg.length, 0, na, ka));
	free_all([na, ka, ma]);
	return out.extractBytes();
    }

    //---------------------------------------------------------------------------
    // One-time authentication

    function crypto_onetimeauth(msg, key) {
	var ka = check_injectBytes("crypto_onetimeauth",
				   "key", key, nacl_raw._crypto_onetimeauth_KEYBYTES);
	var ma = injectBytes(msg);
	var authenticator = new Target(nacl_raw._crypto_onetimeauth_BYTES);
	check("_crypto_onetimeauth",
	      nacl_raw._crypto_onetimeauth(authenticator.address, ma, msg.length, 0, ka));
	free_all([ka, ma]);
	return authenticator.extractBytes();
    }

    function crypto_onetimeauth_verify(authenticator, msg, key) {
	if (authenticator.length != nacl_raw._crypto_onetimeauth_BYTES) return false;
	var ka = check_injectBytes("crypto_onetimeauth_verify",
				   "key", key, nacl_raw._crypto_onetimeauth_KEYBYTES);
	var ma = injectBytes(msg);
	var aa = injectBytes(authenticator);
	var result = nacl_raw._crypto_onetimeauth_verify(aa, ma, msg.length, 0, ka);
	free_all([ka, ma, aa]);
	return (result == 0);
    }

    //---------------------------------------------------------------------------
    // Authentication

    function crypto_auth(msg, key) {
	var ka = check_injectBytes("crypto_auth", "key", key, nacl_raw._crypto_auth_KEYBYTES);
	var ma = injectBytes(msg);
	var authenticator = new Target(nacl_raw._crypto_auth_BYTES);
	check("_crypto_auth", nacl_raw._crypto_auth(authenticator.address, ma, msg.length, 0, ka));
	free_all([ka, ma]);
	return authenticator.extractBytes();
    }

    function crypto_auth_verify(authenticator, msg, key) {
	if (authenticator.length != nacl_raw._crypto_auth_BYTES) return false;
	var ka = check_injectBytes("crypto_auth_verify",
				   "key", key, nacl_raw._crypto_auth_KEYBYTES);
	var ma = injectBytes(msg);
	var aa = injectBytes(authenticator);
	var result = nacl_raw._crypto_auth_verify(aa, ma, msg.length, 0, ka);
	free_all([ka, ma, aa]);
	return (result == 0);
    }

    //---------------------------------------------------------------------------
    // Authenticated symmetric-key encryption

    function crypto_secretbox_random_nonce() {
	return nacl_raw.RandomBytes.crypto.randomBytes(nacl_raw._crypto_secretbox_NONCEBYTES);
    }

    function crypto_secretbox(msg, nonce, key) {
	var m = injectBytes(msg, nacl_raw._crypto_secretbox_ZEROBYTES);
	var na = check_injectBytes("crypto_secretbox",
				   "nonce", nonce, nacl_raw._crypto_secretbox_NONCEBYTES);
	var ka = check_injectBytes("crypto_secretbox",
				   "key", key, nacl_raw._crypto_secretbox_KEYBYTES);
	var c = new Target(msg.length + nacl_raw._crypto_secretbox_ZEROBYTES);
	check("_crypto_secretbox", nacl_raw._crypto_secretbox(c.address, m, c.length, 0, na, ka));
	free_all([m, na, ka]);
	return c.extractBytes(nacl_raw._crypto_secretbox_BOXZEROBYTES);
    }

    function crypto_secretbox_open(ciphertext, nonce, key) {
	var c = injectBytes(ciphertext, nacl_raw._crypto_secretbox_BOXZEROBYTES);
	var na = check_injectBytes("crypto_secretbox_open",
				   "nonce", nonce, nacl_raw._crypto_secretbox_NONCEBYTES);
	var ka = check_injectBytes("crypto_secretbox_open",
				   "key", key, nacl_raw._crypto_secretbox_KEYBYTES);
	var m = new Target(ciphertext.length + nacl_raw._crypto_secretbox_BOXZEROBYTES);
	check("_crypto_secretbox_open",
	      nacl_raw._crypto_secretbox_open(m.address, c, m.length, 0, na, ka));
	free_all([c, na, ka]);
	return m.extractBytes(nacl_raw._crypto_secretbox_ZEROBYTES);
    }

    //---------------------------------------------------------------------------
    // Signing

    function crypto_sign_keypair() {
	var pk = new Target(nacl_raw._crypto_sign_PUBLICKEYBYTES);
	var sk = new Target(nacl_raw._crypto_sign_SECRETKEYBYTES);
	check("_crypto_sign_keypair", nacl_raw._crypto_sign_keypair(pk.address, sk.address));
	return {signPk: pk.extractBytes(), signSk: sk.extractBytes()};
    }

    function crypto_sign(msg, sk) {
	var ma = injectBytes(msg);
	var ska = check_injectBytes("crypto_sign", "sk", sk, nacl_raw._crypto_sign_SECRETKEYBYTES);
	var sm = new Target(msg.length + nacl_raw._crypto_sign_BYTES);
	var smlen = new Target(8);
	check("_crypto_sign",
	      nacl_raw._crypto_sign(sm.address, smlen.address, ma, msg.length, 0, ska));
	free_all([ma, ska]);
	sm.length = nacl_raw.HEAPU32[smlen.address >> 2];
	nacl_raw._free(smlen.address);
	return sm.extractBytes();
    }

    function crypto_sign_open(sm, pk) {
	var sma = injectBytes(sm);
	var pka = check_injectBytes("crypto_sign_open",
				    "pk", pk, nacl_raw._crypto_sign_PUBLICKEYBYTES);
	var m = new Target(sm.length);
	var mlen = new Target(8);
	if (nacl_raw._crypto_sign_open(m.address, mlen.address, sma, sm.length, 0, pka) === 0) {
	    free_all([sma, pka]);
	    m.length = nacl_raw.HEAPU32[mlen.address >> 2];
	    nacl_raw._free(mlen.address);
	    return m.extractBytes();
	} else {
	    free_all([sma, pka, m.address, mlen.address]);
	    return null;
	}
    }

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

    exports.crypto_auth_BYTES = nacl_raw._crypto_auth_BYTES;
    exports.crypto_auth_KEYBYTES = nacl_raw._crypto_auth_KEYBYTES;
    exports.crypto_box_BEFORENMBYTES = nacl_raw._crypto_box_BEFORENMBYTES;
    exports.crypto_box_BOXZEROBYTES = nacl_raw._crypto_box_BOXZEROBYTES;
    exports.crypto_box_NONCEBYTES = nacl_raw._crypto_box_NONCEBYTES;
    exports.crypto_box_PUBLICKEYBYTES = nacl_raw._crypto_box_PUBLICKEYBYTES;
    exports.crypto_box_SECRETKEYBYTES = nacl_raw._crypto_box_SECRETKEYBYTES;
    exports.crypto_box_ZEROBYTES = nacl_raw._crypto_box_ZEROBYTES;
    exports.crypto_hash_BYTES = nacl_raw._crypto_hash_BYTES;
    exports.crypto_hashblocks_BLOCKBYTES = nacl_raw._crypto_hashblocks_BLOCKBYTES;
    exports.crypto_hashblocks_STATEBYTES = nacl_raw._crypto_hashblocks_STATEBYTES;
    exports.crypto_onetimeauth_BYTES = nacl_raw._crypto_onetimeauth_BYTES;
    exports.crypto_onetimeauth_KEYBYTES = nacl_raw._crypto_onetimeauth_KEYBYTES;
    exports.crypto_secretbox_BOXZEROBYTES = nacl_raw._crypto_secretbox_BOXZEROBYTES;
    exports.crypto_secretbox_KEYBYTES = nacl_raw._crypto_secretbox_KEYBYTES;
    exports.crypto_secretbox_NONCEBYTES = nacl_raw._crypto_secretbox_NONCEBYTES;
    exports.crypto_secretbox_ZEROBYTES = nacl_raw._crypto_secretbox_ZEROBYTES;
    exports.crypto_sign_BYTES = nacl_raw._crypto_sign_BYTES;
    exports.crypto_sign_PUBLICKEYBYTES = nacl_raw._crypto_sign_PUBLICKEYBYTES;
    exports.crypto_sign_SECRETKEYBYTES = nacl_raw._crypto_sign_SECRETKEYBYTES;
    exports.crypto_stream_BEFORENMBYTES = nacl_raw._crypto_stream_BEFORENMBYTES;
    exports.crypto_stream_KEYBYTES = nacl_raw._crypto_stream_KEYBYTES;
    exports.crypto_stream_NONCEBYTES = nacl_raw._crypto_stream_NONCEBYTES;

    exports.encode_utf8 = encode_utf8;
    exports.encode_latin1 = encode_latin1;
    exports.decode_utf8 = decode_utf8;
    exports.decode_latin1 = decode_latin1;
    exports.to_hex = to_hex;

    exports.crypto_box_keypair = crypto_box_keypair;
    exports.crypto_box_random_nonce = crypto_box_random_nonce;
    exports.crypto_box = crypto_box;
    exports.crypto_box_open = crypto_box_open;
    exports.crypto_box_precompute = crypto_box_precompute;
    exports.crypto_box_precomputed = crypto_box_precomputed;
    exports.crypto_box_open_precomputed = crypto_box_open_precomputed;

    exports.crypto_stream_random_nonce = crypto_stream_random_nonce;
    exports.crypto_stream = crypto_stream;
    exports.crypto_stream_xor = crypto_stream_xor;

    exports.crypto_onetimeauth = crypto_onetimeauth;
    exports.crypto_onetimeauth_verify = crypto_onetimeauth_verify;

    exports.crypto_auth = crypto_auth;
    exports.crypto_auth_verify = crypto_auth_verify;

    exports.crypto_secretbox_random_nonce = crypto_secretbox_random_nonce;
    exports.crypto_secretbox = crypto_secretbox;
    exports.crypto_secretbox_open = crypto_secretbox_open;

    exports.crypto_sign_keypair = crypto_sign_keypair;
    exports.crypto_sign = crypto_sign;
    exports.crypto_sign_open = crypto_sign_open;

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
