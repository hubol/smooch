import { Fs } from "../common/fs";
import { AbsolutePath, CwdRelativePath } from "../common/relative-path";
import { ParcelFsResources } from "./watcher/parcel-fs-resources";
import { FsWatcher } from "./watcher/fs-watcher";
import { SmoochWorkers } from "./pipeline/smooch-worker";
import { SmoochWorkPipeline } from "./pipeline/smooch-work-pipeline";
import { wait, waitHold } from "../common/wait";
import { SmoochConfigType } from "./smooch-config";
import { SmoochRecipes } from "./smooch-recipes";

export async function main({ core, ...rest }: SmoochConfigType) {
    await Fs.mkdir(core.cacheFolder.absolutePath, { recursive: true });

    const resources = await ParcelFsResources.create(new CwdRelativePath(''), new AbsolutePath(core.cacheFolder, 'snapshot.txt'));
    const watcher = new FsWatcher(resources);

    for (const key in SmoochRecipes.available) {
        const recipe = SmoochRecipes.available[key];
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
