# Memo

- repo: https://github.com/microsoft/did-ccf
- issue: https://github.com/microsoft/did-ccf/issues/19


## Set variables
see `set_vars.sh`
```bash
source set_vars.sh
```

## [Creating identifier](https://github.com/microsoft/did-ccf/blob/main/DID_CCF.md)

> Supported key algorithms (alg):
> - RSASSA-PKCS1-v1_5
> - ECDSA
> - EdDSA
>     
> Supported ECDSA curves (curve):
> - secp256k1
> - secp256r1
> - secp384r1

```bash
# ECDSA + secp256k1
create_res=$($scurl $node/app/identifiers/create?alg=ECDSA'&'curve=secp256k1 --cacert $service_cert --signing-key $signing_key_pem --signing-cert $signing_cert_pem -H "content-type: application/json" -X POST -s) && echo $create_res | jq

# ECDSA + secp256r1
create_res=$($scurl $node/app/identifiers/create?alg=ECDSA'&'curve=secp256r1 --cacert $service_cert --signing-key $signing_key_pem --signing-cert $signing_cert_pem -H "content-type: application/json" -X POST -s) && echo $create_res | jq

# RSASSA-PKCS1-v1_5
create_res=$($scurl $node/app/identifiers/create?alg=RSASSA-PKCS1-v1_5 --cacert $service_cert --signing-key $signing_key_pem --signing-cert $signing_cert_pem -H "content-type: application/json" -X POST -s) && echo $create_res | jq

# EdDSA
create_res=$($scurl $node/app/identifiers/create?alg=EdDSA --cacert $service_cert --signing-key $signing_key_pem --signing-cert $signing_cert_pem -H "content-type: application/json" -X POST -s) && echo $create_res | jq

# extract identifier
identifier=$(echo $create_res | jq -r '.id' | awk '{n=split($0,arr,":"); print arr[n]}') && echo $identifier
```
## Resolve identifier

```bash
curl $node/app/identifiers/$identifier/resolve --cacert $service_cert -s | jq
```

## Repro

```bash
sig_res=$($scurl $node/app/identifiers/$identifier/signature/sign --cacert $service_cert --signing-key $signing_key_pem --signing-cert $signing_cert_pem -H "content-type: plain/text" --data "Text to sign" -X POST -s) && echo $sig_res | jq
signature=$(echo $sig_res | jq -r '.signature') && echo $signature

$scurl $node/app/identifiers/$identifier/signature/verify --cacert $service_cert --signing-key $signing_key_pem --signing-cert $signing_cert_pem -H "content-type: plain/text" -d "{\"payload\":\"Text to sign\",\"signer\":\"$identifier\", \"signature\":\"$signature\"}" -X POST -s | cat && echo ""
```

## See app log
```bash
./log.sh

# Or use editor then search for '[app]'
vim $out_path
```


## Openssl

### sign/verify for ECDSA
https://stackoverflow.com/questions/22856059/openssl-ecdsa-sign-and-verify-file

```bash
echo -n "Text to sign" | openssl dgst -sha256 -sign priv.pem > signature.bin

echo -n "Text to sign" | openssl dgst -sha256 -verify pub.pem -signature signature.bin
```