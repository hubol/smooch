import { Fs } from "./fs";
import { normalizeWindowsPathSeparator } from "./gwob";

export namespace Path {
    export namespace File {
        export type t = string & {
            readonly __tag: unique symbol;
        };

        export function create(value: string) {
            return value as t;
        }
    }

    export namespace Directory {
        export type t = string & {
            readonly __tag: unique symbol;
        };

        export function create(value: string) {
            return value as t;
        }
    }

    export namespace Glob {
        export type t = string & {
            readonly __tag: unique symbol;
        };

        export function create(value: string, ...rest: string[]) {
            return normalizeWindowsPathSeparator(Fs.resolve(value, ...rest)) as t;
        }
    }
}
