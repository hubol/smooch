import { glob } from "glob";
import { minimatch } from "minimatch";
import { Path } from "./path";

function globMatch(path: Path.Glob.t) {
    if (!cache[path])
        cache[path] = minimatch.filter(path);
    return cache[path];
}

const cache: Record<string, ReturnType<typeof minimatch.filter>> = {};

export function normalizeWindowsPathSeparator(path: string) {
    return path.replace(/\\/g, '/');
}

const globFiles: typeof glob = function (patterns: Path.Glob.t | Path.Glob.t[], ...args) {
    return glob(patterns, ...args);
} as any;

export const Gwob = {
    match: globMatch,
    files: globFiles,
}