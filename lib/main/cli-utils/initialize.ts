import { Fs } from "../../common/fs";
import { Logger } from "../../common/logger";
import { SmoochConfigType } from "../smooch-config";

const logger = new Logger('InitializeSmooch', 'green');

export async function initializeSmoochConfig() {
    if (await Fs.exists('smooch.json')) {
        logger.log("smooch.json already exists! I don't wanna overwrite it!");
        return;
    }

    const config: SmoochConfigType = {
        textures: [],
        audioFiles: [],
        jsonFiles: [],
    };

    const json = JSON.stringify(
        { "$schema": "node_modules/@hubol/smooch/schema.json", ...config },
        undefined,
        '\t');

    logger.log("Wrote smooch.json");
    await Fs.writeFile('smooch.json', json);
}