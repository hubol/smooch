import { Infer, array, defaulted, object } from "superstruct";
import { PackerOptions } from "../texturepack/src/options";
import { SmoochStruct } from "../common/custom-superstruct";
import { Fs } from "../common/fs";
import { TexturePackRecipe } from "../texturepack/src/texture-pack";
import { AggregateJsonOptions, AggregateJsonRecipe } from "../json/aggregate-json";
import { AbsolutePath, CwdRelativePath } from "../common/relative-path";
import { ParcelFsResources } from "./watcher/parcel-fs-resources";
import { FsWatcher } from "./watcher/fs-watcher";
import { SmoochWorkers } from "./pipeline/smooch-worker";
import { SmoochWorkPipeline, SmoochWorkPipelineRecipe } from "./pipeline/smooch-work-pipeline";
import { wait, waitHold } from "../common/wait";

const CoreConfig = object({
    cacheFolder: SmoochStruct.CwdRelativePath,
})

export const SmoochConfig = object({
    core: CoreConfig,
    textures: defaulted(array(PackerOptions), []),
    jsonFiles: defaulted(array(AggregateJsonOptions), []),
});

export type SmoochConfigType = Infer<typeof SmoochConfig>;

type SmoochConfigToRecipe<T = Omit<SmoochConfigType, 'core'>> = {
    [k in keyof T]: T[k] extends Array<infer E>
        ? SmoochWorkPipelineRecipe<E>
        : never;
};

const configToRecipe: SmoochConfigToRecipe = {
    jsonFiles: AggregateJsonRecipe,
    textures: TexturePackRecipe,
}

export async function main({ core, ...rest }: Infer<typeof SmoochConfig>) {
    await Fs.mkdir(core.cacheFolder.absolutePath, { recursive: true });

    const resources = await ParcelFsResources.create(new CwdRelativePath(''), new AbsolutePath(core.cacheFolder, 'snapshot.txt'));
    const watcher = new FsWatcher(resources);

    for (const key in configToRecipe) {
        const recipe = configToRecipe[key];
        for (const config of rest[key]) {
            const pipeline = SmoochWorkPipeline.create(recipe, config);
            watcher.subscribe({ identity: recipe.name, accept: x => pipeline.accept(x) });    
        }
    }

    SmoochWorkers.startAll();

    await watcher.catchUp();
    await watcher.start();

    setTimeout(() => saveAfter500msOfNoWork(watcher));
}

async function saveAfter500msOfNoWork(watcher: FsWatcher) {
    while (true) {
        await wait(() => SmoochWorkers.anyWorking);
        await waitHold(() => !SmoochWorkers.anyWorking, 500);
        await watcher.save();
    }
}