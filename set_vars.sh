#!/bin/bash

ccf_path=/opt/ccf_virtual/bin
scurl=$ccf_path/scurl.sh
node=https://127.0.0.1:8000
cert_path=workspace/sandbox_common
service_cert=$cert_path/service_cert.pem
signing_key_pem=$cert_path/member0_privk.pem
signing_cert_pem=$cert_path/member0_cert.pem
out_path=workspace/sandbox_0/out
