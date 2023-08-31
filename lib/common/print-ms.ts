export function printMs(ms: number) {
    return ms < 1 ? '<1ms' : (Math.round(ms) + 'ms');
}
