import { Infer, defaulted, object } from "superstruct";
import { SmoochStruct } from "../common/custom-superstruct";
import { CwdRelativePath } from "../common/relative-path";
import { Fs } from "../common/fs";
import { glob } from "glob";
import { JsonFile } from "../common/json-file";
import { JsTemplate } from "../common/template";
import { Logger } from "../common/logger";
import { SmoochWorkAcceptor } from "../main/pipeline/smooch-work-acceptor";
import { SmoochWorkPipelineRecipe } from "../main/pipeline/smooch-work-pipeline";
import { SmoochWorkQueue } from "../main/pipeline/smooch-work-queue";

export const AggregateJsonOptions = object({
    folder: SmoochStruct.CwdRelativePath,
    outFile: SmoochStruct.CwdRelativePath,
    outTemplate: defaulted(SmoochStruct.CwdRelativePath, new CwdRelativePath(Fs.resolve(__filename, '../default-template.js'))),
});

export const AggregateJsonRecipe: SmoochWorkPipelineRecipe<Infer<typeof AggregateJsonOptions>> = {
	acceptorFactory: options => {
		const jsonFolder = Fs.resolve(options.folder.absolutePath, '**/*.json');
		return new SmoochWorkAcceptor([ jsonFolder ], []);
	},
	queueFactory: () => new SmoochWorkQueue(),
	workFnFactory: options => () => aggregateJson(options),
}

const logger = new Logger('JsonAggregator', 'cyan');

export async function aggregateJson(options: Infer<typeof AggregateJsonOptions>) {
    const template = await JsTemplate.fromFile(options.outTemplate.absolutePath);

    const jsonPaths = await glob(`/**/*.json`, { root: options.folder.path });
    logger.log(`Found ${jsonPaths.length} JSON file(s) in ${options.folder.absolutePath}...`);

    const files = await Promise.all(jsonPaths.map(async path => {
        const fileName = path.substring(options.folder.absolutePath.length);
        try {
            const json = await JsonFile.read(path);
            return { fileName, json };
        }
        catch (e) {
            logger.error(`An error occurred while reading ${path}`, e);
        }
    }));
    
    await template.renderToFile({ files }, options.outFile.absolutePath);
}