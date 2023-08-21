import { Environment } from "./environment";
import { Fs } from "./fs";
import { Path } from "./path";

export function defaultTemplateFile(fileName: string) {
    return Path.File.create(Fs.resolve(__filename,
        Environment.isDev ? `../../../dist/templates/${fileName}`
        : `../templates/${fileName}`));
}