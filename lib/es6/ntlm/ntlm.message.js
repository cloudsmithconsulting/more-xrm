export class NtlmMessage {
    constructor(buf) {
        this.raw = buf;
    }
    header() {
        return 'NTLM ' + this.raw.toString('base64');
    }
}
//# sourceMappingURL=ntlm.message.js.map