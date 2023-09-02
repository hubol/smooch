import { Struct, coerce, object, string } from "superstruct";
import { Path } from "./path";

const FilePath = coerce(string() as unknown as Struct<Path.File.t, null>, string(), (value) => Path.File.create(value));
const DirectoryPath = coerce(string() as unknown as Struct<Path.Directory.t, null>, string(), (value) => Path.Directory.create(value));
const GlobPath = coerce(string() as unknown as Struct<Path.Glob.t, null>, string(), (value) => Path.Glob.create(value));
const FileExtension = coerce(string(), string(), (value) => value.trim().toLocaleLowerCase('en-US').replace(/\./g, ''));

export const SmoochStruct = {
    FilePath,
    DirectoryPath,
    GlobPath,
    Template: object({
        program: FilePath,
        out: FilePath,
    }),
    FileExtension,
}