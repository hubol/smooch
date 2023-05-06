import { Infer, array, defaulted, object } from "superstruct";
import { PackerOptions } from "../texturepack/src/options";
import { SmoochStruct } from "../common/custom-superstruct";
import { Fs } from "../common/fs";
import { SmoochWatcher, SmoochWorker } from "./smooch-watcher";
import { texturePack } from "../texturepack/src/texture-pack";
import { AggregateJsonOptions, aggregateJson } from "../json/aggregate-json";
import { CwdRelativePath } from "../common/relative-path";

const CoreConfig = object({
    cacheFolder: SmoochStruct.CwdRelativePath,
})

export const MainConfig = object({
    core: CoreConfig,
    textures: defaulted(array(PackerOptions), []),
    jsonFiles: defaulted(array(AggregateJsonOptions), []),
});

export async function main({ core, textures, jsonFiles }: Infer<typeof MainConfig>) {
    await Fs.mkdir(core.cacheFolder.absolutePath, { recursive: true });
    
    for (let i = 0; i < textures.length; i++) {
        const texture = textures[i];
        const textureWorker = new SmoochWorker(() => texturePack(texture));
        const textureWatcher = new SmoochWatcher(`texture[${i}]`, texture.folder, texture.outFolder, core.cacheFolder, textureWorker);
        await textureWatcher.start();
        await textureWatcher.catchUp();
    }

    for (let i = 0; i < jsonFiles.length; i++) {
        const jsonFile = jsonFiles[i];
        const jsonFileWorker = new SmoochWorker(() => aggregateJson(jsonFile));
        const outFolder = new CwdRelativePath(Fs.dirname(jsonFile.outFile.absolutePath));
        const jsonFileWatcher = new SmoochWatcher(`jsonFile[${i}]`, jsonFile.folder, outFolder, core.cacheFolder, jsonFileWorker);
        await jsonFileWatcher.start();
        await jsonFileWatcher.catchUp();
    }
    // await textureWatcher.stop();
}
