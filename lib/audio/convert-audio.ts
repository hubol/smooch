import { Infer, array, object, optional } from "superstruct";
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
import { zipGlob } from "../zip/zip-glob";
import { hubhash } from "../common/hubhash";
import { WithRequired } from "../common/with-required";
import { Global } from "../main/global";

export const ConvertAudioOptions = object({
    glob: SmoochStruct.GlobPath,
    template: SmoochStruct.Template,
    convert: array(object({
        directory: optional(SmoochStruct.DirectoryPath),
        zip: optional(SmoochStruct.FilePath),
        format: SmoochStruct.FileExtension,
    })),
});

type ValidatedConvertOption = WithRequired<Infer<typeof ConvertAudioOptions>['convert'][0], 'directory'>;
type ValidatedOptions = Omit<Infer<typeof ConvertAudioOptions>, 'convert'> & { convert: ValidatedConvertOption[] };

export const ConvertAudioRecipe = SmoochWorkPipelineRecipeFactory.create({
    name: 'audiCnv',
    configSchema: ConvertAudioOptions,
	acceptorFactory: options => {
		return new SmoochWorkAcceptor([ options.glob ], [ Path.Glob.create(options.template.program) ], []);
	},
	queueFactory: () => new SmoochWorkQueue(),
	workFnFactory: options => (work) => convertAudio(options, work),
});

const logger = new Logger('AudioConverter', 'cyan');

export async function convertAudio(rawOptions: Infer<typeof ConvertAudioOptions>, work: SmoochWork) {
    const options = validateOptions(rawOptions);
    const template = await JsTemplate.fromFile(options.template.program);
    const filesToConvertResult = FilesToConvert.infer(work);

    const filesToConvert = filesToConvertResult.type === 'some'
        ? filesToConvertResult.files
        : await Gwob.files(options.glob);

    const uniqueFiles = [ ...new Set(filesToConvert) ];

    logger.log(`Found ${uniqueFiles.length} file(s) to convert to formats: ${chalk.white(describeList(options.convert.map(x => x.format)))}`);

    if (uniqueFiles.length === 0) {
        logger.log(`Aborting, as there are no files to convert.`);
        return;
    }

    await Promise.all([
        ...options.convert.map(({ directory }) => Fs.mkdir(directory, { recursive: true })),
        ...options.convert
            .map(x => x.zip)
            .filter(zip => !!zip)
            .map(zip => Fs.parse(zip!).dir)
            .map(directory => Fs.mkdir(directory, { recursive: true })),
    ]);

    const globRoot = Gwob.root(options.glob);
    await Promise.all(options.convert.flatMap(({ directory, format }) => uniqueFiles.map(async srcFile => {
        const parsed = Fs.parse(srcFile);
        const fileNameNoExt = Fs.resolve(parsed.dir, parsed.name).substring(globRoot.length);
        const dstFile = Path.File.create(Fs.resolve(directory, fileNameNoExt + "." + format));

        await Fs.mkdir(Fs.dirname(dstFile), { recursive: true });
        await AudioFileConverter.convert(Path.File.create(srcFile), dstFile);
    })));

    logger.log(`Done converting ${uniqueFiles.length} file(s).`);

    const [ files, zipFiles ] = await Promise.all([
        getTemplateContextFilesFromDirectories(options),
        createZipFiles(options.convert.filter(isZipConvertOption)),
    ]);

    const context: ConvertAudioTemplateContext = { files, zipFiles };
    await template.renderToFile(context, options.template.out, { ensureDirectory: true });
}

function validateOptions(options: Infer<typeof ConvertAudioOptions>) {
    for (const convert of options.convert) {
        if (convert.directory)
            continue;
        
        convert.directory = Path.Directory.create(
            Fs.resolve(
                Global.cacheDir,
                makeDirectoryName(options.glob, convert.zip ?? 'nozip', hubhash(`${options.glob}%${convert.zip}`))
            ));
        logger.log(`Generated directory name in cache folder for audio conversion:
${chalk.blue(options.glob)} -> ${chalk.white(convert.format)} -> ${chalk[convert.zip ? 'gray' : 'green'](convert.directory)}${convert.zip ? ` -> ${chalk.green(convert.zip)}` : ''}`);
    }

    return options as ValidatedOptions;
}

function isZipConvertOption(convertOption: ValidatedConvertOption): convertOption is ZipConvertOption {
    return !!convertOption.zip;
}

type ZipConvertOption = WithRequired<ValidatedConvertOption, 'zip'>;

function makeDirectoryName(...parts: string[]) {
    const name = parts
        .map(p => p.replace(nonAlphaNumRegex, ' ').trim().replace(whitespaceRegex, '_'))
        .join('__');

    return name.substring(name.length - 40);
}

const nonAlphaNumRegex = /[^a-zA-Z0-9]+/g;
const whitespaceRegex = /[\s]+/g;

export interface ConvertAudioTemplateContext {
    files: TemplateContextFile[];
    zipFiles: TemplateContextZipFile[];
}

interface TemplateContextZipFile {
    path: string;
}

interface TemplateContextFile {
    path: string;
    convertedPaths: Record<string, string>;
}

function createZipFileGlobCommands(commands: ZipConvertOption[]) {
    const zipFilesToGlob: Record<string, Path.Glob.t> = {};

    for (const command of commands) {
        const zipFile = Fs.resolve(command.zip);
        const previous = zipFilesToGlob[zipFile];
        const current = Path.Glob.create(command.directory, '**/*');
        if (previous && previous !== current) {
            logger.warn(`Zip file ${zipFile} needs more than one glob to be created:
- ${previous}
- ${current}
This should not be possible!`);
        }
        zipFilesToGlob[zipFile] = current;
    }

    return Object.entries(zipFilesToGlob).map(([ zipFile, glob ]) => ({ zipFile: Path.File.create(zipFile), glob }));
}

async function createZipFiles(commands: ZipConvertOption[]): Promise<TemplateContextZipFile[]> {
    const root = process.cwd();
    const zipFileGlobCommands = createZipFileGlobCommands(commands);

    return await Promise.all(zipFileGlobCommands.map(async ({ zipFile, glob }) => {
        await zipGlob(glob, zipFile);

        return {
            path: Fs.resolve(zipFile).substring(root.length),
        }
    }));
}

async function getTemplateContextFilesFromDirectories(options: ValidatedOptions): Promise<TemplateContextFile[]> {
    const sourceFileToDestFiles: Record<string, TemplateContextFile> = {};

    const sourceFiles = await Gwob.files(options.glob);
    for (const file of sourceFiles) {
        const parsed = Fs.parse(file);

        const rootLength = Gwob.root(options.glob).length;
        const fileNameNoExt = Fs.resolve(parsed.dir, parsed.name).substring(rootLength);
        const path = file.substring(rootLength);

        sourceFileToDestFiles[fileNameNoExt] = { path, convertedPaths: { } };
    }

    for (const { format, directory } of options.convert) {
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
            
            files.push(...w.assetMatches.filter(x => x.type !== 'delete').map(x => x.path));
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