import { camelCase, pascalCase, paramCase } from "change-case";
import { Fs } from "./fs";
import { Logger } from "./logger";
import chalk from "chalk";
import { describeBrief } from "./describe-brief";
import { requireModule } from "./require-module";
import { countLines } from "./count-lines";
import { Native } from "./native/native-module";

const logger = new Logger("Template", "yellow");

const utils = {
    camel: (string: string) => camelCase(string).replace(/_/g, ""),
    pascal: (string: string) => pascalCase(string).replace(/_/g, ""),
    kebab: (string: string) => paramCase(string),
    noext: (string: string) => string.replace(/\.[^/\\.]+$/, ""),
    json: (object: any) => JSON.stringify(object, undefined, 1),
    oneline: (string: string) => string.replace(/\s+/g, " "),
    format: Native.Prettier.format,
    Fs,
};

export type Utils = typeof utils;
type JsTemplateFn = (context: Record<string, any>, utils: Utils) => string | Promise<string>;

export class JsTemplate {
    private constructor(
        private readonly _srcFile: string,
        private readonly _templateFn: JsTemplateFn,
    ) {}

    static async fromFile(templateFile: string) {
        const defaultExport = requireModule(Fs.resolve(templateFile));
        return new JsTemplate(templateFile, defaultExport);
    }

    private _render(context: Record<string, any>) {
        return Promise.resolve(this._templateFn(context, utils));
    }

    async renderToFile(context: Record<string, any>, outputFile: string, options: { ensureDirectory?: boolean } = {}) {
        if (options.ensureDirectory) {
            try {
                await Fs.mkdir(Fs.parse(outputFile).dir, { recursive: true });
            }
            catch (e) {
                logger.warn(`An unexpected error occurred while ensuring the directory for ${outputFile}:`, e);
            }
        }

        try {
            logger.log(`Rendering ${chalk.blue(this._srcFile)} with context ${chalk.magenta(describeBrief(context))}
=> ${chalk.green(outputFile)}...`);
            const text = await this._render(context);
            await Fs.writeFile(outputFile, text);
            logger.log(`Done: ${chalk.green(outputFile)} (${countLines(text)} lines)`);
        }
        catch (e) {
            logger.error(
                `An unexpected error occurred while rendering ${this._srcFile} to file ${outputFile} with context ${
                    chalk.magenta(describeBrief(context))
                }:`,
                e,
            );
        }
    }
}
