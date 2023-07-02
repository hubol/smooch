import { Fs } from "./fs";

export class CwdRelativePath implements RelativePath {
    readonly absolutePath: string;

    constructor(readonly path: string) {
        this.absolutePath = Fs.resolve(process.cwd(), path);
    }

    toString() {
        return `${this.path} (${this.absolutePath})`;
    }
}

export class AbsolutePath implements RelativePath {
    readonly absolutePath: string;
    readonly path: string;

    constructor(absolutePath: string | RelativePath, ...additionalNodes: string[]) {
        this.absolutePath = Fs.resolve(
            typeof absolutePath === 'string' ? absolutePath : absolutePath.absolutePath,
            ...additionalNodes);
        this.path = this.absolutePath;
    }

    toString() {
        return this.absolutePath;
    }
}

export interface RelativePath { // TODO rename to Path? Look into newtype?
    readonly path: string; // TODO remove?
    readonly absolutePath: string;
}