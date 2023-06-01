import { PathLike } from "fs";
import { pascalCase } from "pascal-case";
import { camelCase } from "change-case";
import { Fs } from "./fs";
import chalk from "chalk";

const utils = {
	camel: camelCase,
	pascal: pascalCase,
	noext: (string: string) => string.replace(/\.[^/\\.]+$/, ""),
	json: (object: any) => JSON.stringify(object, undefined, 1),
	oneline: (string: string) => string.replace(/\s+/g, ' '),
};

type Utils = typeof utils;
type JsTemplateFn = (context: Record<string, any>, utils: Utils) => string | Promise<string>;

export class JsTemplate {
	private constructor(
		private readonly _srcFile: string,
		private readonly _templateFn: JsTemplateFn) { }

	static async fromFile(templateFile: string) {
		const defaultExport = require(templateFile);
		return new JsTemplate(templateFile, defaultExport);
	}

	private _render(context: Record<string, any>) {
		return Promise.resolve(this._templateFn(context, utils));
	}

	async renderToFile(context: Record<string, any>, outputFile: PathLike) {
		try {
			console.log(this + "Rendering templated output...");
			const text = await this._render(context);
			console.log(this + `Writing output to ${outputFile}...`);
    		await Fs.writeFile(outputFile, text);
			console.log(this + `Done!`);
		}
		catch (e) {
			console.error(this + `An unexpected error occurred while rendering ${this._srcFile} to file ${outputFile} with context=${context}:`, e);
		}
	}

	toString() {
		return chalk.yellow`[Template] `;
	}
}