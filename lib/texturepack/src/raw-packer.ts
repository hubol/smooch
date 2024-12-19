import { binPack } from "./bin-pack";
import { RawPackerOptions } from "./options";
import { Bin } from "maxrects-packer";
import { AsyncReturnType } from "../../common/async-return-type";
import { Infer } from "superstruct";
import { Logger } from "../../common/logger";
import { readImageFileDimensions } from "../../common/read-image-file-dimensions";
import { Path } from "../../common/path";
import { Native } from "../../common/native/native-module";

const logger = new Logger("RawPacker", "magenta");

type Block = AsyncReturnType<typeof filePathToBlocks>[number];
type PackedBlock = ReturnType<typeof binPack<Block>>[number]["rects"][number];

const filePathToBlocks = async (filePath: Path.File.t) => {
    const result = await readImageFileDimensions(filePath);

    if (!result) {
        logger.error(`Failed to read dimensions of image file: ${filePath}`);
        return [];
    }

    if (!result.width || !result.height) {
        logger.error(`Read malformed dimensions (${result.width}, ${result.height}) for image file: ${filePath}`);
        return [];
    }

    const { width, height } = result;

    return [{ width, height, filePath }];
};

const computeMainImage = async (width: number, height: number, blocks: PackedBlock[]) => {
    const create = {
        width,
        height,
        channels: 4 as const,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
    };

    const overlayOptions = blocks.map(block => ({
        left: block.x,
        top: block.y,
        input: block.filePath,
    }));

    return await Native.Sharp({ create })
        .composite(overlayOptions)
        .png()
        .toBuffer();
};

export const packTextures = async (filePaths: Path.File.t[], options: Infer<typeof RawPackerOptions>) => {
    const { pack: packOptions } = options;
    const blocks = (await Promise.all(filePaths.map(filePathToBlocks))).flat();

    const bins = binPack(blocks, packOptions) as (Bin<PackedBlock> & { imageBuffer: Buffer })[];

    await Promise.all(
        bins.map(async bin => bin.imageBuffer = await computeMainImage(bin.width, bin.height, bin.rects)),
    );

    logger.log(`Created ${bins.length} image buffer(s) for ${filePaths.length} texture(s)`);

    return bins;
};

export type Atlas = AsyncReturnType<typeof packTextures>[number];
