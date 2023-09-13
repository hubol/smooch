import { Path } from "../common/path";

export const Global = {
    cacheDir: Path.Directory.create('.smooch'),
} as const;
