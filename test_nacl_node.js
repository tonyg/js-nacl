var nacl = require("./node/nacl.js");
output = console.log;

output("Starting...");

if ("c3a5c3a4c3b6" !== nacl.to_hex(nacl.encode_utf8("\xe5\xe4\xf6"))) {
    alert("UTF-8 encoding isn't working properly");
}

output(nacl.to_hex(nacl.crypto_hash_string("hello")));

var kp = nacl.crypto_box_keypair_from_seed(nacl.encode_utf8("hello"));
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
output("");

n = new Uint8Array(nacl.crypto_stream_NONCEBYTES);
k = new Uint8Array(nacl.crypto_stream_KEYBYTES);
output("Stream: " + nacl.to_hex(nacl.crypto_stream(10, n, k)));
c = nacl.crypto_stream_xor(nacl.encode_utf8("hello"), n, k);
output("Ciphertext: " + nacl.to_hex(c));
m = nacl.crypto_stream_xor(c, n, k);
output("Plaintext: " + nacl.decode_utf8(m));

var authkey = nacl.crypto_hash(nacl.encode_utf8("hello")).subarray(0, nacl.crypto_onetimeauth_KEYBYTES);
var auth = nacl.crypto_onetimeauth(nacl.encode_utf8("hello"), authkey);
output("Auth key:      " + nacl.to_hex(authkey));
output("Authenticator: " + nacl.to_hex(auth));
output("True: " + nacl.crypto_onetimeauth_verify(auth, nacl.encode_utf8("hello"), authkey));
output("False: " + nacl.crypto_onetimeauth_verify(auth, nacl.encode_utf8("hellp"), authkey));
output("False: " + nacl.crypto_onetimeauth_verify(auth.subarray(1), nacl.encode_utf8("hello"), authkey));
auth[0] = auth[0] + 1;
output("False: " + nacl.crypto_onetimeauth_verify(auth, nacl.encode_utf8("hello"), authkey));
output("");

var authkey = nacl.crypto_hash(nacl.encode_utf8("hello")).subarray(0, nacl.crypto_auth_KEYBYTES);
var auth = nacl.crypto_auth(nacl.encode_utf8("hello"), authkey);
output("Auth key:      " + nacl.to_hex(authkey));
output("Authenticator: " + nacl.to_hex(auth));
output("True: " + nacl.crypto_auth_verify(auth, nacl.encode_utf8("hello"), authkey));
output("False: " + nacl.crypto_auth_verify(auth, nacl.encode_utf8("hellp"), authkey));
output("False: " + nacl.crypto_auth_verify(auth.subarray(1), nacl.encode_utf8("hello"), authkey));
auth[0] = auth[0] + 1;
output("False: " + nacl.crypto_auth_verify(auth, nacl.encode_utf8("hello"), authkey));
output("");

n = nacl.crypto_secretbox_random_nonce();
var secretboxkey = nacl.crypto_hash(nacl.encode_utf8("hello")).subarray(0, nacl.crypto_secretbox_KEYBYTES);
output("Nonce: " + nacl.to_hex(n));
c = nacl.crypto_secretbox(nacl.encode_utf8("hello"), n, secretboxkey);
output("Ciphertext: " + nacl.to_hex(c));
m = nacl.crypto_secretbox_open(c, n, secretboxkey);
output("Plaintext: " + nacl.decode_utf8(m));
output("");

kp = nacl.crypto_sign_keypair_from_seed(nacl.encode_utf8("hello"));
output("Signing PK: " + nacl.to_hex(kp.signPk));
output("Signing SK: " + nacl.to_hex(kp.signSk));
c = nacl.crypto_sign(nacl.encode_utf8("message"), kp.signSk);
output("Signed  message: " + nacl.to_hex(c));
output("Signed  message: " + nacl.decode_latin1(c));
m = nacl.crypto_sign_open(c, kp.signPk);
output("Opened  message: " + nacl.decode_utf8(m));
c = nacl.decode_latin1(c);
c = c.substring(0, 35) + '!' + c.substring(36);
c = nacl.encode_latin1(c);
output("Corrupt message: " + nacl.decode_latin1(c));
m = nacl.crypto_sign_open(c, kp.signPk);
output("Detected corruption: " + (m === null));
output("");

output("...done.");
