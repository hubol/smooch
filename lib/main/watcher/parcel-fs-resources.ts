import ParcelWatcher, { SubscribeCallback, AsyncSubscription } from "@parcel/watcher";
import { Fs } from "../../common/fs";
import { RelativePath } from "../../common/relative-path";
import { Logger } from "../../common/logger";

export class ParcelSnapshot {
    constructor(
        readonly watchedDirectoryPath: RelativePath,
        readonly filePath: RelativePath,
        readonly options: ParcelWatcher.Options,
    ) {}

    static async write(snapshot: ParcelSnapshot) {
        return await ParcelWatcher.writeSnapshot(
            snapshot.watchedDirectoryPath.absolutePath,
            snapshot.filePath.absolutePath,
            snapshot.options);
    }

    static getEventsSince(snapshot: ParcelSnapshot) {
        return ParcelWatcher.getEventsSince(snapshot.watchedDirectoryPath.absolutePath, snapshot.filePath.absolutePath, snapshot.options);
    }
}

export class ParcelSubscription {
    private static _logger = new Logger(ParcelSubscription, 'yellow');

    private _started = false;
    private _stopped = false;
    private _asyncSubscription?: AsyncSubscription;

    constructor(
        readonly watchedDirectoryPath: RelativePath,
        readonly options: ParcelWatcher.Options,
    ) {}

    async start(cb: SubscribeCallback) {
        if (this._started)
            return ParcelSubscription._logger.warn(`Attempting to start, but already-started or starting!`);
        this._started = true;
        this._stopped = false;
        this._asyncSubscription = await ParcelWatcher.subscribe(this.watchedDirectoryPath.absolutePath, cb, this.options);
    }

    async stop() {
        if (!this._started || this._stopped || !this._asyncSubscription)
            return ParcelSubscription._logger.warn(`Attempting to start, but unstarted or stopped!`);

        try {
            await this._asyncSubscription.unsubscribe();
            this._stopped = true;
            this._started = false;
        }
        catch (e) {
            ParcelSubscription._logger.warn(`An error occurred while stopping`);
            ParcelSubscription._logger.warn(e);
        }
    }

    static async write(snapshot: ParcelSnapshot) {
        return await ParcelWatcher.writeSnapshot(snapshot.watchedDirectoryPath.absolutePath, snapshot.filePath.absolutePath);
    }
}

export class ParcelFsResources {
    private constructor(
        readonly snapshot: ParcelSnapshot,
        readonly subscription: ParcelSubscription,
    ) { }

    static async create(directory: RelativePath, snapshotFile: RelativePath, options: ParcelWatcher.Options) {
        if (!await Fs.exists(directory.absolutePath))
            throw new Error(`Can't create ${ParcelFsResources}: ${directory.absolutePath} does not exist!`);

        return new ParcelFsResources(
            new ParcelSnapshot(directory, snapshotFile, options),
            new ParcelSubscription(directory, options),
        )
    }
}