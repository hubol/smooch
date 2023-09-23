import { Path } from "../common/path";

export const Global = {
    cacheDir: Path.Directory.create('.smooch'),
    nativeDepsJsonFile: Path.File.create('smooch-native-deps.json'),
} as const;
