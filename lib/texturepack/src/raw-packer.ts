import { binPack } from "./bin-pack";
import { RawPackerOptions } from "./options";
import { Bin } from "maxrects-packer";
import { AsyncReturnType } from "../../common/async-return-type";
import { Infer } from "superstruct";
import { Logger } from "../../common/logger";
import { Jimp } from "../../common/jimp";
import { readImageFileDimensions } from "../../common/read-image-file-dimensions";
import { wait } from "../../common/wait";

const logger = new Logger('RawPacker', 'magenta');

type Block = AsyncReturnType<typeof filePathToBlocks>[number];
type PackedBlock = ReturnType<typeof binPack<Block>>[number]['rects'][number];

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

	const loadedBlockJimps: Record<string, AsyncReturnType<typeof Jimp.read>> = { };

	const loadBlockJimpsPromise = Promise.all(blocks.map(async block => {
		loadedBlockJimps[block.filePath] = await Jimp.read(block.filePath);
	}));

	for (const block of blocks) {
		await wait(() => !!loadedBlockJimps[block.filePath]);
		const blockJimp = loadedBlockJimps[block.filePath];
		delete loadedBlockJimps[block.filePath];
		jimp.composite(blockJimp, block.x, block.y);
	}

	await loadBlockJimpsPromise;

	return jimp.getBufferAsync(Jimp.MIME_PNG);
};

export const packTextures = async (filePaths: string[], options: Infer<typeof RawPackerOptions>) => {
	const { pack: packOptions } = options;
	const blocks = (await Promise.all(filePaths.map(filePathToBlocks))).flat();

	const bins = binPack(blocks, packOptions) as (Bin<PackedBlock> & { imageBuffer: Buffer })[];

	await Promise.all(
		bins.map(async bin => bin.imageBuffer = await computeMainImage(bin.width, bin.height, bin.rects)));

	logger.log(`Created ${bins.length} image buffer(s) for ${filePaths.length} texture(s)`);

	return bins;
};

export type Atlas = AsyncReturnType<typeof packTextures>[number];
