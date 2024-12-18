import { Logger } from "../../common/logger";
import { wait } from "../../common/wait";
import { createPipelinesFromSmoochConfig, readConfigFromSmoochJson } from "../main";
import { AcceptResult } from "../pipeline/smooch-work-pipeline";
import { ISmoochWorkers, SmoochWorker } from "../pipeline/smooch-worker";

const logger = new Logger("Build", "green");

export async function build() {
    const start = Date.now();
    const config = await readConfigFromSmoochJson();

    const workers: SmoochWorker[] = [];
    const workersImpl: ISmoochWorkers = {
        register(worker) {
            workers.push(worker);
        },
    };
    createPipelinesFromSmoochConfig(config, workersImpl);

    const work = [AcceptResult.Accepted.Nascent.Instance];
    for (const worker of workers) {
        worker.work(work);
    }
    await wait(() => workers.every(x => !x.isWorking));
    logger.log(`Done after ${Date.now() - start}ms`);
}
