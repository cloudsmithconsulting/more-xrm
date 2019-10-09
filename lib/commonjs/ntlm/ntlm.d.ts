import { INtlm } from './interfaces/i.ntlm';
import { Type2Message } from './type2.message';
import { NtlmMessage } from './ntlm.message';
export default function ntlm(): INtlm;
export declare class Ntlm implements INtlm {
    createType1Message(ntlm_version: number, workstation: string | undefined, target: string | undefined): NtlmMessage;
    private addVersionStruct;
    decodeType2Message(str: string | undefined): Type2Message;
    createType3Message(type1message: NtlmMessage, type2message: Type2Message, username: string, password: string, workstation: string | undefined, target: string | undefined, client_nonce_override: string | undefined, timestamp_override: string | undefined): NtlmMessage;
}
