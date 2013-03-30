function output(x) {
    document.getElementById("output").innerHTML += x + "\n";
}

function main () {
    try {
	do_tests();
    } catch (e) {
	alert(e.message);
    }
}

function do_tests() {
    output("Starting...");

    if ("c3a5c3a4c3b6" !== nacl.to_hex(nacl.encode_utf8("\xe5\xe4\xf6"))) {
	alert("UTF-8 encoding isn't working properly");
    }

    output(nacl.to_hex(nacl.crypto_hash_string("hello")));

    var kp = nacl.crypto_sign_keypair_from_seed(nacl.encode_utf8("hello"));
    output("PK: " + nacl.to_hex(kp.signPk));
    output("SK: " + nacl.to_hex(kp.signSk));

    kp = nacl.crypto_box_keypair_from_seed(nacl.encode_utf8("hello"));
    output("PK: " + nacl.to_hex(kp.boxPk));
    output("SK: " + nacl.to_hex(kp.boxSk));

    var k1 = nacl.crypto_box_keypair();
    var k2 = nacl.crypto_box_keypair();
    var n = nacl.crypto_box_random_nonce();
    output("Nonce: " + nacl.to_hex(n));
    var c = nacl.crypto_box(nacl.encode_utf8("hello world"), n, k2.boxPk, k1.boxSk);
    output("Ciphertext: " + nacl.to_hex(c));
    var m = nacl.crypto_box_open(c, n, k1.boxPk, k2.boxSk);
    output("Plaintext: " + nacl.decode_utf8(m));

    output("...done.");
}

window.onload = main;
