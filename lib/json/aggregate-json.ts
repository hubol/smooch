import { Infer, defaulted, object } from "superstruct";
import { SmoochStruct } from "../common/custom-superstruct";
import { Fs } from "../common/fs";
import { glob } from "glob";
import { JsonFile } from "../common/json-file";
import { JsTemplate } from "../common/template";
import { Logger } from "../common/logger";
import { SmoochWorkAcceptor } from "../main/pipeline/smooch-work-acceptor";
import { SmoochWorkPipelineRecipeFactory } from "../main/pipeline/smooch-work-pipeline";
import { SmoochWorkQueue } from "../main/pipeline/smooch-work-queue";
import { defaultTemplateFile } from "../common/default-template";
import { Path } from "../common/path";

export const AggregateJsonOptions = object({
    folder: SmoochStruct.DirectoryPath,
    outFile: SmoochStruct.FilePath,
    outTemplate: defaulted(SmoochStruct.FilePath, defaultTemplateFile('json-aggregate.js')),
});

export const AggregateJsonRecipe = SmoochWorkPipelineRecipeFactory.create({
    name: 'jsonAgg',
    configSchema: AggregateJsonOptions,
	acceptorFactory: options => {
		const jsonFolder = Path.Glob.create(options.folder, '**/*.json');
		return new SmoochWorkAcceptor([ jsonFolder ], [ Path.Glob.create(options.outTemplate) ], []);
	},
	queueFactory: () => new SmoochWorkQueue(),
	workFnFactory: options => () => aggregateJson(options),
});

const logger = new Logger('JsonAggregator', 'cyan');

export async function aggregateJson(options: Infer<typeof AggregateJsonOptions>) {
    const template = await JsTemplate.fromFile(options.outTemplate);

    const jsonPaths = await glob(`/**/*.json`, { root: options.folder });
    logger.log(`Found ${jsonPaths.length} JSON file(s) in ${options.folder}...`);

    const files = await Promise.all(jsonPaths.map(async path => {
        const fileName = path.substring(Fs.resolve(options.folder).length);
        try {
            const json = await JsonFile.read(path);
            return { fileName, json };
        }
        catch (e) {
            logger.error(`An error occurred while reading ${path}`, e);
        }
    }));
    
    await template.renderToFile(<AggregateJsonTemplateContext>{ files }, options.outFile);
}

export interface AggregateJsonTemplateContext {
    files: { fileName: string, json: any }[];
}