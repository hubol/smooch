import _path from "path";

export class CwdRelativePath implements RelativePath {
    readonly absolutePath: string;

    constructor(readonly path: string) {
        this.absolutePath = _path.resolve(process.cwd(), path);
    }

    toString() {
        return `${this.path} (${this.absolutePath})`;
    }
}

export interface RelativePath {
    readonly path: string;
    readonly absolutePath: string;
}