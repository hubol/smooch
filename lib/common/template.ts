import { PathLike } from "fs";
import Handlebars from "handlebars";
import { pascalCase } from "pascal-case";
import { camelCase } from "change-case";
import { Fs } from "./fs";

Handlebars.registerHelper("camel", camelCase);
Handlebars.registerHelper("pascal", pascalCase);
Handlebars.registerHelper("noext", string => string.replace(/\.[^/\\.]+$/, ""));
Handlebars.registerHelper("json", object => JSON.stringify(object, undefined, 1));
Handlebars.registerHelper("oneline", string => string.replace(/\s+/g, ' '));

export const Template = {
	async fromFile(templateFile: PathLike) {
		const templateText = await Fs.readFile(templateFile, 'utf8');
		return Handlebars.compile(templateText);
	}
}