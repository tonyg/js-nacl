console.log("Starting...");

var nacl = require("./node/nacl.js");

console.log(nacl.decode_hex(nacl.crypto_hash_string("hello")));

var kp = nacl.crypto_sign_keypair_from_seed(nacl.encode_utf8("hello"));
console.log("PK: " + nacl.decode_hex(kp.signPk));
console.log("SK: " + nacl.decode_hex(kp.signSk));

var k1 = nacl.crypto_box_keypair();
var k2 = nacl.crypto_box_keypair();
var n = nacl.crypto_box_random_nonce();
console.log("Nonce: " + nacl.decode_hex(n));
var c = nacl.crypto_box(nacl.encode_utf8("hello world"), n, k2.boxPk, k1.boxSk);
console.log("Ciphertext: " + nacl.decode_hex(c));
var m = nacl.crypto_box_open(c, n, k1.boxPk, k2.boxSk);
console.log("Plaintext: " + nacl.decode_utf8(m));

console.log("...done.");
