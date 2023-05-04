import { coerce, instance, string } from "superstruct";
import { CwdRelativePath } from "./relative-path";

export const SmoochStruct = {
    CwdRelativePath: coerce(instance(CwdRelativePath), string(), (value) => new CwdRelativePath(value))
}