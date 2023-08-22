import { glob } from "glob";
import { minimatch } from "minimatch";

function globMatch(path: string) {
    if (!cache[path])
        cache[path] = minimatch.filter(normalizeWindowsPathSeparator(path));
    return cache[path];
}

const cache: Record<string, ReturnType<typeof minimatch.filter>> = {};

export function normalizeWindowsPathSeparator(path: string) {
    return path.replace(/\\/g, '/');
}

const globFiles: typeof glob = function (patterns, ...args) {
    if (Array.isArray(patterns))
        return glob(patterns.map(normalizeWindowsPathSeparator), ...args);
    return glob(normalizeWindowsPathSeparator(patterns), ...args);
} as any;

export const Gwob = {
    match: globMatch,
    files: globFiles,
}