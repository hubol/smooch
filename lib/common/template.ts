import { PathLike } from "fs";
import Handlebars from "handlebars";
import { pascalCase } from "pascal-case";
import { camelCase } from "change-case";
import { Fs } from "./fs";
import chalk from "chalk";

Handlebars.registerHelper("camel", camelCase);
Handlebars.registerHelper("pascal", pascalCase);
Handlebars.registerHelper("noext", string => string.replace(/\.[^/\\.]+$/, ""));
Handlebars.registerHelper("json", object => JSON.stringify(object, undefined, 1));
Handlebars.registerHelper("oneline", string => string.replace(/\s+/g, ' '));

const HandlebarsTemplate = {
	async fromFile(templateFile: PathLike) {
		const templateText = await Fs.readFile(templateFile, 'utf8');
		return Handlebars.compile(templateText);
	}
}

export class Template {
	private constructor(
		private readonly _srcFile: string,
		private readonly _delegate: HandlebarsTemplateDelegate) { }

	static async fromFile(templateFile: string) {
		const templateText = await Fs.readFile(templateFile, 'utf8');
		return new Template(templateFile, Handlebars.compile(templateText));
	}

	async renderToFile(context: Record<string, any>, outputFile: PathLike) {
		try {
			console.log(this + "Rendering templated output...");
			const text = this._delegate(context);
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