import { Environment } from "./environment";

// @ts-ignore
const _requireImpl = Environment.isDev ? require : __non_webpack_require__;

export const requireModule: RequireModule = _requireImpl;

interface RequireModule {
    <T = any>(module: string): T;
    cache: Record<string, unknown>;
}