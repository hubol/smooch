import { Struct, coerce, string } from "superstruct";
import { Path } from "./path";

export const SmoochStruct = {
    FilePath: coerce(string() as unknown as Struct<Path.File.t, null>, string(), (value) => Path.File.create(value)),
    DirectoryPath: coerce(string() as unknown as Struct<Path.Directory.t, null>, string(), (value) => Path.Directory.create(value)),
    GlobPath: coerce(string() as unknown as Struct<Path.Glob.t, null>, string(), (value) => Path.Glob.create(value)),
}