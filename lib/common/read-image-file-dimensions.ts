import { Native } from "./native/native-module";
import { Path } from "./path";

export async function readImageFileDimensions(filePath: Path.File.t) {
    const { width, height } = await Native.Sharp(filePath).metadata();
    return { width, height };
}
