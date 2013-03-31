# js-nacl: Pure-Javascript Emscripten-compiled NaCl routines

[Emscripten](https://github.com/kripken/emscripten)-compiled
[NaCl](http://nacl.cr.yp.to/), a cryptographic library. Includes both
in-browser and node.js support.

## Using the library

In the browser, include the `browser/nacl.js` script:

    <script src="browser/nacl.js"></script>
    ...
    <script> alert(nacl.to_hex(nacl.random_bytes(16))); </script>

In node.js, require the `node/nacl.js` module:

    var nacl = require("./node/nacl.js");
    ...
    console.log(nacl.to_hex(nacl.random_bytes(16)));

## Strings vs. Binary Data

The library enforces a strict distinction between strings and binary
data. Binary data is represented using instances of
[`Uint8Array`](https://developer.mozilla.org/en-US/docs/JavaScript/Typed_arrays/Uint8Array).

### nacl.to_hex(Uint8Array) → String

Returns a lower-case hexadecimal representation of the given binary
data.

### nacl.encode_utf8(String) → Uint8Array

Returns the binary equivalent of the argument, encoded using UTF-8.

### nacl.encode_latin1(String) → Uint8Array

Returns the binary equivalent of the argument, encoded using Latin1
(an 8-bit clean encoding). If any of the character codes in the
argument string are greater than 255, an exception is thrown.

### nacl.decode_utf8(Uint8Array) → String

Decodes the binary data in the argument using the UTF-8 encoding,
producing the corresponding string.

### nacl.decode_latin1(Uint8Array) → String

Decodes the binary data in the argument using the Latin1 8-bit clean
encoding, producing the corresponding string.

## Public-key authenticated encryption: crypto_box

Follows the [NaCl crypto_box API](http://nacl.cr.yp.to/box.html).

**Make sure to follow the instructions regarding nonce selection given
in the "Security model" section of [the
documentation](http://nacl.cr.yp.to/box.html)!**

### crypto\_box\_keypair() → {"boxPk": Uint8Array, "boxSk": Uint8Array}

Creates a fresh random keypair. `boxPk` is the public key and `boxSk`
is the secret key.

### crypto\_box\_random\_nonce() → Uint8Array

Returns a fresh randomly-chosen nonce suitable for use with
`crypto_box`.

### crypto\_box(Uint8Array msg, Uint8Array nonce, Uint8Array recipientPublicKey, Uint8Array senderSecretKey) → Uint8Array

Places `msg` in an authenticated, encrypted box that can only be
verified and decrypted by the secret key corresponding to
`recipientPublicKey`.

### crypto\_box\_open(Uint8Array ciphertext, Uint8Array nonce, Uint8Array senderPublicKey, Uint8Array recipientSecretKey) → Uint8Array

Verifies and decrypts a box from `crypto_box`. Throws an exception if
the verification fails or any of the inputs are invalid.

### crypto\_box\_precompute(Uint8Array publicKey, Uint8Array secretKey) → {"boxK": Uint8Array}

Precomputes a shared secret between two parties. See the documentation
for `crypto_box_beforenm` at the NaCl website.

### crypto\_box\_precomputed(Uint8Array msg, Uint8Array nonce, {"boxK": Uint8Array}) → Uint8Array<br>crypto\_box\_open\_precomputed(Uint8Array ciphertext, Uint8Array nonce, {"boxK": Uint8Array}) → Uint8Array

Precomputed-secret variants of `crypto_box` and `crypto_box_open`.

## Hashing: crypto_hash

### crypto\_hash(Uint8Array) → Uint8Array

Computes the SHA-512 hash of its argument.

### crypto\_hash\_string(String) → Uint8Array

Encodes its argument using `nacl.encode_utf8`, and then calls
`crypto_hash`.

## License

js-nacl is written by Tony Garnock-Jones <tonygarnockjones@gmail.com>
and is licensed under the [AGPL
3.0](http://www.gnu.org/licenses/agpl-3.0.html).

js-nacl relies on NaCl itself, which is public domain code by Daniel
J. Bernstein and others.

js-nacl's build process relies on (a modified version of) the
`import.py` script by Brian Warner, which comes from
[PyNaCl](https://github.com/warner/pynacl) and is licensed under
[version 2.0 of the Apache
license](http://www.apache.org/licenses/LICENSE-2.0.html).
