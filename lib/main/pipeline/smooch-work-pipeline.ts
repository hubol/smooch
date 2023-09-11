import { Infer, Struct } from "superstruct";
import { FsWatcherMessage } from "../watcher/fs-watcher-message";
import { SmoochWorkFn, SmoochWorker, SmoochWork, ISmoochWorkers } from "./smooch-worker";
import ParcelWatcher from "@parcel/watcher";

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
        readonly recipe: SmoochWorkPipelineRecipe<unknown>,
        private readonly _acceptor: ISmoochWorkAcceptor,
        private readonly _queue: ISmoochWorkEnqueue) {

        }

    static create<TConfig>(recipe: SmoochWorkPipelineRecipe<TConfig>, config: InferLoose<TConfig>, context: ISmoochWorkers) {
        const acceptor = recipe.acceptorFactory(config);
        const queue = recipe.queueFactory(config);
        const workFn = recipe.workFnFactory(config);
        const worker = new SmoochWorker(queue, workFn);
        context.register(worker);
        return new SmoochWorkPipeline(recipe, acceptor, queue);
    }

    async accept(message: FsWatcherMessage): Promise<boolean> {
        const acceptResult = await Promise.resolve(this._acceptor.accept(message));
        if (acceptResult.type === 'Rejected')
            return false;
        
        this._queue.enqueue(acceptResult);
        return true;
    }
}

export interface ISmoochWorkAcceptor {
    accept(message: FsWatcherMessage): Promise<AcceptResult.t> | AcceptResult.t;
}

export const symbolFn = Symbol;

export namespace AcceptResult {
    export namespace Accepted {
        export interface WithMatches {
            type: 'AcceptedWithMatches';
            assetMatches: ParcelWatcher.Event[];
            dependencyMatches: ParcelWatcher.Event[];
            outputMatches: ParcelWatcher.Event[];
            sourceMessage: FsWatcherMessage;
        }

        export namespace Nascent {
            export interface t {
                type: 'AcceptedNascent'
            }
    
            export const Instance: t = {
                type: 'AcceptedNascent'
            }
        }

        export type t = WithMatches | Nascent.t;
    }

    export namespace Rejected {
        export interface t {
            type: 'Rejected'
        }

        export const Instance: t = {
            type: 'Rejected'
        }
    }

    export type t = Rejected.t | Accepted.t;
}

interface ISmoochWorkEnqueue {
    enqueue(message: AcceptResult.Accepted.t): void;
}

export interface ISmoochWorkDequeue {
    readonly isWorkReady: boolean;
    dequeue(): SmoochWork;
}

export type ISmoochWorkQueue = ISmoochWorkEnqueue & ISmoochWorkDequeue;
