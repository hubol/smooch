import { Infer, Struct } from "superstruct";
import { FsWatcherMessage } from "../watcher/fs-watcher-message";
import { SmoochWorkFn, SmoochWorker, SmoochWork } from "./smooch-worker";

type InferLoose<T> =
    T extends Struct<any, any>
    ? Infer<T>
    : T extends any
    ? any
    : never;

export interface SmoochWorkPipelineRecipe<T> {
    readonly name: string;
    configSchema: T;
    acceptorFactory: (t: InferLoose<T>) => ISmoochWorkAcceptor;
    queueFactory: (t: InferLoose<T>) => ISmoochWorkQueue;
    workFnFactory: (t: InferLoose<T>) => SmoochWorkFn;
}

export class SmoochWorkPipelineRecipeFactory {
    private constructor() { }

    static create<T>(t: SmoochWorkPipelineRecipe<T>) {
        return t;
    }
}

export class SmoochWorkPipeline {
    private constructor(
        private readonly _acceptor: ISmoochWorkAcceptor,
        private readonly _queue: ISmoochWorkEnqueue) {

        }

    static create<TConfig>(recipe: SmoochWorkPipelineRecipe<TConfig>, config: InferLoose<TConfig>) {
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
