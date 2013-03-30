console.log("Starting...");

var nacl = require("./node/nacl.js");

if ("c3a5c3a4c3b6" !== nacl.to_hex(nacl.encode_utf8("\xe5\xe4\xf6"))) {
    throw { message:  "UTF-8 encoding isn't working properly" };
}

console.log(nacl.to_hex(nacl.crypto_hash_string("hello")));

var kp = nacl.crypto_sign_keypair_from_seed(nacl.encode_utf8("hello"));
console.log("PK: " + nacl.to_hex(kp.signPk));
console.log("SK: " + nacl.to_hex(kp.signSk));

kp = nacl.crypto_box_keypair_from_seed(nacl.encode_utf8("hello"));
console.log("PK: " + nacl.to_hex(kp.boxPk));
console.log("SK: " + nacl.to_hex(kp.boxSk));

var k1 = nacl.crypto_box_keypair();
var k2 = nacl.crypto_box_keypair();
var n = nacl.crypto_box_random_nonce();
console.log("Nonce: " + nacl.to_hex(n));
var c = nacl.crypto_box(nacl.encode_utf8("hello world"), n, k2.boxPk, k1.boxSk);
console.log("Ciphertext: " + nacl.to_hex(c));
var m = nacl.crypto_box_open(c, n, k1.boxPk, k2.boxSk);
console.log("Plaintext: " + nacl.decode_utf8(m));

console.log("...done.");
