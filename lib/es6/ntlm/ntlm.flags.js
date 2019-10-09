'use strict';
export var NtlmFlags;
(function (NtlmFlags) {
    /* Indicates that Unicode strings are supported for use in security buffer
       data. */
    NtlmFlags[NtlmFlags["NEGOTIATE_UNICODE"] = 1] = "NEGOTIATE_UNICODE";
    /* Indicates that OEM strings are supported for use in security buffer data. */
    NtlmFlags[NtlmFlags["NEGOTIATE_OEM"] = 2] = "NEGOTIATE_OEM";
    /* Requests that the server's authentication realm be included in the Type 2
       message. */
    NtlmFlags[NtlmFlags["REQUEST_TARGET"] = 4] = "REQUEST_TARGET";
    /* unknown (1<<3) */
    /* Specifies that authenticated communication between the client and server
       should carry a digital signature (message integrity). */
    NtlmFlags[NtlmFlags["NEGOTIATE_SIGN"] = 16] = "NEGOTIATE_SIGN";
    /* Specifies that authenticated communication between the client and server
       should be encrypted (message confidentiality). */
    NtlmFlags[NtlmFlags["NEGOTIATE_SEAL"] = 32] = "NEGOTIATE_SEAL";
    /* Indicates that datagram authentication is being used. */
    NtlmFlags[NtlmFlags["NEGOTIATE_DATAGRAM_STYLE"] = 64] = "NEGOTIATE_DATAGRAM_STYLE";
    /* Indicates that the LAN Manager session key should be used for signing and
       sealing authenticated communications. */
    NtlmFlags[NtlmFlags["NEGOTIATE_LM_KEY"] = 128] = "NEGOTIATE_LM_KEY";
    /* unknown purpose */
    NtlmFlags[NtlmFlags["NEGOTIATE_NETWARE"] = 256] = "NEGOTIATE_NETWARE";
    /* Indicates that NTLM authentication is being used. */
    NtlmFlags[NtlmFlags["NEGOTIATE_NTLM_KEY"] = 512] = "NEGOTIATE_NTLM_KEY";
    /* unknown (1<<10) */
    /* Sent by the client in the Type 3 message to indicate that an anonymous
       context has been established. This also affects the response fields. */
    NtlmFlags[NtlmFlags["NEGOTIATE_ANONYMOUS"] = 2048] = "NEGOTIATE_ANONYMOUS";
    /* Sent by the client in the Type 1 message to indicate that a desired
       authentication realm is included in the message. */
    NtlmFlags[NtlmFlags["NEGOTIATE_DOMAIN_SUPPLIED"] = 4096] = "NEGOTIATE_DOMAIN_SUPPLIED";
    /* Sent by the client in the Type 1 message to indicate that the client
       workstation's name is included in the message. */
    NtlmFlags[NtlmFlags["NEGOTIATE_WORKSTATION_SUPPLIED"] = 8192] = "NEGOTIATE_WORKSTATION_SUPPLIED";
    /* Sent by the server to indicate that the server and client are on the same
       machine. Implies that the client may use a pre-established local security
       context rather than responding to the challenge. */
    NtlmFlags[NtlmFlags["NEGOTIATE_LOCAL_CALL"] = 16384] = "NEGOTIATE_LOCAL_CALL";
    /* Indicates that authenticated communication between the client and server
       should be signed with a "dummy" signature. */
    NtlmFlags[NtlmFlags["NEGOTIATE_ALWAYS_SIGN"] = 32768] = "NEGOTIATE_ALWAYS_SIGN";
    /* Sent by the server in the Type 2 message to indicate that the target
       authentication realm is a domain. */
    NtlmFlags[NtlmFlags["TARGET_TYPE_DOMAIN"] = 65536] = "TARGET_TYPE_DOMAIN";
    /* Sent by the server in the Type 2 message to indicate that the target
       authentication realm is a server. */
    NtlmFlags[NtlmFlags["TARGET_TYPE_SERVER"] = 131072] = "TARGET_TYPE_SERVER";
    /* Sent by the server in the Type 2 message to indicate that the target
       authentication realm is a share. Presumably, this is for share-level
       authentication. Usage is unclear. */
    NtlmFlags[NtlmFlags["TARGET_TYPE_SHARE"] = 262144] = "TARGET_TYPE_SHARE";
    /* Indicates that the NTLM2 signing and sealing scheme should be used for
       protecting authenticated communications. */
    NtlmFlags[NtlmFlags["NEGOTIATE_NTLM2_KEY"] = 524288] = "NEGOTIATE_NTLM2_KEY";
    /* unknown purpose */
    NtlmFlags[NtlmFlags["REQUEST_INIT_RESPONSE"] = 1048576] = "REQUEST_INIT_RESPONSE";
    /* unknown purpose */
    NtlmFlags[NtlmFlags["REQUEST_ACCEPT_RESPONSE"] = 2097152] = "REQUEST_ACCEPT_RESPONSE";
    /* unknown purpose */
    NtlmFlags[NtlmFlags["REQUEST_NONNT_SESSION_KEY"] = 4194304] = "REQUEST_NONNT_SESSION_KEY";
    /* Sent by the client in the Type 1 message to request Target info block from server.
       Sent by the server in the Type 2 message to indicate that it is including a
       Target Information block in the message. */
    NtlmFlags[NtlmFlags["NEGOTIATE_TARGET_INFO"] = 8388608] = "NEGOTIATE_TARGET_INFO";
    /* unknown (1<24) */
    /* Indicates that the version info block is included in the message */
    NtlmFlags[NtlmFlags["NEGOTIATE_VERSION"] = 33554432] = "NEGOTIATE_VERSION";
    /* unknown (1<26) */
    /* unknown (1<27) */
    /* unknown (1<28) */
    /* Indicates that 128-bit encryption is supported. */
    NtlmFlags[NtlmFlags["NEGOTIATE_128"] = 536870912] = "NEGOTIATE_128";
    /* Indicates that the client will provide an encrypted master key in
       the "Session Key" field of the Type 3 message. */
    NtlmFlags[NtlmFlags["NEGOTIATE_KEY_EXCHANGE"] = 1073741824] = "NEGOTIATE_KEY_EXCHANGE";
    /* Indicates that 56-bit encryption is supported. */
    NtlmFlags[NtlmFlags["NEGOTIATE_56"] = -2147483648] = "NEGOTIATE_56";
})(NtlmFlags || (NtlmFlags = {}));
//# sourceMappingURL=ntlm.flags.js.map