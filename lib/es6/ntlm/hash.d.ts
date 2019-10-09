/// <reference types="node" />
import { Type2Message } from './type2.message';
export declare class Hash {
    static createLMResponse(challenge: Buffer, lmhash: Buffer): Buffer;
    static createLMHash(password: string): Buffer;
    static calculateDES(key: Buffer, message: Buffer): Buffer;
    static createNTLMResponse(challenge: Buffer, ntlmhash: Buffer): Buffer;
    static createNTLMHash(password: string): Buffer;
    static createNTLMv2Hash(ntlmhash: Buffer, username: string, authTargetName: string): Buffer;
    static createLMv2Response(type2message: Type2Message, username: string, authTargetName: string, ntlmhash: Buffer, nonce: string): Buffer;
    static createNTLMv2Response(type2message: Type2Message, username: string, authTargetName: string, ntlmhash: Buffer, nonce: string, timestamp: string, withMic: boolean): Buffer;
    static createMIC(type1message: Buffer, type2message: Type2Message, type3message: Buffer, username: string, authTargetName: string, ntlmhash: Buffer, nonce: string, timestamp: string): Buffer;
    static createRandomSessionKey(type2message: Type2Message, username: string, authTargetName: string, ntlmhash: Buffer, nonce: string, timestamp: string, withMic: boolean): Buffer;
    static createPseudoRandomValue(length: number): string;
    static createTimestamp(): string;
}
