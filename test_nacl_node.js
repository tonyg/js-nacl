var nacl = require("./node/nacl.js");
output = console.log;

output("Starting...");

if ("c3a5c3a4c3b6" !== nacl.to_hex(nacl.encode_utf8("\xe5\xe4\xf6"))) {
    alert("UTF-8 encoding isn't working properly");
}

output(nacl.to_hex(nacl.crypto_hash_string("hello")));

var kp = nacl.crypto_sign_keypair_from_seed(nacl.encode_utf8("hello"));
output("Signing PK: " + nacl.to_hex(kp.signPk));
output("Signing SK: " + nacl.to_hex(kp.signSk));
output("");

kp = nacl.crypto_box_keypair_from_seed(nacl.encode_utf8("hello"));
output("Box PK: " + nacl.to_hex(kp.boxPk));
output("Box SK: " + nacl.to_hex(kp.boxSk));
var selfShared = nacl.crypto_box_precompute(kp.boxPk, kp.boxSk);
output("Self-shared: " + nacl.to_hex(selfShared.boxK));

var n = nacl.crypto_box_random_nonce();
output("Nonce: " + nacl.to_hex(n));

var c = nacl.crypto_box_precomputed(nacl.encode_utf8("box test"), n, selfShared);
output("Ciphertext: " + nacl.to_hex(c));
var m = nacl.crypto_box_open_precomputed(c, n, selfShared);
output("Plaintext: " + nacl.decode_utf8(m));

c = nacl.crypto_box(nacl.encode_utf8("box test"), n, kp.boxPk, kp.boxSk);
output("Ciphertext: " + nacl.to_hex(c));
m = nacl.crypto_box_open(c, n, kp.boxPk, kp.boxSk);
output("Plaintext: " + nacl.decode_utf8(m));

output("...done.");
