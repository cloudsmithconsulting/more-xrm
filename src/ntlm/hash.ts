'use strict';

import * as crypto from 'crypto';
import { Type2Message } from './type2.message';

export class Hash {
  static createLMResponse(challenge: Buffer, lmhash: Buffer) {
    let buf = Buffer.alloc(24);
    let pwBuffer = Buffer.alloc(21).fill(0);

    lmhash.copy(pwBuffer);

    Hash.calculateDES(pwBuffer.slice(0, 7), challenge).copy(buf);
    Hash.calculateDES(pwBuffer.slice(7, 14), challenge).copy(buf, 8);
    Hash.calculateDES(pwBuffer.slice(14), challenge).copy(buf, 16);

    return buf;
  }

  static createLMHash(password: string) {
    let buf = Buffer.alloc(16),
      pwBuffer = Buffer.alloc(14),
      magicKey = Buffer.from('KGS!@#$%', 'ascii');

    if (password.length > 14) {
      buf.fill(0);
      return buf;
    }

    pwBuffer.fill(0);
    pwBuffer.write(password.toUpperCase(), 0, 'ascii');

    return Buffer.concat([
        Hash.calculateDES(pwBuffer.slice(0, 7), magicKey),
        Hash.calculateDES(pwBuffer.slice(7), magicKey)
    ]);
  }

  static calculateDES(key: Buffer, message: Buffer) {
    let desKey = Buffer.alloc(8);

    desKey[0] = key[0] & 0xFE;
    desKey[1] = ((key[0] << 7) & 0xFF) | (key[1] >> 1);
    desKey[2] = ((key[1] << 6) & 0xFF) | (key[2] >> 2);
    desKey[3] = ((key[2] << 5) & 0xFF) | (key[3] >> 3);
    desKey[4] = ((key[3] << 4) & 0xFF) | (key[4] >> 4);
    desKey[5] = ((key[4] << 3) & 0xFF) | (key[5] >> 5);
    desKey[6] = ((key[5] << 2) & 0xFF) | (key[6] >> 6);
    desKey[7] = (key[6] << 1) & 0xFF;

    for (let i = 0; i < 8; i++) {
      let parity = 0;

      for (let j = 1; j < 8; j++) {
        parity += (desKey[i] >> j) % 2;
      }

      desKey[i] |= (parity % 2) === 0 ? 1 : 0;
    }

    let des = crypto.createCipheriv('DES-ECB', desKey, '');
    return des.update(message);
  }

  static createNTLMResponse(challenge: Buffer, ntlmhash: Buffer) {
    let buf = Buffer.alloc(24),
      ntlmBuffer = Buffer.alloc(21).fill(0);

    ntlmhash.copy(ntlmBuffer);

    Hash.calculateDES(ntlmBuffer.slice(0, 7), challenge).copy(buf);
    Hash.calculateDES(ntlmBuffer.slice(7, 14), challenge).copy(buf, 8);
    Hash.calculateDES(ntlmBuffer.slice(14), challenge).copy(buf, 16);

    return buf;
  }

  static createNTLMHash(password: string) {
    let md4sum = crypto.createHash('md4');
    md4sum.update(Buffer.from(password, 'ucs2')); // lgtm[js/insufficient-password-hash]
    return md4sum.digest();
  }

  static createNTLMv2Hash(ntlmhash: Buffer, username: string, authTargetName: string) {
    let hmac = crypto.createHmac('md5', ntlmhash);
    hmac.update(Buffer.from(username.toUpperCase() + authTargetName, 'ucs2')); // lgtm[js/weak-cryptographic-algorithm]
    return hmac.digest();
  }

  static createLMv2Response(type2message: Type2Message, username: string, authTargetName: string, ntlmhash: Buffer, nonce: string) {
    let buf = Buffer.alloc(24);
    let ntlm2hash = Hash.createNTLMv2Hash(ntlmhash, username, authTargetName);
    let hmac = crypto.createHmac('md5', ntlm2hash);

    //server challenge
    type2message.challenge.copy(buf, 8);

    //client nonce
    buf.write(nonce, 16, 'hex');

    //create hash
    hmac.update(buf.slice(8));
    let hashedBuffer = hmac.digest();

    hashedBuffer.copy(buf);

    return buf;
  }

