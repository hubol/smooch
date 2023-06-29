import path from "path";
import sharp from "sharp";
import { binPack } from "./bin-pack";
import { RawPackerOptions } from "./options";
import { Bin } from "maxrects-packer";
import { AsyncReturnType } from "../../common/async-return-type";
import { Infer } from "superstruct";
import { Logger } from "../../common/logger";

const logger = new Logger('RawPacker', 'magenta');

type Block = { width: number, height: number, file: string, atlas?: { i: number, j: number, n: number, m: number } };
type PackedBlock = ReturnType<typeof binPack<Block>>[number]['rects'][number];

const ATLAS_REGEX = /^[^\.]+[^\.\d](\d+)x(\d+)\.[^\.]+$/;
const filePathToBlocks = async (filePath: string) => {
	const { width, height } = await sharp(filePath).metadata();
	const fileName = path.basename(filePath);
	const block: Block = { width: width!, height: height!, file: filePath };
	if (ATLAS_REGEX.test(fileName)) {
		// @ts-ignore
		const [, columns, rows] = ATLAS_REGEX.exec(fileName);
		const n = parseInt(columns);
		const m = parseInt(rows);
		const w = width! / n;
		const h = height! / m;
		const blocks: Block[] = [];
		for (let j = 0; j < m; j++) {
			for (let i = 0; i < n; i++) {
				blocks.push({
					width: w,
					height: h,
					file: filePath,
					atlas: { i, j, n, m }
				});
			}
		}
		return blocks;
	}
	return [block];
};

const computeMainImage = async (width: number, height: number, blocks: PackedBlock[]) => {
	const list = await Promise.all(
		blocks.map(async (block) => {
			let input: any = block.file;
			if (block.atlas) {
				const { i, j } = block.atlas;
				const blockW = block.width;
				const blockH = block.height;
				const sharpObjfer = await sharp(input)
					.extract({
						left: i * blockW,
						top: j * blockH,
						width: blockW,
						height: blockH
					})
					.toBuffer();
				input = sharpObjfer;
			}
			return {
				left: block.x,
				top: block.y,
				input
			};
		})
	);

	const maxSize = 100;
	const packsNum = Math.ceil(list.length / maxSize);
	const packs = new Array(packsNum);
	for (let i = 0; i < packsNum; i++) {
		packs[i] = list.slice(
			i * maxSize,
			Math.min((i + 1) * maxSize, list.length)
		);
	}

	let buff = await sharp({
		create: {
			width,
			height,
			channels: 4,
			background: { r: 0, g: 0, b: 0, alpha: 0 }
		}
	})
		.png()
		.toBuffer();

	let images = 0;
	while (packs.length) {
		const pack = packs.pop();
		buff = await sharp(buff).composite(pack).png().toBuffer();
		if (packs.length > 1) {
			logger.log(
				`Processed: ${Math.round(
					(100 * (images += pack.length)) / list.length
				)}%`
			);
		}
	}
	return sharp(buff).toBuffer();
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
