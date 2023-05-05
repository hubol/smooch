import { ChildProcess, spawn } from "child_process";
import { wait } from "../lib/common/wait";
import chalk from "chalk";
import kill from "tree-kill";

export class TestProcess {
    private readonly _childProcess: ChildProcess;

    private _stdErrText = '';
    private _stdOutText = '';

    private _exited = false;
    private _exitCode: number | null = null;

    private readonly _commandTitle: string;

    constructor(...args: Parameters<typeof spawn>) {
        this._childProcess = spawn(...args);

        this._commandTitle = `[${args[0]}${args[1].length > 0 ? ' ' : ''}${args[1].join(' ')}] `;

        // This is apparently why stdout is nullable https://stackoverflow.com/a/29024376
        this._childProcess.stdout!.on('data', data => {
            this._stdOutText += data;
            this._printedStdOutIndex = this._print();
        });
        this._childProcess.stderr!.on('data', data => {
            this._stdErrText += data;
            this._printedStdErrIndex = this._print(this._stdErrText, this._printedStdErrIndex, console.error, chalk.red);
        });
        this._childProcess.on('exit', code => {
            this._exited = true;
            this._exitCode = code;
        })
    }

    private _printedStdOutIndex = -1;
    private _printedStdErrIndex = -1;

    private _print(text = this._stdOutText, index = this._printedStdOutIndex, log = console.log, color = chalk.blue) {
        let nextIndex = text.indexOf('\n', index + 1);
        while (nextIndex > index) {
            const textToLog = text.substring(index, nextIndex).replace('\n', '');
            log(color(this._commandTitle) + textToLog);
            index = nextIndex;
            nextIndex = text.indexOf('\n', index + 1);
        }

        return index;
    }

    get exitCode() {
        return this._exitCode;
    }

    async untilStdOutIncludes(...args: Parameters<string['includes']>) {
        await wait(() => !!this._stdOutText.includes(...args));
        return this;
    }

    async untilStdErrIncludes(...args: Parameters<string['includes']>) {
        await wait(() => !!this._stdErrText.includes(...args));
        return this;
    }

    async untilExited() {
        await wait(() => this._exited);
        return this;
    }

    kill() {
        kill(this._childProcess.pid!);
        return this;
    }
}