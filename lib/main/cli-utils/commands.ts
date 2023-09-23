import chalk from "chalk";
import { Logger } from "../../common/logger";
import { Path } from "../../common/path";
import { build } from "./build";
import { copyTemplateProgram } from "./copy-template-program";
import { initializeSmoochConfig } from "./initialize";
import { initializeNativeDepsConfig } from "./initialize-native-deps";

const logger = new Logger('Commands', 'yellow');

const help = () => {
    logger.log(`The following commands are available:
${Object.keys(cliUtilsCommands).map(x => `- ${chalk.yellow(x)}`).join('\n')}`)
    return Promise.resolve();
}

const cliUtilsCommands: Record<string, (...args: string[]) => Promise<unknown>> = {
    'copy-program': (src, dst) => copyTemplateProgram(src, Path.File.create(dst)),
    'init': initializeSmoochConfig,
    'build': build,
    'init-native-deps': initializeNativeDepsConfig,
    'help': help,
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