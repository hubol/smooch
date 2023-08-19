import { FsWatcherMessage } from "../watcher/fs-watcher-message";
import { ISmoochWorkAcceptor } from "./smooch-work-pipeline";
import { Fs } from "../../common/fs";
import { globMatch } from "../../common/glob-match";

export class SmoochWorkAcceptor implements ISmoochWorkAcceptor {
    readonly dependencyGlobs: string[];

    constructor(dependencyGlobs: string[],
        readonly outputGlobs: string[],
        dependsOnConfig = true) {
        const configGlobs = dependsOnConfig ? [ Fs.resolve('smooch.json') ] : [];
        this.dependencyGlobs = [ ...dependencyGlobs, ...configGlobs ];
    }

    accept(message: FsWatcherMessage) {
        if (message.isNascent)
            return true;

        for (const dependencyGlob of this.dependencyGlobs) {
            const match = globMatch(dependencyGlob);
            if (message.events.some(x => match(x.path)))
                return true;
        }

        for (const outputGlob of this.outputGlobs) {
            const match = globMatch(outputGlob);
            if (message.events.some(x => x.type === 'delete' && match(x.path)))
                return true;
        }

        return false;
    }

}