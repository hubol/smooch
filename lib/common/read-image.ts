import { Native } from "./native/native-module";
import { Path } from "./path";

export async function readImage(filePath: Path.File.t) {
    const image = Native.Sharp(filePath);
    const [
        buffer,
        { width, height },
    ] = await Promise.all([
        image.raw().ensureAlpha().toBuffer(),
        image.metadata(),
    ]);

    return { buffer, width, height };
}
