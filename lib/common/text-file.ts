import { PathLike } from "fs";
import { Fs } from "./fs";

export const TextFile = {
    async read(path: PathLike) {
        return await Fs.readFile(path, "utf8");
    },
    readSync(path: PathLike) {
        return Fs.readFileSync(path, "utf8");
    },
};
