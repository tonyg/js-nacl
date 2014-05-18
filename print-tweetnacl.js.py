for z in [
'auth:hmacsha512256/32/32:BYTES,KEYBYTES:,_verify:qpup,ppup',
'box:curve25519xsalsa20poly1305/32/32/32/24/32/16:PUBLICKEYBYTES,SECRETKEYBYTES,BEFORENMBYTES,NONCEBYTES,ZEROBYTES,BOXZEROBYTES:'
+ ',_open,_keypair,_beforenm,_afternm,_open_afternm:qpuppp,qpuppp,qq,qpp,qpupp,qpupp',
'core:salsa20/64/16/32/16,hsalsa20/32/16/32/16:OUTPUTBYTES,INPUTBYTES,KEYBYTES,CONSTBYTES::qppp',
'hashblocks:sha512/64/128,sha256/32/64:STATEBYTES,BLOCKBYTES::qpu',
'hash:sha512/64,sha256/32:BYTES::qpu',
'onetimeauth:poly1305/16/32:BYTES,KEYBYTES:,_verify:qpup,ppup',
'scalarmult:curve25519/32/32:BYTES,SCALARBYTES:,_base:qpp,qp',
'secretbox:xsalsa20poly1305/32/24/32/16:KEYBYTES,NONCEBYTES,ZEROBYTES,BOXZEROBYTES:,_open:qpupp,qpupp',
'sign:ed25519/64/32/64:BYTES,PUBLICKEYBYTES,SECRETKEYBYTES:,_open,_keypair:qvpup,qvpup,qq',
'stream:xsalsa20/32/24,salsa20/32/8:KEYBYTES,NONCEBYTES:,_xor:qupp,qpupp',
'verify:16/16,32/32:BYTES::pp'
]:
  x,q,s,f,g = [i.split(',') for i in z.split(':')]
  o = 'crypto_'+x[0]
  sel = 1
  for p in q[:1]:
    p = p.split('/')
    op = o+'_'+p[0]
    opi = op+'_'+'tweetjs'
    if sel:
      print o+'_PRIMITIVE: "'+p[0]+'",'
      sel = 0
    for j in range(len(s)): print o+'_'+s[j]+': '+str(p[j+1])+','
    print o+'_VERSION: "-",'
    print o+'_IMPLEMENTATION: "'+o+'/'+p[0]+'/tweetjs'+'",'
