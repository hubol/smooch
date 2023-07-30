import { PathLike } from "fs";
import { pascalCase } from "pascal-case";
import { camelCase } from "change-case";
import { Fs } from "./fs";
import { Logger } from "./logger";
import { format } from "prettier";
import chalk from "chalk";
import { describeBrief } from "./describe-brief";
import { requireModule } from "./require-module";

const utils = {
	camel: camelCase,
	pascal: pascalCase,
	noext: (string: string) => string.replace(/\.[^/\\.]+$/, ""),
	json: (object: any) => JSON.stringify(object, undefined, 1),
	oneline: (string: string) => string.replace(/\s+/g, ' '),
	format,
};

type Utils = typeof utils;
type JsTemplateFn = (context: Record<string, any>, utils: Utils) => string | Promise<string>;

const logger = new Logger('Template', 'yellow');

export class JsTemplate {
	private constructor(
		private readonly _srcFile: string,
		private readonly _templateFn: JsTemplateFn) { }

	static async fromFile(templateFile: string) {
		const defaultExport = requireModule(templateFile);
		return new JsTemplate(templateFile, defaultExport);
	}

	private _render(context: Record<string, any>) {
		return Promise.resolve(this._templateFn(context, utils));
	}

	async renderToFile(context: Record<string, any>, outputFile: PathLike) {
		try {
			logger.log(`Rendering templated output with context ${chalk.magenta(describeBrief(context))}...`);
			const text = await this._render(context);
			logger.log(`Writing output to ${outputFile}...`);
    		await Fs.writeFile(outputFile, text);
			logger.log(`Done!`);
		}
		catch (e) {
			logger.error(`An unexpected error occurred while rendering ${this._srcFile} to file ${outputFile} with context=${describeBrief(context)}:`, e);
		}
	}
}