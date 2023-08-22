import { FsWatcherMessage } from "../watcher/fs-watcher-message";
import { AcceptResult, ISmoochWorkAcceptor } from "./smooch-work-pipeline";
import { Gwob } from "../../common/gwob";
import ParcelWatcher from "@parcel/watcher";
import { Path } from "../../common/path";

export class SmoochWorkAcceptor implements ISmoochWorkAcceptor {
    constructor(
        readonly assetGlobs: Path.Glob.t[],
        readonly dependencyGlobs: Path.Glob.t[],
        readonly outputGlobs: Path.Glob.t[],) {
    }

    private readonly _workingAssetMatches: ParcelWatcher.Event[] = [];
    private readonly _workingDependencyMatches: ParcelWatcher.Event[] = [];
    private readonly _workingOutputMatches: ParcelWatcher.Event[] = [];

    accept(message: FsWatcherMessage) {
        if (message.isNascent)
            return AcceptResult.Accepted.Nascent.Instance;

        this._workingAssetMatches.length = 0;
        this._workingDependencyMatches.length = 0;
        this._workingOutputMatches.length = 0;

        for (const assetGlob of this.assetGlobs) {
            const match = Gwob.match(assetGlob);
            for (const event of message.events) {
                if (match(event.path))
                    this._workingAssetMatches.push(event);
            }
        }

        for (const dependencyGlob of this.dependencyGlobs) {
            const match = Gwob.match(dependencyGlob);
            for (const event of message.events) {
                if (match(event.path))
                    this._workingDependencyMatches.push(event);
            }
        }

        for (const outputGlob of this.outputGlobs) {
            const match = Gwob.match(outputGlob);
            for (const event of message.events) {
                if (event.type === 'delete' && match(event.path))
                    this._workingOutputMatches.push(event);
            }
        }

        if (this._workingAssetMatches.length || this._workingDependencyMatches.length || this._workingOutputMatches.length)
            return {
                type: 'AcceptedWithMatches' as const,
                assetMatches: [ ...this._workingAssetMatches ],
                dependencyMatches: [ ...this._workingDependencyMatches ],
                outputMatches: [ ...this._workingOutputMatches ],
                sourceMessage: message,
            };

        return AcceptResult.Rejected.Instance;
    }

}
