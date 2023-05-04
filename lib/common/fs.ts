import fs from "fs";
import util from "util";
import path from "path";

export const Fs = {
    readFile: util.promisify(fs.readFile),
    writeFile: util.promisify(fs.writeFile),
    mkdir: util.promisify(fs.mkdir),
    ...path,
}