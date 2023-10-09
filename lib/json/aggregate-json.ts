import { Infer, object } from "superstruct";
import { SmoochStruct } from "../common/custom-superstruct";
import { Fs } from "../common/fs";
import { JsonFile } from "../common/json-file";
import { JsTemplate } from "../common/template";
import { Logger } from "../common/logger";
import { SmoochWorkAcceptor } from "../main/pipeline/smooch-work-acceptor";
import { SmoochWorkPipelineRecipeFactory } from "../main/pipeline/smooch-work-pipeline";
import { SmoochWorkQueue } from "../main/pipeline/smooch-work-queue";
import { Path } from "../common/path";
import { Gwob } from "../common/gwob";

export const AggregateJsonOptions = object({
    glob: SmoochStruct.GlobPath,
    template: SmoochStruct.Template,
});

export const AggregateJsonRecipe = SmoochWorkPipelineRecipeFactory.create({
    name: 'jsonAgg',
    configSchema: AggregateJsonOptions,
	acceptorFactory: options => {
		return new SmoochWorkAcceptor([ options.glob ], [ Path.Glob.create(options.template.program) ], []);
	},
	queueFactory: () => new SmoochWorkQueue(),
	workFnFactory: options => () => aggregateJson(options),
});

const logger = new Logger('JsonAggregator', 'cyan');

export async function aggregateJson(options: Infer<typeof AggregateJsonOptions>) {
    const template = await JsTemplate.fromFile(options.template.program);

    const jsonPaths = await Gwob.files(options.glob);
    logger.log(`Found ${jsonPaths.length} JSON file(s) matching ${options.glob}...`);

    const globRoot = Gwob.root(options.glob);

    const files = await Promise.all(jsonPaths.map(async path => {
        const fileName = path.substring(Fs.resolve(globRoot).length);
        try {
            const json = await JsonFile.read(path);
            return { fileName, json };
        }
        catch (e) {
            logger.error(`An error occurred while reading ${path}`, e);
        }
    }));
    
    await template.renderToFile(<AggregateJsonTemplateContext>{ files }, options.template.out, { ensureDirectory: true });
}

export interface AggregateJsonTemplateContext {
    files: { fileName: string, json: any }[];
}