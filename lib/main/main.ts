import { Fs } from "../common/fs";
import { AbsolutePath, CwdRelativePath } from "../common/relative-path";
import { ParcelFsResources } from "./watcher/parcel-fs-resources";
import { FsWatcher } from "./watcher/fs-watcher";
import { SmoochWorkers } from "./pipeline/smooch-worker";
import { SmoochWorkPipeline } from "./pipeline/smooch-work-pipeline";
import { SmoochConfigType } from "./smooch-config";
import { SmoochRecipes } from "./smooch-recipes";

export async function main({ core, ...rest }: SmoochConfigType) {
    await Fs.mkdir(core.cacheFolder.absolutePath, { recursive: true });

    const workspaceDirectory = new CwdRelativePath('');
    const snapshotFile = new AbsolutePath(core.cacheFolder, 'snapshot.txt');

    const resources = await ParcelFsResources.create(
        workspaceDirectory,
        snapshotFile,
        { ignore: [ 'node_modules/', '.git/', snapshotFile.absolutePath ] });
    const watcher = new FsWatcher(resources);

    for (const key in SmoochRecipes.available) {
        const recipe = SmoochRecipes.available[key];
        for (const config of rest[key]) {
            const pipeline = SmoochWorkPipeline.create(recipe, config);
            watcher.subscribe({ identity: recipe.name, accept: x => pipeline.accept(x) });    
        }
    }

    SmoochWorkers.startAll(watcher);

    await watcher.catchUp();
    await watcher.start();
}
