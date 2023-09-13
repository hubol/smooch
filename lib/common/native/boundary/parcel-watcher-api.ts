export namespace Boundary_ParcelWatcher {
  declare type FilePath = string;
  declare type GlobPattern = string;

  export type BackendType = 
  | 'fs-events'
  | 'watchman'
  | 'inotify'
  | 'windows'
  | 'brute-force';

  export type EventType = 'create' | 'update' | 'delete';

  export interface Options {
    ignore?: (FilePath|GlobPattern)[];
    backend?: BackendType;
  }

  export type SubscribeCallback = (
    err: Error | null,
    events: Event[]
  ) => unknown;

  export interface AsyncSubscription {
    unsubscribe(): Promise<void>;
  }

  export interface Event {
    path: FilePath;
    type: EventType;
  }

  export interface Api {
    getEventsSince(
      dir: FilePath,
      snapshot: FilePath,
      opts?: Options
    ): Promise<Event[]>;
    subscribe(
      dir: FilePath,
      fn: SubscribeCallback,
      opts?: Options
    ): Promise<AsyncSubscription>;
    unsubscribe(
      dir: FilePath,
      fn: SubscribeCallback,
      opts?: Options
    ): Promise<void>;
    writeSnapshot(
      dir: FilePath,
      snapshot: FilePath,
      opts?: Options
    ): Promise<FilePath>;
  }
}
