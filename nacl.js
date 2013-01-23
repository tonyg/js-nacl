var raw = require("./nacl_raw.js").Module;

//---------------------------------------------------------------------------

function injectString(str) {
    return injectBytes(new Buffer(str));
}

function injectBytes(bs, leftPadding) {
    var p = leftPadding || 0;
    var address = raw._malloc(bs.length + p);
    raw.HEAPU8.set(bs, address + p);
    for (var i = address; i < address + p; i++) {
	raw.HEAPU8[i] = 0;
    }
    return address;
}

function check_injectBytes(function_name, what, thing, expected_length, leftPadding) {
    check_length(function_name, what, thing, expected_length);
    return injectBytes(thing, leftPadding);
}

function extractBytes(address, length) {
    return new Buffer(raw.HEAPU8.subarray(address, address + length));
}

function extractString(address, length) {
    return extractBytes(address, length).toString();
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
    this.address = raw._malloc(length);
}

Target.prototype.extractBytes = function () {
    var result = extractBytes(this.address, this.length);
    raw._free(this.address);
    this.address = null;
    return result;
};

function free_all(addresses) {
    for (var i = 0; i < addresses.length; i++) {
	raw._free(addresses[i]);
    }
}

//---------------------------------------------------------------------------

function crypto_hash(bs) {
    var address = injectBytes(bs);
    var hash = new Target(raw._crypto_hash_BYTES);
    check("_crypto_hash", raw._crypto_hash(hash.address, address, bs.length, 0));
    raw._free(address);
    return new Uint8Array(hash.extractBytes());
}

function crypto_hash_string(s, encoding) {
    return crypto_hash(new Buffer(s, encoding));
}

//---------------------------------------------------------------------------

function crypto_sign_keypair_from_seed(bs) {
    // Hash the bytes to get a secret key. This will be MODIFIED IN
    // PLACE by the call to crypto_sign_keypair_from_raw_sk below.
    var ska = injectBytes(crypto_hash(bs).subarray(0, raw._crypto_sign_SECRETKEYBYTES));
    var pk = new Target(raw._crypto_sign_PUBLICKEYBYTES);
    check("_crypto_sign_keypair_from_raw_sk",
	  raw._crypto_sign_keypair_from_raw_sk(pk.address, ska));
    var sk = extractBytes(ska, raw._crypto_sign_SECRETKEYBYTES);
    raw._free(ska);
    return {signPk: pk.extractBytes(), signSk: sk};
}

//---------------------------------------------------------------------------

function crypto_box_keypair() {
    var pk = new Target(raw._crypto_box_PUBLICKEYBYTES);
    var sk = new Target(raw._crypto_box_SECRETKEYBYTES);
    check("_crypto_box_keypair", raw._crypto_box_keypair(pk.address, sk.address));
    return {boxPk: pk.extractBytes(), boxSk: sk.extractBytes()};
}

var crypto = require("crypto");
function crypto_box_random_nonce() {
    return crypto.randomBytes(raw._crypto_box_NONCEBYTES);
}

function crypto_box(msg, nonce, pk, sk) {
    var m = injectBytes(msg, raw._crypto_box_ZEROBYTES);
    var na = check_injectBytes("crypto_box", "nonce", nonce, raw._crypto_box_NONCEBYTES);
    var pka = check_injectBytes("crypto_box", "pk", pk, raw._crypto_box_PUBLICKEYBYTES);
    var ska = check_injectBytes("crypto_box", "sk", sk, raw._crypto_box_SECRETKEYBYTES);
    var c = new Target(msg.length + raw._crypto_box_ZEROBYTES);
    check("_crypto_box", raw._crypto_box(c.address, m, c.length, na, pka, ska));
    free_all([na, pka, ska]);
    return c.extractBytes();
}

//---------------------------------------------------------------------------

console.log(new Buffer(crypto_hash_string("hello")).toString('hex'));
console.log(crypto_sign_keypair_from_seed(new Buffer("hello")));
// console.log(crypto_box_keypair());
