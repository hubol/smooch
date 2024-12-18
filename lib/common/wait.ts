import { Now } from "./now";

export function wait(predicateFn: () => boolean) {
    return new Promise<void>(r => {
        const interval = setInterval(() => {
            if (!predicateFn()) {
                return;
            }
            r();
            clearInterval(interval);
        });
    });
}

export function waitHold(predicateFn: () => boolean, ms: number) {
    return new Promise<void>(r => {
        let firstTrueMs = -1;

        const interval = setInterval(() => {
            if (!predicateFn()) {
                firstTrueMs = -1;
                return;
            }
            if (firstTrueMs === -1) {
                firstTrueMs = Now.ms;
            }

            if (Now.ms - firstTrueMs < ms) {
                return;
            }

            r();
            clearInterval(interval);
        });
    });
}

export function sleep(ms: number) {
    return new Promise<void>(r => setTimeout(r, ms));
}
