import chalk from "chalk";
import { ForegroundColor } from "chalk";

export class Logger {
    constructor(readonly context: any, readonly color: typeof ForegroundColor) {
        
    }

    private get _prefix() {
        return chalk[this.color]`[${getPrintableContext(this.context)}] `;
    }

    log(message: any, ...additional: any[]) {
        console.log(`${this._prefix}${message}`, ...additional);
    }

    error(message: any, ...additional: any[]) {
        console.error(`${this._prefix}${message}`, ...additional);
    }
}

function getPrintableContext(context: any) {
    if (context instanceof Function)
        return context.name;
    return context;
}