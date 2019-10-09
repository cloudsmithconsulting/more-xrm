/// <reference types="node" />
export declare class Type2Message {
    raw: Buffer;
    flags: number;
    encoding: 'ascii' | 'ucs2';
    version: number;
    challenge: Buffer;
    targetName: string;
    targetInfo: any;
    constructor(buf: Buffer);
    private readTargetName;
    private parseTargetInfo;
}
