import chalk from "chalk";
import { describeList } from "../../common/describe-list";
import { Environment } from "../../common/environment";
import { Fs } from "../../common/fs";
import { Gwob } from "../../common/gwob";
import { Logger } from "../../common/logger";
import { Path } from "../../common/path";

const logger = new Logger('CopyTemplateProgram', 'green');

export async function copyTemplateProgram(src: string, dstFile: Path.File.t) {
    const srcFile = await findTemplateProgramFile(src);
    if (!srcFile)
        return;

    if (!dstFile)
        dstFile = Path.File.create(Fs.parse(srcFile).base);

    logger.log(`${srcFile} -> ${dstFile}`);
    await Fs.copyFile(srcFile, dstFile);
}

export async function getAvailableTemplatePrograms() {
    const glob = Path.Glob.create(templateProgramDirectory, '*.js');
    return await Gwob.files(glob);
}

async function findTemplateProgramFile(src: string) {
    const files = await getAvailableTemplatePrograms();
    for (const file of files) {
        const { base } = Fs.parse(file);
        if (base.includes(src))
            return file;
    }

    const list = describeList(files.map(file => Fs.parse(file).name));
    logger.log(`Could not find template program to copy.
Available template programs: ${chalk.white(list)}`);

    return null;
}

const templateProgramDirectory = Environment.isDev
    ? Fs.resolve(__filename, '../../../../dist/templates')
    : Fs.resolve(__filename, '../templates');