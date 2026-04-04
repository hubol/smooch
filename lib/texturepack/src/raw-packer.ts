import { binPack } from "./bin-pack";
import { RawPackerOptions } from "./options";
import { Bin } from "maxrects-packer";
import { AsyncReturnType } from "../../common/async-return-type";
import { Infer } from "superstruct";
import { Logger } from "../../common/logger";
import { readImage } from "../../common/read-image";
import { Path } from "../../common/path";
import { Native } from "../../common/native/native-module";

const logger = new Logger("RawPacker", "magenta");

type Block = AsyncReturnType<typeof filePathToBlocks>[number];
type PackedBlock = ReturnType<typeof binPack<Block>>[number]["rects"][number];

const filePathToBlocks = async (filePath: Path.File.t) => {
    const result = await readImage(filePath);

    if (!result) {
        logger.error(`Failed to read dimensions of image file: ${filePath}`);
        return [];
    }

    if (!result.width || !result.height) {
        logger.error(`Read malformed dimensions (${result.width}, ${result.height}) for image file: ${filePath}`);
        return [];
    }

    const { buffer, height, width } = result;

    return [{ buffer, filePath, height, width }];
};

const compositeBinImage = async (width: number, height: number, blocks: PackedBlock[]) => {
    const binBuffer = new Uint8Array(4 * width * height);

    for (const block of blocks) {
        for (let y = 0; y < block.height; y++) {
            block.buffer.copy(
                binBuffer,
                (block.x + ((block.y + y) * width)) * 4,
                y * block.width * 4,
                (y + 1) * block.width * 4,
            );
        }
    }

    return await Native.Sharp(binBuffer, { raw: { channels: 4, width, height, premultiplied: true } })
        .png()
        .toBuffer();
};

export const packTextures = async (filePaths: Path.File.t[], options: Infer<typeof RawPackerOptions>) => {
    const { pack: packOptions } = options;
    const blocks = (await Promise.all(filePaths.map(filePathToBlocks))).flat();

    const bins = binPack(blocks, packOptions) as (Bin<PackedBlock> & { imageBuffer: Buffer })[];

    await Promise.all(
        bins.map(async bin => bin.imageBuffer = await compositeBinImage(bin.width, bin.height, bin.rects)),
    );

    logger.log(`Created ${bins.length} image buffer(s) for ${filePaths.length} texture(s)`);

    return bins;
};

export type Atlas = AsyncReturnType<typeof packTextures>[number];
