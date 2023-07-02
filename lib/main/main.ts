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
import { SmoochWorkPipeline } from "./pipeline/smooch-work-pipeline";

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

    for (const texture of textures) {
        const pipeline = SmoochWorkPipeline.create(TexturePackRecipe, texture);
        watcher.subscribe({ identity: 'texPack', accept: x => pipeline.accept(x) });
    }

    for (const jsonFile of jsonFiles) {
        const pipeline = SmoochWorkPipeline.create(AggregateJsonRecipe, jsonFile);
        watcher.subscribe({ identity: 'jsonAgg', accept: x => pipeline.accept(x) });
    }

    SmoochWorkers.startAll();

    await watcher.catchUp();
    await watcher.start();
}
