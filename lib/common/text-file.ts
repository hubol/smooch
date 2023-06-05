import { PathLike } from "fs";
import { Fs } from "./fs";
import { RethrownError } from "./rethrown-error";

export const TextFile = {
	async read(path: PathLike) {
        try {
            return await Fs.readFile(path, 'utf8');
        }
        catch (e) {
            throw new RethrownError(`Failed to read Text file [${path}]. Does it exist?`, e);
        }
	}
}