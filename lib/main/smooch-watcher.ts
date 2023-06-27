import ParcelWatcher, { AsyncSubscription, SubscribeCallback, Event } from "@parcel/watcher";
import { Fs } from "../common/fs";
import { RelativePath } from "../common/relative-path";
import { RethrownError } from "../common/rethrown-error";
import { wait } from "../common/wait";
import chalk from "chalk";
import { Logger } from "../common/logger";

export class SmoochWorker {
    constructor(private readonly _workFn: () => Promise<void>) {}

    private _isWorking = false;

    async work() {
        await wait(() => !this._isWorking);
        this._isWorking = true;
        await this._workFn();
        this._isWorking = false;
    }
}

function toPrintableType(events: Event[], type: string) {
    if (events.length === 0)
        return '';
    return events.length === 1 ? `[${events[0].path} ${type}]` : `[${events.length}x ${type}]`;
}

function toPrintableMessage({ events, isCatchUp, isNascent }: FsWatcherMessage) {
    if (isNascent)
        return chalk.green`<Nascent message>`
    
    return `${ isCatchUp ? "(Catch-up) " : "" }${toPrintableEvents(events)}`;
}

function toPrintableEvents(events: FsWatcherMessage['events']) {
    if (events.length === 0)
        return chalk.gray`<no events>`;
    
    const created = events.filter(x => x.type === 'create');
    const updated = events.filter(x => x.type === 'update');
    const deleted = events.filter(x => x.type === 'delete');

    return `${chalk.green(toPrintableType(created, 'A'))} ${chalk.blue(toPrintableType(updated, 'M'))} ${chalk.red(toPrintableType(deleted, 'D'))}`.trim();
}

class DirectorySubscriber {
    private readonly _logger: Logger;

    constructor(
        readonly name: string,
        private readonly _worker: SmoochWorker) {
            this._logger = new Logger(this, 'blue');
        }

    async onInputDirectoryMessage(message: FsWatcherMessage) {
        this._logger.debug(`Received InputDirectoryMessage: ${toPrintableMessage(message)}`);
        if (message.events.length === 0 && !message.isNascent)
            return this._logger.debug(`...InputDirectoryMessage rejected (no events and is not Nascent)`);
        await this._worker.work();
    }

    async onOutputDirectoryMessage(message: FsWatcherMessage) {
        const deleteEvents = message.events.filter(ev => ev.type === 'delete');

        this._logger.debug(`Received OutputDirectoryMessage: ${toPrintableMessage(message)}`);

        if (deleteEvents.length > 0)
            await this._worker.work();
        else
            this._logger.debug(`...OutputDirectoryMessage rejected (no delete events)`);
    }

    toString() {
        return `[DirectorySubscriber ${this.name}]`;
    }
}

export class SmoochWatcher {
    private _started = false;

    constructor(
        readonly name: string,
        readonly inputDirectory: RelativePath,
        readonly outputDirectory: RelativePath,
        readonly snapshotDirectory: RelativePath,
        readonly worker: SmoochWorker,) {
            this._logger = new Logger(this, 'yellow');
    }

    private readonly _subscriptions: DirectorySubscription[] = [];
    private readonly _logger: Logger;

    async start() {
        if (this._started)
            return this._logger.warn(`Attempting to start, but was already-started!`);
        
        try {
            const subscriber = new DirectorySubscriber(this.name, this.worker);

            this._subscriptions.push(...await Promise.all([
                DirectorySubscription.create(`${this.name}(In)`, this.inputDirectory, this.snapshotDirectory, (...args) => subscriber.onInputDirectoryMessage(...args)),
                DirectorySubscription.create(`${this.name}(Out)`, this.outputDirectory, this.snapshotDirectory, (...args) => subscriber.onOutputDirectoryMessage(...args)),
            ]));
        }
        catch (e) {
            throw new RethrownError(`A fatal error occurred while starting ${this}`, e);
        }

        this._started = true;
    }

    async catchUp() {
        try {
            await Promise.all(this._subscriptions.map(x => x.catchUp()));
            this._logger.log(`Caught up on events.`);
        }
        catch (e) {
            throw new RethrownError(`A fatal error occurred while checking events ${this}`, e);
        }
    }

    async save() {
        try {
            await Promise.all(this._subscriptions.map(x => x.save()));
            this._logger.debug(`Saved state.`);
        }
        catch (e) {
            throw new RethrownError(`A fatal error occurred while saving ${this}`, e);
        }
    }

    async stop() {
        while (this._subscriptions.length > 0) {
            const subscription = this._subscriptions.pop()!;
            try {
                await subscription.stop();
            }
            catch (e) {
                this._logger.warn(`An error occurred while stopping subscription ${subscription}`);
                this._logger.warn(e);
            }
        }
    }

    toString() {
        return `SmoochWatcher ${this.name}`;
    }
}

type FsWatcherMessageCallback = (message: FsWatcherMessage) => unknown;

class DirectorySubscription {
    private readonly _logger: Logger;

    private constructor(
        readonly name: string,
        readonly directory: RelativePath,
        private readonly _snapshotFilePath: string,
        private readonly _subscription: AsyncSubscription,
        private readonly _messageCallback: FsWatcherMessageCallback) {
            this._logger = new Logger(this, 'yellow');
            this._logger.log(`Started on ${this.directory.absolutePath}...`);
        }

    static async create(name: string, directory: RelativePath, snapshotDirectory: RelativePath, fn: FsWatcherMessageCallback) {
        if (!await Fs.exists(directory.absolutePath))
            throw new Error(`Can't create [DirectorySubscription]: ${directory.absolutePath} does not exist!`);
        const subscription = await ParcelWatcher.subscribe(directory.absolutePath, (error, events) => fn(FsWatcherMessageFactory.createMessage(error, events)));
        return new DirectorySubscription(name, directory, Fs.resolve(snapshotDirectory.absolutePath, `snapshot-${name}.txt`), subscription, fn);
    }

    async catchUp() {
        const message = await FsWatcherMessageFactory.createCatchUpMessage(this.directory, this._snapshotFilePath);
        this._messageCallback(message);
    }

    async save() {
        return await ParcelWatcher.writeSnapshot(this.directory.absolutePath, this._snapshotFilePath);
    }

    async stop() {
        this._logger.log('Stopping...');
        await this._subscription.unsubscribe();
        this._logger.log('...Stopped.');
    }

    toString() {
        return `DirectorySubscription ${this.name}`;
    }
}

interface FsWatcherMessage {
    events: Event[];
    error: Error | null;
    isCatchUp: boolean;
    isNascent: boolean;
}

class FsWatcherMessageFactory {
    private static readonly _logger = new Logger(FsWatcherMessageFactory, 'blue');

    static async createCatchUpMessage(directory: RelativePath, snapshotFilePath: string): Promise<FsWatcherMessage> {
        if (!await Fs.exists(snapshotFilePath)) {
            this._logger.log(`Snapshot file (${snapshotFilePath}) does not exist. Creating Nascent Catch-up message...`);
            return { events: [], isCatchUp: true, isNascent: true, error: null };
        }
        const events = await ParcelWatcher.getEventsSince(directory.absolutePath, snapshotFilePath);
        return { events, isCatchUp: true, isNascent: false, error: null };
    }

    static createMessage(error: Error | null, events: Event[]): FsWatcherMessage {
        return { error, events, isCatchUp: false, isNascent: false };
    }
}
