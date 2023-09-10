import { Environment } from "./environment";

// @ts-ignore
export const requireImpl = Environment.isDev ? require : __non_webpack_require__;

export function requireModule(path: string) {
    return requireImpl(path);
}