import path from "path";
import { object, integer, boolean, string, defaulted, refine, create, assign } from "superstruct";
import { SmoochStruct } from "../../common/custom-superstruct";
import { CwdRelativePath } from "../../common/relative-path";

const PositiveInteger = refine(integer(), "positive", (value) => value > 0);

export const BinPackOptions = object({
	maxWidth: defaulted(PositiveInteger, 1024),
	maxHeight: defaulted(PositiveInteger, 1024),
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
		folder: SmoochStruct.CwdRelativePath,
		outFolder: defaulted(SmoochStruct.CwdRelativePath, new CwdRelativePath(process.cwd())),
		outTemplateExtension: defaulted(string(), "js"),
		outTemplate: defaulted(SmoochStruct.CwdRelativePath, new CwdRelativePath(path.resolve(__filename, '../../default.handlebars'))),
	}),
	RawPackerOptions
);
