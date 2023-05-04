import { PathLike } from "fs";
import { RethrownError } from "./rethrown-error";
import { Fs } from "./fs";

export const JsonFile = {
	async read(path: PathLike) {
        try {
            const jsonText = await Fs.readFile(path, 'utf8');
		    return JSON.parse(jsonText);
        }
        catch (e) {
            throw new RethrownError(`Failed to read JSON file [${path}]. Does it exist?`, e);
        }
	}
}