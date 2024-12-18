import { AcceptResult, ISmoochWorkQueue } from "./smooch-work-pipeline";

export class SmoochWorkQueue implements ISmoochWorkQueue {
    private readonly _queue: AcceptResult.Accepted.t[] = [];

    get isWorkReady() {
        return this._queue.length > 0;
    }

    enqueue(message: AcceptResult.Accepted.t) {
        this._queue.push(message);
    }

    dequeue() {
        return this._queue.splice(0);
    }
}
