 import { Logger } from "../../common/logger";
import { sleep } from "../../common/wait";
import { FsWatcherMessage } from "../watcher/fs-watcher-message";
import { ISmoochWorkDequeue } from "./smooch-work-pipeline";


export type SmoochWork = FsWatcherMessage[];
export type SmoochWorkFn = (work: SmoochWork) => unknown;
const _smoochWorkers: SmoochWorker[] = [];

export class SmoochWorker {
    isWorking = false;

    constructor(
        readonly queue: ISmoochWorkDequeue,
        private readonly _workFn: SmoochWorkFn) {
        _smoochWorkers.push(this);
    }

    work(work: SmoochWork) {
        if (this.isWorking)
            throw new Error(`SmoochWorker can't start working when already working!`);

        if (work.length === 0)
            throw new Error(`SmoochWorker shouldn't be given work without any FsWatcherMessages!`);

        this.isWorking = true;

        setTimeout(async () => {
            // TODO log errors
            await Promise.resolve(this._workFn(work));
            this.isWorking = false;
        });
    }
}

export class SmoochWorkers {
    private static readonly _logger = new Logger(SmoochWorkers, 'yellow');

    private constructor() { }

    static startAll(saveable: ISaveable) {
        setTimeout(async () => {
            let anyWorkCompletedSinceLastSave = false;

            while (true) {
                try {
                    this._step();

                    if (!anyWorkCompletedSinceLastSave)
                        anyWorkCompletedSinceLastSave = this.anyWorking;
                    else if (!this.anyWorking) {
                        anyWorkCompletedSinceLastSave = false;
                        await saveable.save();
                    }
                }
                catch (e) {
                    this._logger.error(`An error occurred during _step()`);
                    this._logger.error(e);
                }
                await sleep(16);
            }
        });
    }

    private static _step() {
        for (const worker of _smoochWorkers) {
            if (!worker.isWorking && worker.queue.isWorkReady) {
                try {
                    worker.work(worker.queue.dequeue());
                }
                catch (e) {
                    this._logger.error(`An error occurred while giving ${worker} work from ${worker.queue}`);
                    this._logger.error(e);
                }
            }
        }
    }

    static get anyWorking() {
        return _smoochWorkers.some(x => x.isWorking);
    }
}

interface ISaveable {
    save(): Promise<void>;
}