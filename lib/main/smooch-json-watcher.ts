import chalk from "chalk";
import { describeList } from "../common/describe-list";
import { Gwob } from "../common/gwob";
import { Logger } from "../common/logger";
import { Boundary_ParcelWatcher } from "../common/native/boundary/parcel-watcher-api";
import { Path } from "../common/path";
import { ParcelFsResources, ParcelSubscription } from "./watcher/parcel-fs-resources";

const logger = new Logger("SmoochJsonWatcher", "magenta");

let started = false;
let smoochJsonEventsCount = 0;

export class SmoochJsonWatcher {
    private constructor() {}

    static get eventsCount() {
        return smoochJsonEventsCount;
    }

    static clearEvents() {
        smoochJsonEventsCount = 0;
    }

    static async start() {
        if (started) {
            logger.warn(`Can't start when already started!`);
            return;
        }

        const subscription = new ParcelSubscription(
            Path.Directory.create("./"),
            { ignore: [...ParcelFsResources.sensibleIgnoreGlobs] },
        );

        const smoochJsonMatch = Gwob.match(Path.Glob.create("smooch.json"));

        const cb: Boundary_ParcelWatcher.SubscribeCallback = (err, events) => {
            if (err) {
                logger.error("Received Parcel subscription error", err);
                return;
            }

            const smoochJsonEvents = events.filter(e => smoochJsonMatch(e.path));

            if (smoochJsonEvents.length) {
                logger.log(`Got smooch.json event(s): ${chalk.white(describeList(smoochJsonEvents.map(x => x.type)))}`);
                smoochJsonEventsCount += smoochJsonEvents.length;
            }
        };

        await subscription.start(cb);

        logger.log(`Started`);
    }
}
