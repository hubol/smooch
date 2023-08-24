import { GlobOptionsWithFileTypesUnset, glob } from "glob";
import { minimatch } from "minimatch";
import { Path } from "./path";
import { Logger } from "./logger";

function globMatch(path: Path.Glob.t) {
    if (!cache[path])
        cache[path] = minimatch.filter(path);
    return cache[path];
}

const cache: Record<string, ReturnType<typeof minimatch.filter>> = {};

const windowsPathSeparatorRegExp = /\\/g;

export function normalizeWindowsPathSeparator(path: string) {
    return path.replace(windowsPathSeparatorRegExp, '/');
}

function globFiles(patterns: Path.Glob.t | Path.Glob.t[], options?: GlobOptionsWithFileTypesUnset) {
    return glob(patterns, options);
}

const wildcardRegExp = /[*?[]+/;

function globRoot(glob: Path.Glob.t) {
    if (globRootCache[glob])
        return globRootCache[glob];

    const components = glob.split('/');
    let path = '';
    for (const component of components) {
        if (wildcardRegExp.test(component))
            break;

        path += component + '/';
    }

    return globRootCache[glob] = path;
}

const globRootCache: Record<string, string> = {};

export const Gwob = {
    match: globMatch,
    files: globFiles,
    root: globRoot,
}