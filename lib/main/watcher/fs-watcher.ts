import { Event } from "@parcel/watcher";
import chalk from "chalk";
import { ParcelSnapshot, ParcelFsResources, ParcelSubscription } from "./parcel-fs-resources";
import { FsWatcherMessage, FsWatcherMessageFactory, FsWatcherMessageDescriber } from "./fs-watcher-message";
import { Logger } from "../../common/logger";

interface FsWatcherSubscription {
    readonly identity: string;
    readonly accept: FsWatcherSubscribeCallback;
}

type FsWatcherSubscribeCallback = (message: FsWatcherMessage) => boolean | Promise<boolean>;

export class FsWatcher {
    private static readonly _logger = new Logger(FsWatcher, 'blue');

    private readonly _parcelSnapshot: ParcelSnapshot;
    private readonly _parcelSubscription: ParcelSubscription;

    private readonly _subscriptions: FsWatcherSubscription[] = [];

    constructor(
        parcelResources: ParcelFsResources) {
        this._parcelSnapshot = parcelResources.snapshot;
        this._parcelSubscription = parcelResources.subscription;
    }

    async start() {
        await this._parcelSubscription.start((error, events) => this._onParcelEvent(error, events));
    }

    subscribe(subscription: FsWatcherSubscription) {
        this._subscriptions.push(subscription);
    }

    async catchUp() {
        const message = await FsWatcherMessageFactory.createCatchUpMessage(this._parcelSnapshot);
        this._dispatch(message);
    }

    async save() {
        FsWatcher._logger.debug(`Saving state...`);
        await ParcelSnapshot.write(this._parcelSnapshot);
        FsWatcher._logger.debug(`Saved state.`);
    }

    async stop() {
        await this._parcelSubscription.stop();
    }

    private _onParcelEvent(error: Error | null, events: Event[]) {
        if (!error)
            return this._dispatch(FsWatcherMessageFactory.createMessage(events));
        FsWatcher._logger.error(`@parcel/watcher gave an error`, error);
    }

    private _dispatch(message: FsWatcherMessage) {
        setTimeout(() => this._dispatchAsync(message));
    }

    private async _dispatchAsync(message: FsWatcherMessage) {
        let subscriptionAcceptedCount = 0;

        await Promise.all(this._subscriptions.map(async subscription => {
            try {
                if (await Promise.resolve(subscription.accept(message)))
                    subscriptionAcceptedCount++;
            }
            catch (e) {
                FsWatcher._logger.error(
                    `An error occurred while Subscription ${subscription.identity} was accepting ${FsWatcherMessageDescriber.describeBrief(message)}`, e);
            }
        }));
        
        if (subscriptionAcceptedCount)
            FsWatcher._logger.debug(chalk.white
            `${subscriptionAcceptedCount} subscription(s) accepted ${FsWatcherMessageDescriber.describe(message)}`);
        else
            FsWatcher._logger.debug(chalk.gray
                `Ignored ${FsWatcherMessageDescriber.describe(message)}`);
    }
}
