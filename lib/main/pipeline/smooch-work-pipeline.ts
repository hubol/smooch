import { FsWatcherMessage } from "../watcher/fs-watcher-message";
import { SmoochWorkFn, SmoochWorker, SmoochWork } from "./smooch-worker";

export interface SmoochWorkPipelineRecipe<TConfig> {
    readonly name: string;
    acceptorFactory: (t: TConfig) => ISmoochWorkAcceptor;
    queueFactory: (t: TConfig) => ISmoochWorkQueue;
    workFnFactory: (t: TConfig) => SmoochWorkFn;
}

export class SmoochWorkPipeline {
    private constructor(
        private readonly _acceptor: ISmoochWorkAcceptor,
        private readonly _queue: ISmoochWorkEnqueue) {

        }

    static create<TConfig>(recipe: SmoochWorkPipelineRecipe<TConfig>, config: TConfig) {
        const acceptor = recipe.acceptorFactory(config);
        const queue = recipe.queueFactory(config);
        const workFn = recipe.workFnFactory(config);
        new SmoochWorker(queue, workFn);
        return new SmoochWorkPipeline(acceptor, queue);
    }

    async accept(message: FsWatcherMessage): Promise<boolean> {
        if (!await Promise.resolve(this._acceptor.accept(message)))
            return false;
        
        this._queue.enqueue(message);
        return true;
    }
}

export interface ISmoochWorkAcceptor {
    accept(message: FsWatcherMessage): Promise<boolean> | boolean;
}

interface ISmoochWorkEnqueue {
    enqueue(message: FsWatcherMessage): void;
}

export interface ISmoochWorkDequeue {
    readonly isWorkReady: boolean;
    dequeue(): SmoochWork;
}

export type ISmoochWorkQueue = ISmoochWorkEnqueue & ISmoochWorkDequeue;
