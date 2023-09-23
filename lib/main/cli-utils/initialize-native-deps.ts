import { Fs } from "../../common/fs";
import { Logger } from "../../common/logger";
import { NativeDependencies } from "../../common/native/native-dependency";
import { Global } from "../global";

const logger = new Logger('InitializeNativeDeps', 'green');

export async function initializeNativeDepsConfig() {
    if (await Fs.exists(Global.nativeDepsJsonFile)) {
        logger.log(`${Global.nativeDepsJsonFile} already exists! I don't wanna overwrite it!`);
        return;
    }

    const json = JSON.stringify(
        NativeDependencies.defaultVersions,
        undefined,
        '\t');

    logger.log(`Wrote ${Global.nativeDepsJsonFile}`);
    await Fs.writeFile(Global.nativeDepsJsonFile, json);
}