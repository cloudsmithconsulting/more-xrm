// All code in this folder is heavily based on the node project ntlm-client.
// https://github.com/clncln1/node-ntlm-client
// ----------------------------------------------------------------------------
// Original license statement:
// Copyright (c) 2015 Nico Haller
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.  IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.
// ----------------------------------------------------------------------------
'use strict';
import { NtlmFlags } from './ntlm.flags';
import { NtlmConstants } from './ntlm.constants';
import { Hash } from './hash';
import * as os from 'os';
import { Type2Message } from './type2.message';
import { NtlmMessage } from './ntlm.message';
export default function ntlm() {
    return new Ntlm();
}
export class Ntlm {
    createType1Message(ntlm_version, workstation, target) {
        let dataPos = 40;
        let pos = 0;
        let buf = Buffer.alloc(256);
        if (target === undefined) {
            target = '';
        }
        if (workstation === undefined) {
            workstation = os.hostname().toUpperCase();
        }
        //signature
        buf.write(NtlmConstants.NTLM_SIGNATURE, pos, NtlmConstants.NTLM_SIGNATURE.length, 'ascii');
        pos += NtlmConstants.NTLM_SIGNATURE.length;
        //message type
        buf.writeUInt32LE(1, pos);
        pos += 4;
        //flags
        let messageFlags = NtlmFlags.NEGOTIATE_OEM |
            NtlmFlags.NEGOTIATE_ALWAYS_SIGN |
            NtlmFlags.NEGOTIATE_VERSION;
        if (ntlm_version == 1) {
            messageFlags |= NtlmFlags.NEGOTIATE_NTLM_KEY |
                NtlmFlags.NEGOTIATE_LM_KEY;
        }
        else {
            messageFlags |= NtlmFlags.NEGOTIATE_NTLM2_KEY;
        }
        if (target.length > 0) {
            messageFlags |= NtlmFlags.NEGOTIATE_DOMAIN_SUPPLIED;
        }
        if (workstation.length > 0) {
            messageFlags |= NtlmFlags.NEGOTIATE_WORKSTATION_SUPPLIED;
        }
        // special operator to force conversion to unsigned
        buf.writeUInt32LE(messageFlags >>> 0, pos);
        pos += 4;
        //domain security buffer
        buf.writeUInt16LE(target.length, pos);
        pos += 2;
        buf.writeUInt16LE(target.length, pos);
        pos += 2;
        buf.writeUInt32LE(dataPos, pos);
        pos += 4;
        if (target.length > 0) {
            dataPos += buf.write(target, dataPos, 'ascii');
        }
        //workstation security buffer
        buf.writeUInt16LE(workstation.length, pos);
        pos += 2;
        buf.writeUInt16LE(workstation.length, pos);
        pos += 2;
        buf.writeUInt32LE(dataPos, pos);
        pos += 4;
        if (workstation.length > 0) {
            dataPos += buf.write(workstation, dataPos, 'ascii');
        }
        this.addVersionStruct(buf, pos);
        return new NtlmMessage(buf.slice(0, dataPos));
    }
    // Version - hard-coded to
    // Major version 10, minor version 0 (Windows 10)
    // build number 18362 (1903 update), NTLM revision 15
    addVersionStruct(buf, pos) {
        buf.writeUInt8(10, pos);
        pos++;
        buf.writeUInt8(0, pos);
        pos++;
        buf.writeUInt16LE(18362, pos);
        pos += 2;
        buf.writeUInt32LE(0x0F000000, pos);
        pos += 4;
        return pos;
    }
    decodeType2Message(str) {
        if (str === undefined) {
            throw new Error('Invalid argument');
        }
        let ntlmMatch = /^NTLM ([^,\s]+)/.exec(str);
        if (ntlmMatch) {
            str = ntlmMatch[1];
        }
        let buf = Buffer.from(str, 'base64');
        let type2message = new Type2Message(buf);
        return type2message;
    }
    createType3Message(type1message, type2message, username, password, workstation, target, client_nonce_override, timestamp_override) {
        let dataPos = 72;
        let buf = Buffer.alloc(1024);
        if (workstation === undefined) {
            workstation = os.hostname().toUpperCase();
        }
        if (target === undefined) {
            target = type2message.targetName;
        }
        //signature
        buf.write(NtlmConstants.NTLM_SIGNATURE, 0, NtlmConstants.NTLM_SIGNATURE.length, 'ascii');
        //message type
        buf.writeUInt32LE(3, 8);
        let targetLen = type2message.encoding === 'ascii' ? target.length : target.length * 2;
        let usernameLen = type2message.encoding === 'ascii' ? username.length : username.length * 2;
        let workstationLen = type2message.encoding === 'ascii' ? workstation.length : workstation.length * 2;
        let dataPosOffset = targetLen + usernameLen + workstationLen;
        let timestamp = '';
        let client_nonce = '';
        let withMic = false;
        let withServerTimestamp = false;
        if (type2message.version === 2 &&
            type2message.targetInfo &&
            type2message.targetInfo.parsed['SERVER_TIMESTAMP']) { // Must include MIC, add room for it
            withServerTimestamp = true;
            withMic = true;
            dataPos += 16;
        }
        let hashDataPos = dataPos + dataPosOffset;
        let ntlmHash = Hash.createNTLMHash(password);
        if (type2message.version === 2) {
            client_nonce = client_nonce_override || Hash.createPseudoRandomValue(16);
            if (withServerTimestamp) { // Use server timestamp if provided
                timestamp = type2message.targetInfo.parsed['SERVER_TIMESTAMP'];
            }
            else {
                timestamp = timestamp_override || Hash.createTimestamp();
            }
            let lmv2;
            if (withServerTimestamp) {
                lmv2 = Buffer.alloc(24); // zero-filled
            }
            else {
                lmv2 = Hash.createLMv2Response(type2message, username, target, ntlmHash, client_nonce);
            }
            //lmv2 security buffer
            buf.writeUInt16LE(lmv2.length, 12);
            buf.writeUInt16LE(lmv2.length, 14);
            buf.writeUInt32LE(hashDataPos, 16);
            lmv2.copy(buf, hashDataPos);
            hashDataPos += lmv2.length;
            let ntlmv2 = Hash.createNTLMv2Response(type2message, username, target, ntlmHash, client_nonce, timestamp, withMic);
            //ntlmv2 security buffer
            buf.writeUInt16LE(ntlmv2.length, 20);
            buf.writeUInt16LE(ntlmv2.length, 22);
            buf.writeUInt32LE(hashDataPos, 24);
            ntlmv2.copy(buf, hashDataPos);
            hashDataPos += ntlmv2.length;
        }
        else {
            let lmHash = Hash.createLMHash(password);
            let lm = Hash.createLMResponse(type2message.challenge, lmHash);
            let ntlm = Hash.createNTLMResponse(type2message.challenge, ntlmHash);
            //lm security buffer
            buf.writeUInt16LE(lm.length, 12);
            buf.writeUInt16LE(lm.length, 14);
            buf.writeUInt32LE(hashDataPos, 16);
            lm.copy(buf, hashDataPos);
            hashDataPos += lm.length;
            //ntlm security buffer
            buf.writeUInt16LE(ntlm.length, 20);
            buf.writeUInt16LE(ntlm.length, 22);
            buf.writeUInt32LE(hashDataPos, 24);
            ntlm.copy(buf, hashDataPos);
            hashDataPos += ntlm.length;
        }
        //target name security buffer
        buf.writeUInt16LE(targetLen, 28);
        buf.writeUInt16LE(targetLen, 30);
        buf.writeUInt32LE(dataPos, 32);
        dataPos += buf.write(target, dataPos, type2message.encoding);
        //user name security buffer
        buf.writeUInt16LE(usernameLen, 36);
        buf.writeUInt16LE(usernameLen, 38);
        buf.writeUInt32LE(dataPos, 40);
        dataPos += buf.write(username, dataPos, type2message.encoding);
        //workstation name security buffer
        buf.writeUInt16LE(workstationLen, 44);
        buf.writeUInt16LE(workstationLen, 46);
        buf.writeUInt32LE(dataPos, 48);
        dataPos += buf.write(workstation, dataPos, type2message.encoding);
        //session key security buffer
        let session_key = Buffer.alloc(0);
        // if (type2message.flags & NtlmFlags.NEGOTIATE_KEY_EXCHANGE) {
        //   session_key = hash.createRandomSessionKey(type2message, username, target, ntlmHash, client_nonce, timestamp, withMic);
        // }
        buf.writeUInt16LE(session_key.length, 52);
        buf.writeUInt16LE(session_key.length, 54);
        buf.writeUInt32LE(hashDataPos, 56);
        session_key.copy(buf, hashDataPos);
        hashDataPos += session_key.length;
        //flags
        buf.writeUInt32LE(type2message.flags, 60);
        this.addVersionStruct(buf, 64);
        if (withMic) {
            // Calculate and add MIC
            let mic = Hash.createMIC(type1message.raw, type2message, buf.slice(0, hashDataPos), username, target, ntlmHash, client_nonce, timestamp);
            mic.copy(buf, 72);
        }
        return new NtlmMessage(buf.slice(0, hashDataPos));
        //return 'NTLM ' + buf.toString('base64', 0, hashDataPos);
    }
}
//# sourceMappingURL=ntlm.js.map