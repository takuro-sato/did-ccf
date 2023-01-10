// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the Apache 2.0 License.
import {
    Request,
    Response,
    string as stringConverter,
  } from '@microsoft/ccf-app';
import {
    sign as createSignature,
    verifySignature,
    SigningAlgorithm,
} from '@microsoft/ccf-app/crypto';
import {
    AlgorithmName,
    ccf,
} from '@microsoft/ccf-app/global';
import { Base64 } from 'js-base64';
import {
    IdentifierNotFound,
    IdentifierNotProvided,
    KeyNotConfigured,
    PayloadNotProvided,
} from '../../../errors';
import {
    AuthenticatedIdentity,
    IdentifierStore,
    KeyUse,
    RequestParser,
    SignedPayload,
} from '../../../models';

/**
 * Signs the payload using the current signing key associated with the controller identifier.
 * @param {Request} request containing the CCF request context.
 * @returns HTTP 200 OK and a {@link SignedPayload}.
 */
export function sign (request: Request): Response<any> {
  console.log("-------------------------------------------------- sign() is called");
  // Get the authentication details of the caller
  const authenticatedIdentity = new AuthenticatedIdentity(request.caller);
  const requestParser = new RequestParser(request);
  const identifierId = requestParser.identifier;

  // Check an identifier has been provided and
  // if not return 400 Bad Request
  if (!identifierId) {
    const identifierNotProvided = new IdentifierNotProvided(authenticatedIdentity);
    console.log(identifierNotProvided);
    return identifierNotProvided.toErrorResponse();
  }

  // Read the text from the request and validate
  // before we do any work retrieving keys.
  const payload = request.body.text();
  console.log('payload: ', payload)
  if (!payload || payload.length === 0) {
    const payloadNotProvided = new PayloadNotProvided(authenticatedIdentity);
    console.log(payloadNotProvided);
    return payloadNotProvided.toErrorResponse();
  }

  // Try read the identifier from the store
  const identifier = new IdentifierStore().read(identifierId);
  if (!identifier) {
    const identifierNotFound = new IdentifierNotFound(identifierId, authenticatedIdentity);
    console.log(identifierNotFound);
    return identifierNotFound.toErrorResponse();
  }

  // Get the current signing key and return error if
  // one is not returned.
  const currentKey = identifier.getCurrentKey(KeyUse.Signing);
  if (!currentKey) {
    const keyNotConfigured = new KeyNotConfigured(authenticatedIdentity, identifierId);
    // Send to the console as an error since this is not
    // a client recoverable error.
    console.error(keyNotConfigured);
    return keyNotConfigured.toErrorResponse();
  }
  
  console.log('currentKey: ', JSON.stringify(currentKey, null, 2))
  console.log('<AlgorithmName>currentKey.algorithm.toString(): ', <AlgorithmName>currentKey.algorithm.toString())

  const signingAlgorithm: SigningAlgorithm = {
    name: <AlgorithmName>currentKey.algorithm.toString(),
    hash: 'SHA-256',
  };

  // Encode the payload, generate the signature and
  // then convert to a Base64URL encoded string
  const payloadBuffer = stringConverter.encode(payload);
  const signatureBuffer = createSignature(signingAlgorithm, currentKey.privateKey, payloadBuffer);

  // debug ->
  const isSignatureValid = verifySignature(
    signingAlgorithm,
    currentKey.publicKey,
    signatureBuffer,
    payloadBuffer);
  console.log("isSignatureValid at sign(): ", isSignatureValid)

  // <- debug

  {
    console.log("^^^^^^ Lazy print debug")
    const publicKey = currentKey.publicKey
    const privateKey = currentKey.privateKey
    const data = ccf.strToBuf("foo")
    const signature = ccf.crypto.sign(
      {
        name: "ECDSA",
        hash: "SHA-256",
      },
      privateKey,
      data
    )
    const ret = ccf.crypto.verifySignature(
        {
          name: "ECDSA",
          hash: "SHA-256",
        },
        publicKey,
        signature,
        data
      )
    console.log("^^^^^^ ret: ", ret)
  }

  {
    console.log("$$$$$$ ECDSA sign/verify")
    const { publicKey, privateKey } = ccf.crypto.generateEcdsaKeyPair("secp256r1")
    const data = ccf.strToBuf("foo")
    const signature = ccf.crypto.sign(
      {
        name: "ECDSA",
        hash: "SHA-256",
      },
      privateKey,
      data
    )
    const ret = ccf.crypto.verifySignature(
        {
          name: "ECDSA",
          hash: "SHA-256",
        },
        publicKey,
        signature,
        data
      )
    console.log("$$$$$$ ret: ", ret)
  }

  {
    console.log("@@@@@@ EdDSA sign/verify")
    const { publicKey, privateKey } = ccf.crypto.generateEddsaKeyPair("curve25519")
    const data = ccf.strToBuf("foo")
    const signature = ccf.crypto.sign(
      {
        name: "EdDSA",
      },
      privateKey,
      data
    )
    const ret = ccf.crypto.verifySignature(
        {
          name: "EdDSA",
        },
        publicKey,
        signature,
        data
      )
    console.log("@@@@@@ ret: ", ret)
  }

  const signature = Base64.fromUint8Array(new Uint8Array(signatureBuffer), true);

  return {
    statusCode: 200,
    body: <SignedPayload> {
      signature,
      algorithm: signingAlgorithm,
      keyIdentifier: currentKey.id,
    },
  };
}
