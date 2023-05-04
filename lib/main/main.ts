import { Infer, array, defaulted, object } from "superstruct";
import { PackerOptions } from "../texturepack/src/options";
import { SmoochStruct } from "../common/custom-superstruct";
import { Fs } from "../common/fs";
import { SmoochWatcher, SmoochWorker } from "./smooch-watcher";
import { texturePack } from "../texturepack/src/texture-pack";

const CoreConfig = object({
    cacheFolder: SmoochStruct.CwdRelativePath,
})

export const MainConfig = object({
    core: CoreConfig,
    textures: defaulted(array(PackerOptions), []),
});

export async function main({ core, textures }: Infer<typeof MainConfig>) {
    await Fs.mkdir(core.cacheFolder.absolutePath, { recursive: true });
    
    for (let i = 0; i < textures.length; i++) {
        const texture = textures[i];
        const textureWorker = new SmoochWorker(() => texturePack(texture));
        const textureWatcher = new SmoochWatcher(`texture[${i}]`, texture.folder, texture.outFolder, core.cacheFolder, textureWorker);
        await textureWatcher.start();
        await textureWatcher.catchUp();
        await textureWatcher.save();
    }
    // await textureWatcher.stop();
}
