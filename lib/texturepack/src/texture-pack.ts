import { PackerOptions } from "./options";
import { JsTemplate } from "../../common/template";
import { packTextures } from "./raw-packer";
import { Infer } from "superstruct";
import { merge } from "../../common/merge";
import { AsyncReturnType } from "../../common/async-return-type";
import { sortArrayByKey } from "../../common/sort-array-by-key";
import { Fs } from "../../common/fs";
import { Logger } from "../../common/logger";
import { SmoochWorkPipelineRecipeFactory } from "../../main/pipeline/smooch-work-pipeline";
import { SmoochWorkAcceptor } from "../../main/pipeline/smooch-work-acceptor";
import { SmoochWorkQueue } from "../../main/pipeline/smooch-work-queue";
import { Path } from "../../common/path";
import { Gwob } from "../../common/gwob";
import { GlobRoot } from "../../common/glob-root";

const logger = new Logger('TexturePacker', 'magenta');

export const TexturePackRecipe = SmoochWorkPipelineRecipeFactory.create({
	name: 'texPack',
	configSchema: PackerOptions,
	acceptorFactory: options => {
		return new SmoochWorkAcceptor([ options.glob ], [ Path.Glob.create(options.template.program) ], []);
	},
	queueFactory: () => new SmoochWorkQueue(),
	workFnFactory: options => () => texturePack(options),
});

export const texturePack = async (options: Infer<typeof PackerOptions>) => {
	const { glob } = options;

	const jsTemplate = await JsTemplate.fromFile(options.template.program);

	logger.log(`Loading images from folder ${glob}...`);

	const imageFilePaths = await Gwob.files(glob);

	if (!imageFilePaths.length)
		logger.warn(`No images found matching ${glob}`);

	const atlases = await createAtlases(imageFilePaths, options);

	await Fs.mkdir(options.atlas.directory, { recursive: true });
	await Promise.all(atlases.map((atlas, i) => {
		const file = Fs.resolve(options.atlas.directory, atlas.fileName);
		logger.log(`Writing atlas ${i + 1} of ${atlases.length} to ${file}...`);
		return Fs.writeFile(file, atlas.imageBuffer);
	}));

	const globRoot = Gwob.root(glob);
	const context = createTemplateContext(atlases, globRoot);
	await jsTemplate.renderToFile(context, options.template.out);

	logger.log("Packed");
};

async function createAtlases(imageFilePaths: string[], options: Infer<typeof PackerOptions>) {
	return (await packTextures(imageFilePaths, options))
		.map((atlas, i) => merge(atlas, { fileName: `${options.atlas.filePrefix}${i}.png` }));
}

type Atlases = AsyncReturnType<typeof createAtlases>;

function createTemplateContext(atlases: Atlases, globRoot: GlobRoot) {
	const textures = sortArrayByKey(atlases.flatMap(atlas => convertRectsToContextTextures(atlas, globRoot)), 'fileName');
	return { atlases, textures };
}

export type PackTextureTemplateContext = ReturnType<typeof createTemplateContext>;

const convertRectsToContextTextures = (atlas: Atlases[number], globRoot: GlobRoot) => atlas.rects.map(rect => ({
	atlasFileName: atlas.fileName,
	fileName: rect.filePath.substring(Fs.resolve(globRoot).length),
	x: rect.x,
	y: rect.y,
	width: rect.width,
	height: rect.height,
}));