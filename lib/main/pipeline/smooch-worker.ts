import chalk from "chalk";
import { Logger } from "../../common/logger";
import { sleep, wait } from "../../common/wait";
import { FsWatcher } from "../watcher/fs-watcher";
import { AcceptResult, ISmoochWorkDequeue } from "./smooch-work-pipeline";

export type SmoochWork = AcceptResult.Accepted.t[];
export type SmoochWorkFn = (work: SmoochWork) => unknown;

export class SmoochWorker {
    private static readonly _logger = new Logger(SmoochWorker, 'yellow');

    isWorking = false;

    constructor(
        readonly queue: ISmoochWorkDequeue,
        private readonly _workFn: SmoochWorkFn) {
        
    }

    work(work: SmoochWork) {
        if (this.isWorking)
            throw new Error(`SmoochWorker can't start working when already working!`);

        if (work.length === 0)
            throw new Error(`SmoochWorker shouldn't be given work without any FsWatcherMessages!`);

        this.isWorking = true;

        setTimeout(async () => {
            let errorCount = 0;

            while (true) {
                try {
                    await Promise.resolve(this._workFn(work));
                    break;
                }
                catch (e) {
                    errorCount += 1;

                    SmoochWorker._logger.error(chalk.red`Encountered error while working:`, e);

                    const retryMs = SmoochWorker._retryMs[errorCount - 1];

                    if (retryMs === undefined) {
                        console.log(chalk.red`Aborting work...`);
                        break;
                    }

                    const ms = (errorCount - 1) * 67;
                    SmoochWorker._logger.log(chalk.green`Retrying${ms ? ` (in ${ms}ms)` : ''}...`);
                    await sleep(ms);
                    SmoochWorker._logger.log(chalk.green`Retry #${errorCount}`);
                }
            }
            
            this.isWorking = false;
        });
    }

    private static readonly _retryMs = [ 0, 67, 250, 1000 ];
}

export interface ISmoochWorkers {
    register(worker: SmoochWorker): void;
}

export class SmoochWorkers implements ISmoochWorkers {
    private readonly _logger = new Logger(SmoochWorkers, 'yellow');

    private _stopping = false;
    private _stopped = false;

    private readonly _workers: SmoochWorker[] = [];

    constructor() { }

    startAll(saveable: Pick<FsWatcher, 'save'>) {
        setTimeout(async () => {
            let anyWorkCompletedSinceLastSave = false;

            while (true) {
                if (this._stopping)
                    break;
                
                try {
                    this._step();

                    if (!anyWorkCompletedSinceLastSave)
                        anyWorkCompletedSinceLastSave = this._anyWorking;
                    else if (!this._anyWorking) {
                        anyWorkCompletedSinceLastSave = false;
                        await saveable.save();
                    }
                }
                catch (e) {
                    this._logger.error(`An error occurred during _step()`, e);
                }
                await sleep(16);
            }

            this._stopped = true;
        });
    }

    async stop() {
        this._logger.log('Waiting for work to complete before stopping...');
        this._stopping = true;
        await wait(() => this._stopped);
        this._logger.log('...Stopped!');
    }

    register(worker: SmoochWorker) {
        this._workers.push(worker);
    }

    private _step() {
        for (const worker of this._workers) {
            if (!worker.isWorking && worker.queue.isWorkReady) {
                try {
                    worker.work(worker.queue.dequeue());
                }
                catch (e) {
                    this._logger.error(`An error occurred while giving ${worker} work from ${worker.queue}`, e);
                }
            }
        }
    }

    private get _anyWorking() {
        for (const worker of this._workers) {
            if (worker.isWorking)
                return true;
        }
        return false;
    }
}