  static createNTLMv2Response(type2message: Type2Message, username: string, authTargetName: string, ntlmhash: Buffer, nonce: string, timestamp: string, withMic: boolean) {
    let bufferSize = 48 + type2message.targetInfo.buffer.length;
    if (withMic) {
      bufferSize += 8;
    }
    let buf = Buffer.alloc(bufferSize),
      ntlm2hash = Hash.createNTLMv2Hash(ntlmhash, username, authTargetName),
      hmac = crypto.createHmac('md5', ntlm2hash);

    //the first 8 bytes are spare to store the hashed value before the blob

    //server challenge
    type2message.challenge.copy(buf, 8);

    //blob signature
    buf.writeUInt32BE(0x01010000, 16);

    //reserved
    buf.writeUInt32LE(0, 20);

    //timestamp
    let timestampLow = Number('0x' + timestamp.substring(Math.max(0, timestamp.length - 8)));
    let timestampHigh = Number('0x' + timestamp.substring(0, Math.max(0, timestamp.length - 8)));

    buf.writeUInt32LE(timestampLow, 24);
    buf.writeUInt32LE(timestampHigh, 28);

    //random client nonce
    buf.write(nonce, 32, 'hex');

    //zero
    buf.writeUInt32LE(0, 40);

    //complete target information block from type 2 message
    type2message.targetInfo.buffer.copy(buf, 44);

    let bufferPos = 44 + type2message.targetInfo.buffer.length;
    if (withMic) {
      // Should include MIC in response, indicate it in AV_FLAGS
      buf.writeUInt16LE(0x06, bufferPos - 4);
      buf.writeUInt16LE(0x04, bufferPos - 2);
      buf.writeUInt32LE(0x02, bufferPos);
      // Write new endblock
      buf.writeUInt32LE(0, bufferPos + 4);
      bufferPos += 8;
    }

    //zero
    buf.writeUInt32LE(0, bufferPos);

    hmac.update(buf.slice(8));
    let hashedBuffer = hmac.digest();

    hashedBuffer.copy(buf);

    return buf;
  }

  static createMIC(type1message: Buffer, type2message: Type2Message, type3message: Buffer, username: string, authTargetName: string, ntlmhash: Buffer, nonce: string, timestamp: string) {
    let ntlm2hash = Hash.createNTLMv2Hash(ntlmhash, username, authTargetName);
    let ntlm2response = Hash.createNTLMv2Response(type2message, username, authTargetName, ntlmhash, nonce, timestamp, true);
    let hmac = crypto.createHmac('md5', ntlm2hash);
    let session_base_key = hmac.update(ntlm2response.slice(0,16)).digest();
    let key_exchange_key = session_base_key;
    //create MIC hash
    hmac = crypto.createHmac('md5', key_exchange_key);
    hmac.update(type1message);
    hmac.update(type2message.raw);
    hmac.update(type3message);
    let hashedBuffer = hmac.digest();
    return hashedBuffer;
  }

  static createRandomSessionKey(type2message: Type2Message, username: string, authTargetName: string, ntlmhash: Buffer, nonce: string, timestamp: string, withMic: boolean) {
    let ntlm2hash = Hash.createNTLMv2Hash(ntlmhash, username, authTargetName);
    let ntlm2response = Hash.createNTLMv2Response(type2message, username, authTargetName, ntlmhash, nonce, timestamp, withMic);
    let hmac = crypto.createHmac('md5', ntlm2hash);
    let session_base_key = hmac.update(ntlm2response.slice(0,16)).digest();
    let key_exchange_key = session_base_key;

    let exported_session_key_hex = Hash.createPseudoRandomValue(32);
    let exported_session_key = Buffer.from(exported_session_key_hex, 'hex');
    let rc4 = crypto.createCipheriv('rc4', key_exchange_key, '');
    let encrypted_random_session_key = rc4.update(exported_session_key);
    return encrypted_random_session_key;
  }

  static createPseudoRandomValue(length: number) {
    let str = '';
    while (str.length < length) {
      str += Math.floor(Math.random() * 16).toString(16);
    }
    return str;
  }

  static createTimestamp() {
    //TODO: we are loosing precision here since js is not able to handle those large integers
    // maybe think about a different solution here
    // 11644473600000 = diff between 1970 and 1601
    return ((Date.now() + 11644473600000) * 10000).toString(16);
  }
}
