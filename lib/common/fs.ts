import fs from "fs";
import util from "util";
import path from "path";

export const Fs = {
    readFile: util.promisify(fs.readFile),
    writeFile: util.promisify(fs.writeFile),
    copyFile: util.promisify(fs.copyFile),
    mkdir: util.promisify(fs.mkdir),
    rm: util.promisify(fs.rm),
    exists: util.promisify(fs.exists),
    ...path,
}