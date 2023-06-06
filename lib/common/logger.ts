import chalk from "chalk";
import { ForegroundColor } from "chalk";

export class Logger {
    constructor(readonly context: any, readonly color: typeof ForegroundColor) {
        
    }

    private get _prefix() {
        return chalk[this.color]`[${getPrintableContext(this.context)}] `;
    }

    log(message: any, ...additional: any[]) {
        this._print('log', message, additional);
    }

    error(message: any, ...additional: any[]) {
        this._print('error', message, additional);
    }

    warn(message: any, ...additional: any[]) {
        this._print('warn', message, additional);
    }

    private _print(key: 'log' | 'error' | 'warn', message: any, additional: any[]) {
        console[key](`${this._prefix}${message}`, ...additional);
    }
}

function getPrintableContext(context: any) {
    if (context instanceof Function)
        return context.name;
    return context;
}