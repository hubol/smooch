import { wait } from "../../common/wait";
import { createPipelinesFromSmoochConfig, readConfigFromSmoochJson } from "../main";
import { AcceptResult } from "../pipeline/smooch-work-pipeline";
import { ISmoochWorkers, SmoochWorker } from "../pipeline/smooch-worker";
import { SmoochConfigSingleton } from "../smooch-config-singleton";

export async function build() {
    const config = await readConfigFromSmoochJson();
    SmoochConfigSingleton.set(config);
    
    const workers: SmoochWorker[] = [];
    const workersImpl: ISmoochWorkers = {
        register(worker) {
            workers.push(worker);
        },
    };
    createPipelinesFromSmoochConfig(config, workersImpl);
    
    const work = [ AcceptResult.Accepted.Nascent.Instance ];
    for (const worker of workers)
        worker.work(work);
    await wait(() => workers.every(x => !x.isWorking));
}