# js-nacl: Pure-Javascript Emscripten-compiled NaCl routines

[Emscripten](https://github.com/kripken/emscripten)-compiled
[NaCl](http://nacl.cr.yp.to/), a cryptographic library. Includes both
in-browser and node.js support.

The paper "[The security impact of a new cryptographic
library](http://cr.yp.to/highspeed/coolnacl-20120725.pdf)" is an
excellent summary of the motivation behind the NaCl API and library
design.

Using this library in the browser requires support for the newish
`window.crypto.getRandomValues` API.

## Building the library

The git checkout includes a pre-compiled version of the library, so
you won't need Emscripten unless you want to change something about
the underlying NaCl library itself.

Essentially, the source checkout contains everything you will need to
use the library in both the browser and in node.js.

If you do find yourself wanting to build the library, see the
instructions in
[`BUILDING.md`](https://github.com/tonyg/js-nacl/blob/master/BUILDING.md).

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

## Hashing: crypto_hash

Follows the [NaCl crypto_hash API](http://nacl.cr.yp.to/hash.html).

### nacl.crypto\_hash(Uint8Array) → Uint8Array

Computes the SHA-512 hash of its argument.

### nacl.crypto\_hash\_string(String) → Uint8Array

Encodes its argument using `nacl.encode_utf8`, and then calls
`crypto_hash`.

## Public-key authenticated encryption: crypto_box

Follows the [NaCl crypto_box API](http://nacl.cr.yp.to/box.html).

**Make sure to follow the instructions regarding nonce selection given
in the "Security model" section of the NaCl API documentation!**

    senderKeypair = nacl.crypto_box_keypair();
    recipientKeypair = nacl.crypto_box_keypair();
    message = nacl.encode_utf8("Hello!");

    nonce = nacl.crypto_box_random_nonce();
    packet = nacl.crypto_box(message, nonce, recipientKeypair.boxPk, senderKeypair.boxSk);

    decoded = nacl.crypto_box_open(packet, nonce, senderKeypair.boxPk, recipientKeypair.boxSk);

    "Hello!" === nacl.decode_utf8(decoded); // always true

### nacl.crypto\_box\_keypair() → {"boxPk": Uint8Array, "boxSk": Uint8Array}

Creates a fresh random keypair. `boxPk` is the public key and `boxSk`
is the secret key.

### nacl.crypto\_box\_random\_nonce() → Uint8Array

Returns a fresh randomly-chosen nonce suitable for use with
`crypto_box`.

### nacl.crypto\_box(msgBin, nonceBin, recipientPublicKeyBin, senderSecretKeyBin) → Uint8Array

Places `msg` in an authenticated, encrypted box that can only be
verified and decrypted by the secret key corresponding to
`recipientPublicKey`.

### nacl.crypto\_box\_open(ciphertextBin, nonceBin, senderPublicKeyBin, recipientSecretKeyBin) → Uint8Array

Verifies and decrypts a box from `crypto_box`. Throws an exception if
the verification fails or any of the inputs are invalid.

### nacl.crypto\_box\_precompute(publicKeyBin, secretKeyBin) → {"boxK": Uint8Array}

Precomputes a shared secret between two parties. See the documentation
for `crypto_box_beforenm` at the NaCl website.

### nacl.crypto\_box\_precomputed(msgBin, nonceBin, {"boxK": Uint8Array}) → Uint8Array<br>nacl.crypto\_box\_open\_precomputed(ciphertextBin, nonceBin, {"boxK": Uint8Array}) → Uint8Array

Precomputed-secret variants of `crypto_box` and `crypto_box_open`.

## Secret-key authenticated encryption: crypto_secretbox

Follows the [NaCl crypto_secretbox API](http://nacl.cr.yp.to/secretbox.html).

**Make sure to follow the instructions regarding nonce selection given
in the "Security model" section of the NaCl API documentation!**

    k = ...;
    m = nacl.encode_utf8("message");
    n = nacl.crypto_secretbox_random_nonce();
    c = nacl.crypto_secretbox(m, n, k);
    m1 = nacl.crypto_secretbox_open(c, n, k);
    "message" === nacl.decode_utf8(m1); // always true

### nacl.crypto\_secretbox\_random\_nonce() → Uint8Array

Returns a fresh randomly-chosen nonce suitable for use with
`crypto_secretbox`.

### nacl.crypto\_secretbox(msgBin, nonceBin, keyBin) → Uint8Array

Places `msg` in an authenticated, encrypted box that can only be
verified and decrypted by someone who knows `keyBin`. The `keyBin`
Uint8Array must be `nacl.crypto_secretbox_KEYBYTES` bytes long.

### nacl.crypto\_secretbox\_open(ciphertextBin, nonceBin, keyBin) → Uint8Array

Verifies and decrypts a packet from `crypto_secretbox`. Throws an
exception if the verification fails or any of the inputs are invalid.

## Secret-key encryption: crypto_stream

Follows the [NaCl crypto_stream API](http://nacl.cr.yp.to/stream.html).

**Make sure to follow the instructions regarding nonce selection given
in the "Security model" section of the NaCl API documentation!**

Since this style of secret-key encryption is symmetric,
`nacl.crypto_stream_xor` is suitable for decryption as well as
encryption:

    k = ...;
    m = nacl.encode_utf8("message");
    n = nacl.crypto_stream_random_nonce();
    c = nacl.crypto_stream_xor(m, n, k);
    m1 = nacl.crypto_stream_xor(c, n, k);
    "message" === nacl.decode_utf8(m1); // always true

### nacl.crypto\_stream\_random\_nonce() → Uint8Array

Returns a fresh randomly-chosen nonce suitable for use with
`crypto_stream`.

### nacl.crypto\_stream(lenInt, nonceBin, keyBin) → Uint8Array

Returns a `lenInt`-byte length keystream based on the given nonce and
key. The key must be `nacl.crypto_stream_KEYBYTES` bytes long.

### nacl.crypto\_stream\_xor(msgBin, nonceBin, keyBin) → Uint8Array

Returns `msgBin.length` bytes of ciphertext (or plaintext, depending
on the contents of `msgBin`) produced by XORing `msgBin` with the
result of `nacl.crypto_stream(msgBin.length, nonceBin, keyBin)`.

## Secret-key single-message authentication: crypto_onetimeauth

Follows the [NaCl crypto_onetimeauth API](http://nacl.cr.yp.to/onetimeauth.html).

## Secret-key message authentication: crypto_auth

Follows the [NaCl crypto_auth API](http://nacl.cr.yp.to/auth.html).

## Signatures: crypto_sign

Follows the [NaCl crypto_sign API](http://nacl.cr.yp.to/sign.html).

Note the warning in the NaCl API documentation:

> WARNING: This signature software (both at the C level and at the C++
> level) is a prototype. It will be replaced by the final system
> [Ed25519](http://ed25519.cr.yp.to/) in future NaCl releases. A
> NaCl-compatible Ed25519 implementation is already available as part
> of [SUPERCOP](http://bench.cr.yp.to/supercop.html).

### nacl.crypto\_sign\_keypair() → {"signPk": Uint8Array, "signSk": Uint8Array}

Creates a fresh random keypair. `signPk` is the public key and
`signSk` is the secret key.

    k = nacl.crypto_sign_keypair();
    m = nacl.encode_utf8("message");
    signed_m = nacl.crypto_sign(m, k.signSk);
    m1 = nacl.crypto_sign_open(signed_m, k.signPk);
    "message" === nacl.decode_utf8(m1); // always true

### nacl.crypto\_sign(msgBin, signerSecretKey) → Uint8Array

Produces a signature-wrapped version of `msgBin`.

### nacl.crypto\_sign\_open(packetBin, signerPublicKey) → (Uint8Array || null)

Verifies the signature on the given `packetBin`, and if it is valid,
extracts the carried message and returns it. If the signature could
not be verified, returns `null`.

## Derived Keys

**WARNING: Experimental**

If you see yourself wanting to use these, you will need to know why
[PBKDF2](http://en.wikipedia.org/wiki/PBKDF2) and
[scrypt](http://www.tarsnap.com/scrypt.html) are of crucial
importance.

You might like to explore the use of these functions in tandem with
`scrypt.crypto_scrypt` from
[js-scrypt](https://github.com/tonyg/js-scrypt).

### nacl.crypto\_sign\_keypair\_from\_seed(Uint8Array) → {"signPk": Uint8Array, "signSk": Uint8Array}

Produces a *signing* keypair from its argument. A given binary input
will always produce the same keypair as output.

Compatible with [PyNaCl](https://github.com/warner/pynacl)'s
`crypto_sign_keypair_fromseed` and
[racl](https://github.com/tonyg/racl)'s `bytes->crypto-sign-keypair`.

### nacl.crypto\_box\_keypair\_from\_seed(Uint8Array) → {"boxPk": Uint8Array, "boxSk": Uint8Array}

Produces an *encrypted authenticated box* keypair from its argument. A
given binary input will always produce the same keypair as output.

Compatible with [racl](https://github.com/tonyg/racl)'s
`bytes->crypto-box-keypair`.

## License

js-nacl is written by Tony Garnock-Jones <tonygarnockjones@gmail.com>
and is licensed under the [MIT
license](http://opensource.org/licenses/MIT):

> Copyright &copy; 2013 Tony Garnock-Jones.
>
> Permission is hereby granted, free of charge, to any person
> obtaining a copy of this software and associated documentation files
> (the "Software"), to deal in the Software without restriction,
> including without limitation the rights to use, copy, modify, merge,
> publish, distribute, sublicense, and/or sell copies of the Software,
> and to permit persons to whom the Software is furnished to do so,
> subject to the following conditions:
>
> The above copyright notice and this permission notice shall be
> included in all copies or substantial portions of the Software.
>
> THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
> EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
> MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
> NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS
> BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN
> ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
> CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
> SOFTWARE.

js-nacl relies on NaCl itself, which is public domain code by Daniel
J. Bernstein and others.

js-nacl's build process relies on (a modified version of) the
`import.py` script by Brian Warner, which comes from
[PyNaCl](https://github.com/warner/pynacl) and is licensed under
[version 2.0 of the Apache
license](http://www.apache.org/licenses/LICENSE-2.0.html).
