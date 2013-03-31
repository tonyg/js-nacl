    var randomBytes;
    if (window && window.crypto && window.crypto.getRandomValues) {
	randomBytes = function (count) {
	    var bs = new Uint8Array(count);
	    window.crypto.getRandomValues(bs);
	    return bs;
	};
    } else {
	randomBytes = function (count) {
	    throw { name: "No cryptographic random number generator",
		    message: "Your browser does not support cryptographic random number generation." };
	};
    }

    nacl_raw.RandomBytes.crypto = { "randomBytes": randomBytes };
    nacl.random_bytes = randomBytes;
    nacl.nacl_raw = nacl_raw;
    return nacl;
})();
