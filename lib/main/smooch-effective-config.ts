import { Fs } from "../common/fs";
import { Logger } from "../common/logger";
import { Path } from "../common/path";
import { SmoochConfigType } from "./smooch-config";
import { Global } from "./global";
import { JsonFile } from "../common/json-file";
import chalk from "chalk";

const logger = new Logger('SmoochEffectiveConfig', 'magenta');

export class SmoochEffectiveConfig {
    private constructor() { }

    private static readonly _file = Path.File.create(Fs.resolve(Global.cacheDir, 'previous-effective-smooch.json'))

    static async checkIfChanged(config: SmoochConfigType) {
        let changed = false;
        try {
            const previousConfig = await JsonFile.read(this._file);
            changed = JSON.stringify(config) !== JSON.stringify(previousConfig);

            if (changed)
                logger.log(`${chalk.yellow('Hey cutie!')} Configuration appears to have changed.`);
        }
        catch (e) {
            logger.log(`Got an error while reading ${this._file}, assuming configuration changed.
This may be normal if your cache directory was deleted or this is your first time running!`);
            changed = true;
        }

        if (!changed)
            logger.log(`Configuration does not appear to have changed.`);

        return changed;
    }

    static async write(config: SmoochConfigType) {
        try {
            await Fs.mkdir(Global.cacheDir, { recursive: true });
            await JsonFile.write(this._file, config);
            logger.log(`Wrote effective config to ${this._file}`);
        }
        catch (e) {
            logger.error(`Failed to write effective config to ${this._file}. This is not fatal but not good.`, e);
        }
    }
}