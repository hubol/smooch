import fs from "fs";
import util from "util";
import path from "path";

export const Fs = {
    readFile: util.promisify(fs.readFile),
    writeFile: util.promisify(fs.writeFile),
    copyFile: util.promisify(fs.copyFile),
    mkdir: util.promisify(fs.mkdir),
    rmdir: util.promisify(fs.rmdir),
    exists: util.promisify(fs.exists),
    ...path,
}