import chalk from "chalk";
import { Logger } from "../../common/logger";
import { sleep } from "../../common/wait";
import { FsWatcher } from "../watcher/fs-watcher";
import { FsWatcherMessage } from "../watcher/fs-watcher-message";
import { ISmoochWorkDequeue } from "./smooch-work-pipeline";
import { ErrorPrinter } from "../../common/error-printer";

export type SmoochWork = FsWatcherMessage[];
export type SmoochWorkFn = (work: SmoochWork) => unknown;
const _smoochWorkers: SmoochWorker[] = [];

export class SmoochWorker {
    private static readonly _logger = new Logger(SmoochWorker, 'yellow');

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
            let errorCount = 0;

            while (true) {
                try {
                    await Promise.resolve(this._workFn(work));
                    break;
                }
                catch (e) {
                    errorCount += 1;

                    SmoochWorker._logger.error(chalk.red`Encountered error while working:`);
                    SmoochWorker._logger.error(ErrorPrinter.toPrintable(e));

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

export class SmoochWorkers {
    private static readonly _logger = new Logger(SmoochWorkers, 'yellow');

    private constructor() { }

    static startAll(saveable: Pick<FsWatcher, 'save'>) {
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
