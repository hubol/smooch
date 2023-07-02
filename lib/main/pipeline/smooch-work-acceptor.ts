import { minimatch } from "minimatch";
import { FsWatcherMessage } from "../watcher/fs-watcher-message";
import { ISmoochWorkAcceptor } from "./smooch-work-pipeline";

export class SmoochWorkAcceptor implements ISmoochWorkAcceptor {
    constructor(readonly dependencyGlobs: string[],
        readonly outputGlobs: string[]) {
        
    }

    accept(message: FsWatcherMessage) {
        if (message.isNascent)
            return true;

        for (const dependencyGlob of this.dependencyGlobs) {
            const filter = minimatch.filter(dependencyGlob.replace(/\\/g, '/'));
            if (message.events.some(x => filter(x.path)))
                return true;
        }

        for (const outputGlob of this.outputGlobs) {
            const filter = minimatch.filter(outputGlob.replace(/\\/g, '/'));
            if (message.events.some(x => x.type === 'delete' && filter(x.path)))
                return true;
        }

        return false;
    }

}