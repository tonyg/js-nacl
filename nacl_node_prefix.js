var nacl_raw = require("./nacl_raw.js").Module;
nacl_raw.RandomBytes.crypto = require('crypto');

this.random_bytes = function (count) {
    return nacl_raw.RandomBytes.crypto.randomBytes(count);
};
