import { minimatch } from "minimatch";

export function globMatch(path: string) {
    if (!cache[path])
        cache[path] = minimatch.filter(normalizeWindowsPathSeparator(path));
    return cache[path];
}

function normalizeWindowsPathSeparator(path: string) {
    return path.replace(/\\/g, '/');
}

const cache: Record<string, ReturnType<typeof minimatch.filter>> = {};