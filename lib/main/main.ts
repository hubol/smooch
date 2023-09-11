import { Fs } from "../common/fs";
import { ParcelFsResources, ParcelSubscription } from "./watcher/parcel-fs-resources";
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
import { ErrorPrinter } from "../common/error-printer";
import { SubscribeCallback } from "@parcel/watcher";
import { Gwob } from "../common/gwob";
import { runCliUtilCommand } from "./cli-utils/commands";
import { SmoochConfigSingleton } from "./smooch-config-singleton";

const logger = new Logger('Main', 'green');

export async function main() {
    if (await runCliUtilCommand())
        return;

    const subscription =
        new ParcelSubscription(Path.Directory.create('./'), { ignore: [ 'node_modules/', '.git/' ] });
    
    const smoochJsonMatch = Gwob.match(Path.Glob.create('smooch.json'));

    let smoochJsonEvents = 0;

    const cb: SubscribeCallback = (err, events) => {
        if (err) {
            logger.error('Received Parcel subscription error');
            logger.error(ErrorPrinter.toPrintable(err));
            return;
        }

        if (events.some(e => smoochJsonMatch(e.path)))
            smoochJsonEvents += 1;
    }

    await subscription.start(cb);

    let deleteSnapshotFile = false;
    
    while (true) {
        let application: Application | undefined;

        try {
            const config = await readConfigFromSmoochJson();
            application = await Application.create(config, deleteSnapshotFile);
            await application.start();
        }
        catch (e) {
            logger.error('An error occurred while creating the application from smooch.json');
            logger.error(ErrorPrinter.toPrintable(e));
        }

        smoochJsonEvents = 0;
        await wait(() => smoochJsonEvents > 0);

        deleteSnapshotFile = true;

        logger.log('smooch.json change detected, triggering restart...');

        try {
            if (application) {
                logger.log('Sending stop signal...');
                await application.stop();
            }
        }
        catch (e) {
            logger.error('An error occurred while stopping the application');
            logger.error(ErrorPrinter.toPrintable(e));
        }

        logger.log('Waiting for 250ms...');
        await sleep(250);
        logger.log('Restarting application...');
    }
}

export async function readConfigFromSmoochJson() {
    const configJson = await JsonFile.read('smooch.json');
    delete configJson['$schema'];
	return validateOptions(configJson, SmoochConfig);
}

class Application {
    private constructor(
        private readonly _watcher: FsWatcher,
        private readonly _workers: SmoochWorkers,
        readonly config: SmoochConfigType,) {
            SmoochConfigSingleton.set(config);
    }

    static async create(config: SmoochConfigType, deleteSnapshotFile: boolean) {
        const { core } = config;

        await Fs.mkdir(core.cacheFolder, { recursive: true });

        const workspaceDirectory = Path.Directory.create('./');
        const snapshotFile = Path.File.create(Fs.resolve(core.cacheFolder, 'snapshot.txt'));

        if (deleteSnapshotFile && await Fs.exists(snapshotFile)) {
            logger.log(`Deleting snapshot file ${snapshotFile} to force Nascent message...`);
            await Fs.rm(snapshotFile);
        }

        const resources = await ParcelFsResources.create(
            workspaceDirectory,
            snapshotFile,
            { ignore: [ 'node_modules/', '.git/', snapshotFile ] });
        const watcher = new FsWatcher(resources);

        const workers = new SmoochWorkers();
        
        const pipelines = createPipelinesFromSmoochConfig(config, workers);
        for (const pipeline of pipelines)
            watcher.subscribe({ identity: pipeline.recipe.name, accept: x => pipeline.accept(x) });    

        return new Application(watcher, workers, config);
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

export function createPipelinesFromSmoochConfig({ core, ...rest }: SmoochConfigType, workers: ISmoochWorkers) {
    const pipelines: SmoochWorkPipeline[] = [];

    for (const key in SmoochRecipes.available) {
        const recipe = SmoochRecipes.available[key];
        for (const config of rest[key]) {
            const pipeline = SmoochWorkPipeline.create(recipe, config, workers);
            pipelines.push(pipeline);
        }
    }

    return pipelines;
}
