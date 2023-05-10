import { Infer, array, defaulted, object } from "superstruct";
import { PackerOptions } from "../texturepack/src/options";
import { SmoochStruct } from "../common/custom-superstruct";
import { Fs } from "../common/fs";
import { SmoochWatcher, SmoochWorker } from "./smooch-watcher";
import { texturePack } from "../texturepack/src/texture-pack";
import { AggregateJsonOptions, aggregateJson } from "../json/aggregate-json";
import { CwdRelativePath, RelativePath } from "../common/relative-path";

const CoreConfig = object({
    cacheFolder: SmoochStruct.CwdRelativePath,
})

export const SmoochConfig = object({
    core: CoreConfig,
    textures: defaulted(array(PackerOptions), []),
    jsonFiles: defaulted(array(AggregateJsonOptions), []),
});

export type SmoochConfigType = Infer<typeof SmoochConfig>;

export async function main({ core, textures, jsonFiles }: Infer<typeof SmoochConfig>) {
    await Fs.mkdir(core.cacheFolder.absolutePath, { recursive: true });
    
    async function createAndStartWorkers<T>(
        name: string,
        configs: T[],
        doWorkFn: (t: T) => Promise<void>,
        inputFolderFn: (t: T) => RelativePath,
        outputFolderFn: (t: T) => RelativePath) {
            for (let i = 0; i < configs.length; i++) {
                const config = configs[i];
                const worker = new SmoochWorker(() => doWorkFn(config));
                const watcherName = `${name}${configs.length === 1 ? '' : `[${i}]`}`;
                const inputFolder = inputFolderFn(config);
                const outputFolder = outputFolderFn(config);
                const watcher = new SmoochWatcher(watcherName, inputFolder, outputFolder, core.cacheFolder, worker);
                await watcher.start();
                await watcher.catchUp();    
            }      
    }

    createAndStartWorkers('texture', textures, texturePack, t => t.folder, t => t.outFolder);
    createAndStartWorkers('jsonFile', jsonFiles, aggregateJson, j => j.folder, j => new CwdRelativePath(Fs.dirname(j.outFile.absolutePath)));

    // await textureWatcher.stop();
}
