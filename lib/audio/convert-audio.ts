import { Infer, array, object, string } from "superstruct";
import { SmoochStruct } from "../common/custom-superstruct";
import { Fs } from "../common/fs";
import { JsTemplate } from "../common/template";
import { Logger } from "../common/logger";
import { SmoochWorkAcceptor } from "../main/pipeline/smooch-work-acceptor";
import { SmoochWorkPipelineRecipeFactory } from "../main/pipeline/smooch-work-pipeline";
import { SmoochWorkQueue } from "../main/pipeline/smooch-work-queue";
import { SmoochWork } from "../main/pipeline/smooch-worker";
import { Gwob } from "../common/gwob";
import { AudioFileConverter } from "./audio-file-converter";
import { Path } from "../common/path";
import { describeList } from "../common/describe-list";
import chalk from "chalk";

export const ConvertAudioOptions = object({
    glob: SmoochStruct.GlobPath,
    template: SmoochStruct.Template,
    out: array(object({
        directory: SmoochStruct.DirectoryPath,
        format: string(),
    })),
});

export const ConvertAudioRecipe = SmoochWorkPipelineRecipeFactory.create({
    name: 'audiCnv',
    configSchema: ConvertAudioOptions,
	acceptorFactory: options => {
		return new SmoochWorkAcceptor([ options.glob ], [], []);
	},
	queueFactory: () => new SmoochWorkQueue(),
	workFnFactory: options => (work) => convertAudio(options, work),
});

const logger = new Logger('AudioConverter', 'cyan');

export async function convertAudio(options: Infer<typeof ConvertAudioOptions>, work: SmoochWork) {
    const template = await JsTemplate.fromFile(options.template.program);
    const filesToConvertResult = FilesToConvert.infer(work);

    const files = filesToConvertResult.type === 'some'
        ? filesToConvertResult.files
        : await Gwob.files(options.glob);

    const uniqueFiles = [ ...new Set(files) ];

    logger.log(`Found ${files.length} file(s) to convert to formats: ${chalk.white(describeList(options.out.map(x => x.format)))}`);

    await Promise.all(options.out.map(({ directory }) => Fs.mkdir(directory, { recursive: true })));

    const rootDirectory = Gwob.root(options.glob);

    const convertedFiles = await Promise.all(options.out.flatMap(({ directory, format }) => uniqueFiles.map(async srcFile => {
        const parsed = Fs.parse(srcFile);
        const fileNameNoExt = Fs.resolve(parsed.dir, parsed.name).substring(rootDirectory.length);
        const dstFile = Path.File.create(Fs.resolve(directory, fileNameNoExt + "." + format));
        await Fs.mkdir(Fs.dirname(dstFile), { recursive: true });
        await AudioFileConverter.convert(Path.File.create(srcFile), dstFile);
    })));

    logger.log(`Done converting ${files.length} file(s).`);

    // logger.log(`Found ${jsonPaths.length} JSON file(s) in ${options.folder}...`);

    // const files = await Promise.all(jsonPaths.map(async path => {
    //     const fileName = path.substring(Fs.resolve(options.folder).length);
    //     try {
    //         const json = await JsonFile.read(path);
    //         return { fileName, json };
    //     }
    //     catch (e) {
    //         logger.error(`An error occurred while reading ${path}`, e);
    //     }
    // }));
    
    // await template.renderToFile({ files }, options.outFile);
}

namespace FilesToConvert {
    export function infer(work: SmoochWork): Result {
        const files: string[] = [];
        for (const w of work) {
            if (w.type === 'AcceptedNascent')
                return { type: 'all' };
            
            files.push(...w.assetMatches.map(x => x.path));
        }
    
        return {
            type: 'some',
            files,
        }
    }

    interface All {
        type: 'all';
    }

    interface Some {
        type: 'some';
        files: string[];
    }

    export type Result = All | Some;
}