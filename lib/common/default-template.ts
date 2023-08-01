import { Fs } from "./fs";
import { Path } from "./path";

export function defaultTemplateFile(fileName: string) {
    return Path.File.create(Fs.resolve(__filename, `../templates/${fileName}`));
}