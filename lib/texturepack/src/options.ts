import { object, integer, boolean, string, defaulted, refine, create, assign } from "superstruct";
import { SmoochStruct } from "../../common/custom-superstruct";
import { Path } from "../../common/path";
import { defaultTemplateFile } from "../../common/default-template";

const PositiveInteger = refine(integer(), "positive", (value) => value > 0);

export const BinPackOptions = object({
	// Reasonable defaults from
	// https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/WebGL_best_practices#understand_system_limits
	maxWidth: defaulted(PositiveInteger, 4096),
	maxHeight: defaulted(PositiveInteger, 4096),
	smart: defaulted(boolean(), true),
	pot: defaulted(boolean(), true),
	square: defaulted(boolean(), true),
	padding: defaulted(PositiveInteger, 1)
});

export const RawPackerOptions = object({
	fileName: defaulted(string(), "atlas"),
	pack: defaulted(BinPackOptions, create({}, BinPackOptions))
});

export const PackerOptions = assign(
	object({
		folder: SmoochStruct.DirectoryPath,
		outFolder: defaulted(SmoochStruct.DirectoryPath, Path.Directory.create(process.cwd())),
		outTemplateExtension: defaulted(string(), "js"),
		outTemplate: defaulted(SmoochStruct.FilePath, defaultTemplateFile('texture-pack.js')),
	}),
	RawPackerOptions
);
