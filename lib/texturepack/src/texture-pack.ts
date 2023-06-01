import path from "path";
import { PackerOptions } from "./options";
import { glob } from "glob";
import { JsTemplate } from "../../common/template";
import { packTextures } from "./raw-packer";
import { Infer } from "superstruct";
import { merge } from "../../common/merge";
import { AsyncReturnType } from "../../common/async-return-type";
import { RelativePath } from "../../common/relative-path";
import { sortArrayByKey } from "../../common/sort-array-by-key";
import { Fs } from "../../common/fs";

export const texturePack = async (options: Infer<typeof PackerOptions>) => {
	const { folder: imagesFolder, outFolder, outTemplate, outTemplateExtension, ...rawPackerOptions } = options;
	const { fileName } = rawPackerOptions;

	const template = await JsTemplate.fromFile(outTemplate.absolutePath);

	console.log(`Loading images from folder ${imagesFolder}...`);

	const imageFilePaths = await glob(`/**/*.{png,jpeg,gif,jpg,tiff,webp,bmp}`, { root: imagesFolder.path });

	if (!imageFilePaths.length)
		console.warn(`No images found in ${imagesFolder}`);

	const atlases = await createAtlases(imageFilePaths, options);

	console.log("Writing images...");
	await Fs.mkdir(outFolder.absolutePath, { recursive: true });
	await Promise.all(atlases.map((atlas) => Fs.writeFile(path.resolve(outFolder.absolutePath, atlas.fileName), atlas.imageBuffer)));

	const context = createTemplateContext(atlases, imagesFolder);
	template.renderToFile(context, path.resolve(outFolder.absolutePath, `${fileName}.${outTemplateExtension}`));

	console.log("Packed");
};

async function createAtlases(imageFilePaths: string[], options: Infer<typeof PackerOptions>) {
	return (await packTextures(imageFilePaths, options))
		.map((atlas, i) => merge(atlas, { fileName: `${options.fileName}${i}.png` }));
}

type Atlases = AsyncReturnType<typeof createAtlases>;

function createTemplateContext(atlases: Atlases, imagesFolder: RelativePath) {
	const textures = sortArrayByKey(atlases.flatMap(atlas => convertRectsToContextTextures(atlas, imagesFolder)), 'fileName');
	return { atlases, textures };
}

const convertRectsToContextTextures = (atlas: Atlases[number], imagesFolder: RelativePath) => atlas.rects.map(rect => ({
	atlasFileName: atlas.fileName,
	fileName: rect.file.substring(imagesFolder.absolutePath.length),
	x: rect.x,
	y: rect.y,
	width: rect.width,
	height: rect.height,
}));