import fs from "fs";
import util from "util";
import path from "path";
import { normalizeWindowsPathSeparator } from "./gwob";

function resolve(...paths: string[]) {
    return normalizeWindowsPathSeparator(path.resolve(...paths));
}

const fsMkdir = util.promisify(fs.mkdir);

const mkdir = async (...args: Parameters<typeof fsMkdir>) => {
    if (typeof args[0] === 'string' && !args[0].trim())
        return;
    await fsMkdir(...args);
}

export const Fs = {
    createWriteStream: fs.createWriteStream,
    readFile: util.promisify(fs.readFile),
    readFileSync: fs.readFileSync,
    writeFile: util.promisify(fs.writeFile),
    copyFile: util.promisify(fs.copyFile),
    mkdir,
    rm: util.promisify(fs.rm),
    exists: util.promisify(fs.exists),
    rename: util.promisify(fs.rename),
    ...path,
    resolve
}