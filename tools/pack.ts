import { TestCommands } from "../test/utils/test-commands";
import packageJson from "../package.json";
import { Fs } from "../lib/common/fs";
import { TestProcess } from "../test/utils/test-process";
import { Logger } from "../lib/common/logger";

process.chdir("./dist");

const destFileName = process.argv[2];
if (!destFileName)
    throw new Error("Argument required for packed tar ball file name!")

const packTarBallFileName = `${packageJson.name}-${packageJson.version}.tgz`;

const logger = new Logger('pack.ts', 'yellow');

async function main() {
    await new TestProcess(TestCommands.npm, [ 'pack' ], {}).untilExited();

    logger.log(`Rename ${packTarBallFileName} to ${destFileName}...`);
    if (await Fs.exists(destFileName))
        await Fs.rm(destFileName);
    await Fs.rename(packTarBallFileName, destFileName);
    logger.log(`Done.`);
}

main();