import { Infer, array, defaulted, object } from "superstruct";
import { PackerOptions } from "../texturepack/src/options";
import { SmoochStruct } from "../common/custom-superstruct";
import { Fs } from "../common/fs";
import { SmoochWatcher, SmoochWorker } from "./smooch-watcher";
import { texturePack } from "../texturepack/src/texture-pack";
import { AggregateJsonOptions, aggregateJson } from "../json/aggregate-json";
import { AbsolutePath, CwdRelativePath, RelativePath } from "../common/relative-path";
import { ParcelFsResources } from "./watcher/parcel-fs-resources";
import { FsWatcher } from "./watcher/fs-watcher";

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

    const resources = await ParcelFsResources.create(new CwdRelativePath(''), new AbsolutePath(core.cacheFolder, 'snapshot.txt'));
    const watcher = new FsWatcher(resources);
    await watcher.catchUp();
    
    // async function createAndStartWorkers<T>(
    //     name: string,
    //     configs: T[],
    //     doWorkFn: (t: T) => Promise<void>,
    //     inputFolderFn: (t: T) => RelativePath,
    //     outputFolderFn: (t: T) => RelativePath) {
    //         for (let i = 0; i < configs.length; i++) {
    //             const config = configs[i];
    //             const worker = new SmoochWorker(async () => {
    //                 await doWorkFn(config);
    //                 await watcher.save();
    //             });
    //             const watcherName = `${name}${configs.length === 1 ? '' : `[${i}]`}`;
    //             const inputFolder = inputFolderFn(config);
    //             const outputFolder = outputFolderFn(config);
    //             const watcher = new SmoochWatcher(watcherName, inputFolder, outputFolder, core.cacheFolder, worker);
    //             await watcher.start();
    //             await watcher.catchUp();    
    //         }      
    // }

    // createAndStartWorkers('texPack', textures, texturePack, t => t.folder, t => t.outFolder);
    // createAndStartWorkers('jsonAgg', jsonFiles, aggregateJson, j => j.folder, j => new CwdRelativePath(Fs.dirname(j.outFile.absolutePath)));

    // await textureWatcher.stop();
}
