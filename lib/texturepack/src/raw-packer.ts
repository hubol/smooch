import { binPack } from "./bin-pack";
import { RawPackerOptions } from "./options";
import { Bin } from "maxrects-packer";
import { AsyncReturnType } from "../../common/async-return-type";
import { Infer } from "superstruct";
import { Logger } from "../../common/logger";
import { Jimp } from "../../common/jimp";
import { readImageFileDimensions } from "../../common/read-image-file-dimensions";
import { RethrownError } from "../../common/rethrown-error";

const logger = new Logger("RawPacker", "magenta");

type Block = AsyncReturnType<typeof filePathToBlocks>[number];
type PackedBlock = ReturnType<typeof binPack<Block>>[number]["rects"][number];

const filePathToBlocks = async (filePath: string) => {
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
    const jimp = await Jimp.create(width, height);

    const readBlockJimpPromises: Record<string, Promise<AsyncReturnType<typeof Jimp.read> | Error>> = {};

    for (const block of blocks) {
        readBlockJimpPromises[block.filePath] = Jimp.read(block.filePath)
            .catch(r => new RethrownError(`Error while reading ${block.filePath}`, r));
    }

    for (const block of blocks) {
        const blockJimp = await readBlockJimpPromises[block.filePath];
        delete readBlockJimpPromises[block.filePath];
        if (blockJimp instanceof Error) {
            throw blockJimp;
        }
        jimp.composite(blockJimp, block.x, block.y);
    }

    return jimp.getBufferAsync(Jimp.MIME_PNG);
};

export const packTextures = async (filePaths: string[], options: Infer<typeof RawPackerOptions>) => {
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
