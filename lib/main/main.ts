import { Fs } from "../common/fs";
import { ParcelFsResources } from "./watcher/parcel-fs-resources";
import { FsWatcher } from "./watcher/fs-watcher";
import { ISmoochWorkers, SmoochWorkers } from "./pipeline/smooch-worker";
import { SmoochWorkPipeline } from "./pipeline/smooch-work-pipeline";
import { SmoochConfig, SmoochConfigType } from "./smooch-config";
import { SmoochRecipes } from "./smooch-recipes";
import { Path } from "../common/path";
import { validateOptions } from "../common/validate-options";
import { JsonFile } from "../common/json-file";
import { sleep, wait } from "../common/wait";
import { Logger } from "../common/logger";
import { runCliUtilCommand } from "./cli-utils/commands";
import { Global } from "./global";
import { SmoochJsonWatcher } from "./smooch-json-watcher";
import { SmoochEffectiveConfig } from "./smooch-effective-config";

const logger = new Logger("Main", "green");

export async function main() {
    if (await runCliUtilCommand()) {
        return;
    }

    await SmoochJsonWatcher.start();

    let deleteSnapshotFile = false;

    while (true) {
        let application: Application | undefined;

        try {
            SmoochJsonWatcher.clearEvents();
            const config = await readConfigFromSmoochJson();
            if (!deleteSnapshotFile) {
                deleteSnapshotFile = await SmoochEffectiveConfig.checkIfChanged(config);
            }
            application = await Application.create(config, deleteSnapshotFile);
            await application.start();
            await SmoochEffectiveConfig.write(config);
        }
        catch (e) {
            logger.error("An error occurred while creating the application from smooch.json", e);
        }

        await wait(() => SmoochJsonWatcher.eventsCount > 0);

        deleteSnapshotFile = true;

        logger.log("smooch.json change detected, triggering restart...");

        try {
            if (application) {
                logger.log("Sending stop signal...");
                await application.stop();
            }
        }
        catch (e) {
            logger.error("An error occurred while stopping the application", e);
        }

        logger.log("Waiting for 250ms...");
        await sleep(250);
        logger.log("Restarting application...");
    }
}

export async function readConfigFromSmoochJson() {
    const configJson = await JsonFile.read("smooch.json");
    delete configJson["$schema"];
    return validateOptions(configJson, SmoochConfig);
}

class Application {
    private constructor(
        private readonly _watcher: FsWatcher,
        private readonly _workers: SmoochWorkers,
    ) {}

    static async create(config: SmoochConfigType, deleteSnapshotFile: boolean) {
        Fs._setWriteFileLineEnding(config.global.endOfLineSequence);

        await Fs.mkdir(Global.cacheDir, { recursive: true });

        const workspaceDirectory = Path.Directory.create("./");
        const snapshotFile = Path.File.create(Fs.resolve(Global.cacheDir, "snapshot.txt"));

        if (deleteSnapshotFile && await Fs.exists(snapshotFile)) {
            logger.log(`Deleting snapshot file ${snapshotFile} to force Nascent message...`);
            await Fs.rm(snapshotFile);
        }

        const resources = await ParcelFsResources.create(
            workspaceDirectory,
            snapshotFile,
            { ignore: [...ParcelFsResources.sensibleIgnoreGlobs] },
        );
        const watcher = new FsWatcher(resources);

        const workers = new SmoochWorkers();

        const pipelines = createPipelinesFromSmoochConfig(config, workers);
        for (const pipeline of pipelines) {
            watcher.subscribe({ identity: pipeline.recipe.name, accept: x => pipeline.accept(x) });
        }

        return new Application(watcher, workers);
    }

    async start() {
        this._workers.startAll(this._watcher);

        await this._watcher.catchUp();
        await this._watcher.start();
    }

    async stop() {
        await this._watcher.stop();
        await this._workers.stop();
    }
}

export function createPipelinesFromSmoochConfig(smoochConfig: SmoochConfigType, workers: ISmoochWorkers) {
    const pipelines: SmoochWorkPipeline[] = [];

    for (const key in SmoochRecipes.available) {
        const recipe = SmoochRecipes.available[key];
        for (const config of smoochConfig[key]) {
            const pipeline = SmoochWorkPipeline.create(recipe, config, workers);
            pipelines.push(pipeline);
        }
    }

    return pipelines;
}
