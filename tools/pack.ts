import { NpmExecutable } from "../lib/common/process/npm-executable";
import { Fs } from "../lib/common/fs";
import { ProcessWithLogger } from "../lib/common/process/process-with-logger";
import { Logger } from "../lib/common/logger";
import { packageJson } from "../lib/common/package-json";

process.chdir("./dist");

const destFileName = process.argv[2];
if (!destFileName) {
    throw new Error("Argument required for packed tar ball file name!");
}

const packTarBallFileName = `${stripSymbols(packageJson.name)}-${packageJson.version}.tgz`;

function stripSymbols(packageName: string) {
    return packageName.replace("@", "").replace("/", "-");
}

const logger = new Logger("pack.ts", "yellow");

async function main() {
    await new ProcessWithLogger(NpmExecutable.npm, ["pack"], {}).untilExited();

    logger.log(`Rename ${packTarBallFileName} to ${destFileName}...`);
    if (await Fs.exists(destFileName)) {
        await Fs.rm(destFileName);
    }
    await Fs.rename(packTarBallFileName, destFileName);
    logger.log(`Done.`);
}

main();
