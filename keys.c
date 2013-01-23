/* Derivation of keypairs from seeds. Compatible with pynacl. */

#include "subnacl/sign_edwards25519sha512batch/fe25519.h"
#include "subnacl/sign_edwards25519sha512batch/ge25519.h"
#include "subnacl/sign_edwards25519sha512batch/sc25519.h"

int crypto_sign_keypair_from_raw_sk(unsigned char *pk,
				    unsigned char *sk)
{
  sc25519 scsk;
  ge25519 gepk;

  sk[0] &= 248;
  sk[31] &= 127;
  sk[31] |= 64;

  sc25519_from32bytes(&scsk, sk);
  ge25519_scalarmult_base(&gepk, &scsk);
  ge25519_pack(pk, &gepk);
  return 0;
}
