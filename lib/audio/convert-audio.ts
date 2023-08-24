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

    const filesToConvert = filesToConvertResult.type === 'some'
        ? filesToConvertResult.files
        : await Gwob.files(options.glob);

    const uniqueFiles = [ ...new Set(filesToConvert) ];

    logger.log(`Found ${filesToConvert.length} file(s) to convert to formats: ${chalk.white(describeList(options.out.map(x => x.format)))}`);

    await Promise.all(options.out.map(({ directory }) => Fs.mkdir(directory, { recursive: true })));

    const globRoot = Gwob.root(options.glob);
    await Promise.all(options.out.flatMap(({ directory, format }) => uniqueFiles.map(async srcFile => {
        const parsed = Fs.parse(srcFile);
        const fileNameNoExt = Fs.resolve(parsed.dir, parsed.name).substring(globRoot.length);
        const dstFile = Path.File.create(Fs.resolve(directory, fileNameNoExt + "." + format));

        await Fs.mkdir(Fs.dirname(dstFile), { recursive: true });
        await AudioFileConverter.convert(Path.File.create(srcFile), dstFile);
    })));

    logger.log(`Done converting ${filesToConvert.length} file(s).`);

    const files = await getTemplateContextFilesFromDirectories(options);

    await template.renderToFile({ files }, options.template.out);
}

interface TemplateContextFile {
    path: string;
    convertedPaths: Record<string, string>;
}

async function getTemplateContextFilesFromDirectories(options: Infer<typeof ConvertAudioOptions>): Promise<TemplateContextFile[]> {
    const sourceFileToDestFiles: Record<string, TemplateContextFile> = {};

    const sourceFiles = await Gwob.files(options.glob);
    for (const file of sourceFiles) {
        const parsed = Fs.parse(file);

        const rootLength = Gwob.root(options.glob).length;
        const fileNameNoExt = Fs.resolve(parsed.dir, parsed.name).substring(rootLength);
        const path = file.substring(rootLength);

        sourceFileToDestFiles[fileNameNoExt] = { path, convertedPaths: { } };
    }

    for (const { format, directory } of options.out) {
        const glob = Path.Glob.create(directory, '**/*.' + format);
        const root = Gwob.root(glob);
        const dstFiles = await Gwob.files(glob);
        for (const file of dstFiles) {
            const parsed = Fs.parse(file);
            const srcRelativePath = Fs.resolve(parsed.dir, parsed.name).substring(root.length);

            if (!sourceFileToDestFiles[srcRelativePath])
                continue;

            const dstRelativePath = file.substring(root.length);
            sourceFileToDestFiles[srcRelativePath].convertedPaths[format] = dstRelativePath;
        }
    }

    const files: TemplateContextFile[] = [];
    for (const key in sourceFileToDestFiles)
        files.push(sourceFileToDestFiles[key]);
    return files;
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