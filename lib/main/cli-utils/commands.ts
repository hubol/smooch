import { Path } from "../../common/path";
import { build } from "./build";
import { copyTemplateProgram } from "./copy-template-program";
import { initializeSmoochConfig } from "./initialize";

const cliUtilsCommands: Record<string, (...args: string[]) => Promise<unknown>> = {
    'copy-program': (src, dst) => copyTemplateProgram(src, Path.File.create(dst)),
    'init': initializeSmoochConfig,
    'build': build,
}

export async function runCliUtilCommand() {
    const args = process.argv;
    const commands = Object.keys(cliUtilsCommands);
    for (const command of commands) {
        const index = args.indexOf(command);
        if (index === -1)
            continue;

        const commandArgs = args.slice(index + 1);
        await cliUtilsCommands[command](...commandArgs);
        return true;
    }

    return false;
}