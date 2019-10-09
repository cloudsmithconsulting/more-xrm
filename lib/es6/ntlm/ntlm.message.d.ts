/// <reference types="node" />
export declare class NtlmMessage {
    raw: Buffer;
    constructor(buf: Buffer);
    header(): string;
}
