import ParcelWatcher, { AsyncSubscription, SubscribeCallback, Event } from "@parcel/watcher";
import { Fs } from "../common/fs";
import { RelativePath } from "../common/relative-path";
import { RethrownError } from "../common/rethrown-error";
import { wait } from "../common/wait";
import chalk from "chalk";

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

function toPrintable(events: Event[]) {
    if (events.length === 0)
        return chalk.gray`<no events>`;
    
    const created = events.filter(x => x.type === 'create');
    const updated = events.filter(x => x.type === 'update');
    const deleted = events.filter(x => x.type === 'delete');

    return `${chalk.green(toPrintableType(created, 'A'))} ${chalk.blue(toPrintableType(updated, 'M'))} ${chalk.red(toPrintableType(deleted, 'D'))}`.trim();
}

class DirectorySubscriber {
    constructor(
        readonly name: string,
        private readonly _worker: SmoochWorker) { }

    async onInputDirectoryEvent(err: Error | null, events: Event[]) {
        console.debug(`${this} received InputDirectoryEvent: ${toPrintable(events)}`);
        await this._worker.work();
    }

    async onOutputDirectoryEvent(err: Error | null, events: Event[]) {
        const deleteEvents = events.filter(ev => ev.type === 'delete');

        if (deleteEvents.length > 0) {
            console.debug(`${this} received OutputDirectoryEvent: ${toPrintable(deleteEvents)}`);
            await this._worker.work();
        }
    }

    toString() {
        return chalk.blue`[DirectorySubscriber ${this.name}]`;
    }
}

export class SmoochWatcher {
    private _started: boolean;

    constructor(
        readonly name: string,
        readonly inputDirectory: RelativePath,
        readonly outputDirectory: RelativePath,
        readonly snapshotDirectory: RelativePath,
        readonly worker: SmoochWorker) { }

    private readonly _subscriptions: DirectorySubscription[] = [];

    async start() {
        if (this._started)
            return console.warn(`Attempting to start already-started ${this.name}!`);
        
        try {
            const subscriber = new DirectorySubscriber(this.name, this.worker);

            this._subscriptions.push(...await Promise.all([
                DirectorySubscription.create(`${this.name}-input`, this.inputDirectory, this.snapshotDirectory, (...args) => subscriber.onInputDirectoryEvent(...args)),
                DirectorySubscription.create(`${this.name}-output`, this.outputDirectory, this.snapshotDirectory, (...args) => subscriber.onOutputDirectoryEvent(...args)),
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
        }
        catch (e) {
            throw new RethrownError(`A fatal error occurred while checking events ${this}`, e);
        }
    }

    async save() {
        try {
            await Promise.all(this._subscriptions.map(x => x.save()));
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
                console.warn(`An error occurred while ${this} was stopping subscription ${subscription}`);
                console.warn(e);
            }
        }
    }

    toString() {
        return `[SmoochWatcher] ${this.name}`;
    }
}

class DirectorySubscription {
    private constructor(
        readonly name: string,
        readonly directory: RelativePath,
        private readonly _snapshotFilePath: string,
        private readonly _subscription: AsyncSubscription,
        private readonly _subscribeCallback: SubscribeCallback) {
            console.log(`${this} started on ${this.directory.absolutePath}...`);
        }

    static async create(name: string, directory: RelativePath, snapshotDirectory: RelativePath, fn: SubscribeCallback) {
        const subscription = await ParcelWatcher.subscribe(directory.absolutePath, fn);
        return new DirectorySubscription(name, directory, Fs.resolve(snapshotDirectory.absolutePath, `snapshot-${name}.txt`), subscription, fn);
    }

    async catchUp() {
        const events = await ParcelWatcher.getEventsSince(this.directory.absolutePath, this._snapshotFilePath);
        this._subscribeCallback(null, events);
    }

    async save() {
        return await ParcelWatcher.writeSnapshot(this.directory.absolutePath, this._snapshotFilePath);
    }

    async stop() {
        console.log('Stopping ' + this + '...');
        await this._subscription.unsubscribe();
        console.log('...Stopped ' + this);
    }

    toString() {
        return chalk.blue`[DirectorySubscription ${this.name}]`;
    }
}
