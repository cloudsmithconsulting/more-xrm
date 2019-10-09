"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class NtlmMessage {
    constructor(buf) {
        this.raw = buf;
    }
    header() {
        return 'NTLM ' + this.raw.toString('base64');
    }
}
exports.NtlmMessage = NtlmMessage;
//# sourceMappingURL=ntlm.message.js.map