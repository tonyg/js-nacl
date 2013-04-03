function output(x) {
    document.getElementById("output").innerHTML += x + "\n";
}

function main () {
    try {
	do_tests();
    } catch (e) {
	alert(JSON.stringify(e));
    }
}

var TIMELIMIT = 1000;

function measure(desc, f) {
    var startTime = new Date().getTime();
    var stopTime;
    var delta;
    var i = 0;
    var result;
    while (1) {
	result = f();
	i++;
	stopTime = new Date().getTime();
	delta = stopTime - startTime;
	if (delta > TIMELIMIT) break;
    }
    var iter_per_sec = i / (delta / 1000);
    var sec_per_iter = (delta / 1000) / i;
    output(desc + ", " + iter_per_sec + " Hz, " + sec_per_iter + " seconds per iteration");
    return result;
}

function do_tests() {
    var hello = nacl.encode_utf8("hello");
    var kp = nacl.crypto_box_keypair_from_seed(hello);
    var selfShared = nacl.crypto_box_precompute(kp.boxPk, kp.boxSk);
    var n = nacl.crypto_box_random_nonce();
    var c = nacl.crypto_box_precomputed(hello, n, selfShared);
    var m = nacl.crypto_box_open_precomputed(c, n, selfShared);

    var c2 = nacl.crypto_box(hello, n, kp.boxPk, kp.boxSk);
    var m2 = nacl.crypto_box_open(c2, n, kp.boxPk, kp.boxSk);

    measure('nacl.crypto_hash_string("hello")',
	    function () { return nacl.crypto_hash_string("hello") });

    measure('nacl.crypto_hash(hello)',
	    function () { return nacl.crypto_hash(hello) });

    measure('nacl.crypto_box_keypair_from_seed(hello)',
	    function () { return nacl.crypto_box_keypair_from_seed(hello) });

    measure('nacl.crypto_box_precompute(kp.boxPk, kp.boxSk)',
	    function () { return nacl.crypto_box_precompute(kp.boxPk, kp.boxSk) });

    measure('nacl.crypto_box_random_nonce()',
	    function () { return nacl.crypto_box_random_nonce() });

    measure('nacl.crypto_box_precomputed(hello, n, selfShared)',
	    function () { return nacl.crypto_box_precomputed(hello, n, selfShared) });

    measure('nacl.crypto_box_open_precomputed(c, n, selfShared)',
	    function () { return nacl.crypto_box_open_precomputed(c, n, selfShared) });

    measure('nacl.crypto_box(hello, n, kp.boxPk, kp.boxSk)',
	    function () { return nacl.crypto_box(hello, n, kp.boxPk, kp.boxSk) });

    measure('nacl.crypto_box_open(c2, n, kp.boxPk, kp.boxSk)',
	    function () { return nacl.crypto_box_open(c2, n, kp.boxPk, kp.boxSk) });
}

window.onload = main;
