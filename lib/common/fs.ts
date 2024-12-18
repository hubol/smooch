import fs from "fs";
import util from "util";
import path from "path";
import { normalizeWindowsPathSeparator } from "./gwob";
import { Logger } from "./logger";
import { EndOfLineSequence, forceEndOfLineSequence as forceEndOfLineSequence } from "./end-of-line-sequence";

const logger = new Logger("Fs", "magenta");

function resolve(...paths: string[]) {
    return normalizeWindowsPathSeparator(path.resolve(...paths));
}

const fsMkdir = util.promisify(fs.mkdir);

const mkdir = async (...args: Parameters<typeof fsMkdir>) => {
    if (typeof args[0] === "string" && !args[0].trim()) {
        return;
    }
    await fsMkdir(...args);
};

let _writeFileEndOfLineSequence: EndOfLineSequence = "os";

const promisifiedWriteFile = util.promisify(fs.writeFile);

const writeFile = async (file: fs.PathOrFileDescriptor, data: string | NodeJS.ArrayBufferView) => {
    if (typeof data === "string") {
        data = forceEndOfLineSequence(data, _writeFileEndOfLineSequence);
    }

    return await promisifiedWriteFile(file, data, {});
};

let loggedEndOfLineSequence = false;

const _setWriteFileEndOfLineSequence = (endOfLineSequence: EndOfLineSequence) => {
    if (!loggedEndOfLineSequence || _writeFileEndOfLineSequence !== endOfLineSequence) {
        logger.info(`Set writeFile End of Line Sequence to ${endOfLineSequence.toUpperCase()}`);
        loggedEndOfLineSequence = true;
    }
    _writeFileEndOfLineSequence = endOfLineSequence;
};

export const Fs = {
    createWriteStream: fs.createWriteStream,
    readFile: util.promisify(fs.readFile),
    readFileSync: fs.readFileSync,
    writeFile,
    copyFile: util.promisify(fs.copyFile),
    mkdir,
    rm: util.promisify(fs.rm),
    exists: util.promisify(fs.exists),
    rename: util.promisify(fs.rename),
    ...path,
    resolve,
    _setWriteFileLineEnding: _setWriteFileEndOfLineSequence,
};
