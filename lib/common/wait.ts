export function wait(predicateFn: () => boolean) {
    return new Promise<void>(r => {
        const interval = setInterval(() => {
            if (!predicateFn())
                return;
            r();
            clearInterval(interval);
        })
    })
}