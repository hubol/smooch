import { ChildProcess, spawn } from "child_process";
import { wait } from "../wait";
import chalk from "chalk";
import kill from "tree-kill";
import { Readable } from "stream";
import { Logger } from "../logger";

interface ProcessWithLoggerOptions {
    cwd?: string;
    shell?: boolean;
}

export class ProcessWithLogger {
    private readonly _childProcess: ChildProcess;

    private _exited = false;
    private _exitCode: number | null = null;

    readonly stdOut: TestStream;
    readonly stdErr: TestStream;

    constructor(executablePath: string, command: string[] = [], options: ProcessWithLoggerOptions = {}) {
        // NodeJS was patched to prevent executing .cmd executables on Windows without shell: true
        // https://nodejs.org/en/blog/vulnerability/april-2024-security-releases-2
        // Other people doing stupid shit like me were affected
        // https://github.com/nodejs/node/issues/52554#issuecomment-2060024574
        // I do not understand the consequences of shell: true :-/
        if (executablePath.endsWith(".cmd")) {
            options.shell = true;
        }

        this._childProcess = spawn(executablePath, command, options);

        const commandTitle = `${executablePath}${command.length > 0 ? " " : ""}${command.join(" ")}`;

        // This might explain why stdout is nullable: https://stackoverflow.com/a/29024376
        const logger = new Logger(commandTitle, "blue");
        this.stdOut = new TestStream(this._childProcess.stdout!, { logger, type: "log" });
        this.stdErr = new TestStream(this._childProcess.stderr!, { logger, type: "error" });

        this._childProcess.on("exit", code => {
            if (code != 0) {
                logger.warn(chalk.red("Exited with non-zero code: ") + chalk.white(code));
            }
            this._exited = true;
            this._exitCode = code;
        });
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

type RedirectArgs = { logger: Logger; type: "log" | "error" };

class TestStream {
    private static _logger = new Logger(TestStream, "green");

    private _text = "";
    private _printedIndex = -1;
    private _checkedTextIndex = -1;

    constructor(private readonly _readable: Readable, private readonly _redirect: RedirectArgs) {
        this._readable.on("data", data => {
            this._text += data;
            this._tryPrint();
        });
    }

    private _log(message: string) {
        const { logger, type } = this._redirect;
        const color = type === "error" ? chalk.red : chalk.white;
        logger[type](color(message));
    }

    private _tryPrint() {
        let nextIndex = this._text.indexOf("\n", this._printedIndex + 1);
        while (nextIndex > this._printedIndex) {
            const textToLog = this._text.substring(this._printedIndex, nextIndex).replace("\n", "");
            this._log(textToLog);
            this._printedIndex = nextIndex;
            nextIndex = this._text.indexOf("\n", this._printedIndex + 1);
        }
    }

    untilPrinted(search: string) {
        return wait(() => {
            const nextIndex = this._text.indexOf(search, this._checkedTextIndex + 1);
            if (nextIndex <= this._checkedTextIndex) {
                return false;
            }
            TestStream._logger.log(chalk.bgGreen`PASSED` + " " + search);
            this._checkedTextIndex = nextIndex;
            return true;
        });
    }
}
