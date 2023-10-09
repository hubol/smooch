import { Boundary_ParcelWatcher } from "../../common/native/boundary/parcel-watcher-api";
import { Fs } from "../../common/fs";
import { Logger } from "../../common/logger";
import { Path } from "../../common/path";
import { Native } from "../../common/native/native-module";

type Options = Boundary_ParcelWatcher.Options;
type AsyncSubscription = Boundary_ParcelWatcher.AsyncSubscription;
type SubscribeCallback = Boundary_ParcelWatcher.SubscribeCallback;
const { ParcelWatcher } = Native;

export class ParcelSnapshot {
    constructor(
        readonly watchedDirectoryPath: Path.Directory.t,
        readonly filePath: Path.File.t,
        readonly options: Options,
    ) {}

    static async write(snapshot: ParcelSnapshot) {
        return await ParcelWatcher.writeSnapshot(
            snapshot.watchedDirectoryPath,
            snapshot.filePath,
            snapshot.options);
    }

    static getEventsSince(snapshot: ParcelSnapshot) {
        return ParcelWatcher.getEventsSince(snapshot.watchedDirectoryPath, snapshot.filePath, snapshot.options);
    }
}

export class ParcelSubscription {
    private static _logger = new Logger(ParcelSubscription, 'yellow');

    private _started = false;
    private _stopped = false;
    private _asyncSubscription?: AsyncSubscription;

    constructor(
        readonly watchedDirectoryPath: Path.Directory.t,
        readonly options: Options,
    ) {}

    async start(cb: SubscribeCallback) {
        if (this._started)
            return ParcelSubscription._logger.warn(`Attempting to start, but already-started or starting!`);
        this._started = true;
        this._stopped = false;
        this._asyncSubscription = await ParcelWatcher.subscribe(this.watchedDirectoryPath, cb, this.options);
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
            ParcelSubscription._logger.warn(`An error occurred while stopping`, e);
        }
    }

    static async write(snapshot: ParcelSnapshot) {
        return await ParcelWatcher.writeSnapshot(snapshot.watchedDirectoryPath, snapshot.filePath);
    }
}

export class ParcelFsResources {
    private constructor(
        readonly snapshot: ParcelSnapshot,
        readonly subscription: ParcelSubscription,
    ) { }

    static async create(directory: Path.Directory.t, snapshotFile: Path.File.t, options: Options) {
        if (!await Fs.exists(directory))
            throw new Error(`Can't create ${ParcelFsResources}: ${directory} does not exist!`);

        return new ParcelFsResources(
            new ParcelSnapshot(directory, snapshotFile, options),
            new ParcelSubscription(directory, options),
        )
    }

    static readonly sensibleIgnoreGlobs = [ 'node_modules/', '.git/', '.smooch/snapshot.txt', '**/node_modules/**/*' ] as const;
}