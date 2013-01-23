LibraryRandomBytes = {
    $RandomBytes__postset: "RandomBytes.crypto = require('crypto');\n",
    $RandomBytes: {
	crypto: null
    },

    randombytes: function (target, countlow, counthigh) {
	if (counthigh) throw {message: "_randombytes count overflow"};
	HEAPU8.set(RandomBytes.crypto.randomBytes(countlow), target);
	return 0;
    }
};

autoAddDeps(LibraryRandomBytes, "$RandomBytes");
mergeInto(LibraryManager.library, LibraryRandomBytes);
