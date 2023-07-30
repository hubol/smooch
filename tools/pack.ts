import { TestCommands } from "../test/utils/test-commands";
import packageJson from "../package.json";
import { Fs } from "../lib/common/fs";
import { TestProcess } from "../test/utils/test-process";
import { Logger } from "../lib/common/logger";

const packTarBallFileName = `${packageJson.name}-${packageJson.version}.tgz`;

const logger = new Logger('pack.ts', 'yellow');

async function main() {
    await new TestProcess(TestCommands.npm, [ 'pack' ], {}).untilExited();

    const destFileName = 'smooch.tgz';
    logger.log(`Rename ${packTarBallFileName} to ${destFileName}...`);
    await Fs.rename(packTarBallFileName, destFileName);
    logger.log(`Done.`);
}

main();