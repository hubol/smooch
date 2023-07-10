import { Event } from "@parcel/watcher";
import chalk from "chalk";
import { ParcelSnapshot } from "./parcel-fs-resources";
import { Fs } from "../../common/fs";
import { Logger } from "../../common/logger";

export interface FsWatcherMessage {
    readonly events: ReadonlyArray<Event>;
    readonly isCatchUp: boolean;
    readonly isNascent: boolean;

    readonly index: number;
    readonly createdAt: number;
}

export class FsWatcherMessageDescriber {
    private constructor() { }

    static describe(message: FsWatcherMessage) {
        return `Message #${message.index} ${this._toPrintable(message)}`;
    }

    static describeBrief(message: FsWatcherMessage) {
        return `Message #${message.index}`;
    }

    private static _toPrintable({ events, isCatchUp, isNascent }: FsWatcherMessage) {
        if (isNascent)
            return chalk.green`<Nascent message>`
        
        return `${ isCatchUp ? "(Catch-up) " : "" }${this._toPrintableEvents(events)}`;
    }

    private static _toPrintableType(events: Event[], type: string) {
        if (events.length === 0)
            return '';
        return events.length <= 3
            ? events.map(event => `[${event.path} ${type}]`).join(' ')
            : `[${events.length}x ${type}]`;
    }
    
    private static _toPrintableEvents(events: FsWatcherMessage['events']) {
        if (events.length === 0)
            return chalk.gray`<no events>`;
        
        const created = events.filter(x => x.type === 'create');
        const updated = events.filter(x => x.type === 'update');
        const deleted = events.filter(x => x.type === 'delete');
    
        return `${chalk.green(this._toPrintableType(created, 'A'))} ${chalk.blue(this._toPrintableType(updated, 'M'))} ${chalk.red(this._toPrintableType(deleted, 'D'))}`.trim();
    }
}

export class FsWatcherMessageFactory {
    private static readonly _logger = new Logger(FsWatcherMessageFactory, 'blue');

    private constructor() { }

    static async createCatchUpMessage(snapshot: ParcelSnapshot): Promise<FsWatcherMessage> {
        if (!await Fs.exists(snapshot.filePath)) {
            this._logger.log(`Snapshot file (${snapshot.filePath}) does not exist. Creating Nascent Catch-up message...`);
            return this._createFsWatcherMessage({ events: [], isCatchUp: true, isNascent: true });
        }
        const events = await ParcelSnapshot.getEventsSince(snapshot);
        return this._createFsWatcherMessage({ events, isCatchUp: true, isNascent: false });
    }

    static createMessage(events: Event[]): FsWatcherMessage {
        return this._createFsWatcherMessage({ events, isCatchUp: false, isNascent: false });
    }

    private static _fsWatcherMessageIndex = 0;
    private static _createFsWatcherMessage(partial: Pick<FsWatcherMessage, 'events' | 'isCatchUp' | 'isNascent'>): FsWatcherMessage {
        return {
            ...partial,
            index: this._fsWatcherMessageIndex++,
            createdAt: Date.now(),
        }
    }
}