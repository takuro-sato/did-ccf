#!/bin/bash

set -ex

source set_vars.sh

# ECDSA + secp256r1
create_res=$($scurl $node/app/identifiers/create?alg=ECDSA'&'curve=secp256r1 --cacert $service_cert --signing-key $signing_key_pem --signing-cert $signing_cert_pem -H "content-type: application/json" -X POST -s) && echo $create_res | jq

# extract identifier
identifier=$(echo $create_res | jq -r '.id' | awk '{n=split($0,arr,":"); print arr[n]}') && echo $identifier

# confirm identifier
curl $node/app/identifiers/$identifier/resolve --cacert $service_cert -s | jq

# sign
sig_res=$($scurl $node/app/identifiers/$identifier/signature/sign --cacert $service_cert --signing-key $signing_key_pem --signing-cert $signing_cert_pem -H "content-type: plain/text" --data "Text to sign" -X POST -s) && echo $sig_res | jq
signature=$(echo $sig_res | jq -r '.signature') && echo $signature