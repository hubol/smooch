import { ChildProcess, spawn } from "child_process";
import { wait } from "../../lib/common/wait";
import chalk from "chalk";
import kill from "tree-kill";
import { Readable } from "stream";

export class TestProcess {
    private readonly _childProcess: ChildProcess;

    private _exited = false;
    private _exitCode: number | null = null;

    readonly stdOut: TestStream;
    readonly stdErr: TestStream;

    constructor(...args: Parameters<typeof spawn>) {
        this._childProcess = spawn(...args);

        const commandTitle = `[${args[0]}${args[1].length > 0 ? ' ' : ''}${args[1].join(' ')}] `;

        // This might explain why stdout is nullable: https://stackoverflow.com/a/29024376
        this.stdOut = new TestStream(this._childProcess.stdout!, [ commandTitle, console.log, chalk.blue ]);
        this.stdErr = new TestStream(this._childProcess.stderr!, [ commandTitle, console.error, chalk.red ]);
        
        this._childProcess.on('exit', code => {
            this._exited = true;
            this._exitCode = code;
        })
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

type RedirectArgs = [ title: string, logFn: typeof console['log'], color: typeof chalk['blue'] ];

class TestStream {
    private _text = '';
    private _printedIndex = -1;
    private _checkedTextIndex = -1;
    
    constructor(private readonly _readable: Readable, private readonly _redirect: RedirectArgs) {
        this._readable.on('data', data => {
            this._text += data;
            this._tryPrint();
        });
    }

    private _log(message: string) {
        const [ title, logFn, color ] = this._redirect;
        logFn(color(title) + message);
    }

    private _tryPrint() {
        let nextIndex = this._text.indexOf('\n', this._printedIndex + 1);
        while (nextIndex > this._printedIndex) {
            const textToLog = this._text.substring(this._printedIndex, nextIndex).replace('\n', '');
            this._log(textToLog);
            this._printedIndex = nextIndex;
            nextIndex = this._text.indexOf('\n', this._printedIndex + 1);
        }
    }

    untilPrinted(search: string) {
        return wait(() => {
            const nextIndex = this._text.indexOf(search, this._checkedTextIndex + 1);
            if (nextIndex <= this._checkedTextIndex)
                return false;
            this._checkedTextIndex = nextIndex;
            return true;
        });
    }
}