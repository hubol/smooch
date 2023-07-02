import { FsWatcherMessage } from "../watcher/fs-watcher-message";
import { ISmoochWorkQueue } from "./smooch-work-pipeline";

export class SmoochWorkQueue implements ISmoochWorkQueue {
    private readonly _queue: FsWatcherMessage[] = [];

    get isWorkReady() {
        return this._queue.length > 0;
    }

    enqueue(message: FsWatcherMessage) {
        this._queue.push(message);
    }

    dequeue() {
        return this._queue.splice(0);
    }

}