import { Infer, Struct, array, defaulted, object } from "superstruct";
import { SmoochStruct } from "../common/custom-superstruct";
import { Fs } from "../common/fs";
import { TexturePackRecipe } from "../texturepack/src/texture-pack";
import { AggregateJsonRecipe } from "../json/aggregate-json";
import { AbsolutePath, CwdRelativePath } from "../common/relative-path";
import { ParcelFsResources } from "./watcher/parcel-fs-resources";
import { FsWatcher } from "./watcher/fs-watcher";
import { SmoochWorkers } from "./pipeline/smooch-worker";
import { SmoochWorkPipeline, SmoochWorkPipelineRecipe } from "./pipeline/smooch-work-pipeline";
import { wait, waitHold } from "../common/wait";

const CoreConfig = object({
    cacheFolder: SmoochStruct.CwdRelativePath,
})

const recipes = {
    jsonFiles: AggregateJsonRecipe,
    textures: TexturePackRecipe,
}

export const SmoochConfig = object({
    core: CoreConfig,
    ...getRecipeConfigs(),
});

export type SmoochConfigType = Infer<typeof SmoochConfig>;

export async function main({ core, ...rest }: Infer<typeof SmoochConfig>) {
    await Fs.mkdir(core.cacheFolder.absolutePath, { recursive: true });

    const resources = await ParcelFsResources.create(new CwdRelativePath(''), new AbsolutePath(core.cacheFolder, 'snapshot.txt'));
    const watcher = new FsWatcher(resources);

    for (const key in recipes) {
        const recipe = recipes[key];
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

function getRecipeConfigs(): RecipeToConfigSchema<typeof recipes> {
    const obj = {};
    for (const key in recipes)
        obj[key] = defaulted(array(recipes[key].configSchema), []);

    return obj as any;
}

type RecipeToConfigSchema<T> = {
    [k in keyof T]: T[k] extends SmoochWorkPipelineRecipe<infer E extends Struct<any, any>>
        ? Struct<Infer<T[k]['configSchema']>[], T[k]['configSchema']>
        : never;
};