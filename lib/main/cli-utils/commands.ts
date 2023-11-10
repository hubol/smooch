import chalk from "chalk";
import { Logger } from "../../common/logger";
import { Path } from "../../common/path";
import { build } from "./build";
import { copyTemplateProgram, getAvailableTemplatePrograms } from "./copy-template-program";
import { initializeSmoochConfig } from "./initialize";
import { initializeNativeDepsConfig } from "./initialize-native-deps";
import { Fs } from "../../common/fs";

const logger = new Logger('Commands', 'yellow');

const help = async () => {
    const commandMetadatas = await getCommandMetadatas();
    logger.log(`The following commands are available:
${commandMetadatas.map(({ name, args, description }) => `${chalk.yellow(name)}${args ? ` ${args}` : ''}
${description}`).join('\n\n')}`)
}

export async function getCommandMetadatas() {
    return await Promise.all(Object.entries(cliUtilsCommands)
        .map(async ([ name, { args, description } ]) => ({
            name,
            args: await args,
            description: await description,
        })));
}

function cmd(fn: (...args: string[]) => Promise<unknown>, argsOrDescription: string | Promise<string>, description?: string | Promise<string>) {
    return {
        fn,
        args: Promise.resolve(description && argsOrDescription),
        description: Promise.resolve(description ?? argsOrDescription),
    }
}

type Command = ReturnType<typeof cmd>;

const cliUtilsCommands: Record<string, Command> = {
    'init': cmd(initializeSmoochConfig,
    `Initialize a **smooch.json** configuration file.`),
    
    'copy-program': cmd((src, dst) => copyTemplateProgram(src, Path.File.create(dst)),
    '<src> <dst>',
    (async () => {
        const defaultsList = (await getAvailableTemplatePrograms())
            .map(path => Fs.parse(path).name)
            .map(name => `- ${name}`)
            .join('\n');
        return `Copy a default template JavaScript program from **src** to **dst**. Available defaults are
${defaultsList}`
    })()),

    'build': cmd(build,
    `Aggregate and transform assets according to your **smooch.json**. Probably should be used on a CI server!`),

    'init-native-deps': cmd(initializeNativeDepsConfig,
    `Produce a **smooch-native-deps.json** configuration file.
This is for a bizarre subsystem that sidesteps your **package.json**.
You probably won't need to touch this!`),

    'help': cmd(help, `List these commands!`),
}

export async function runCliUtilCommand() {
    const args = process.argv;
    const commands = Object.keys(cliUtilsCommands);
    for (const command of commands) {
        const index = args.indexOf(command);
        if (index === -1)
            continue;

        const commandArgs = args.slice(index + 1);
        await cliUtilsCommands[command].fn(...commandArgs);
        return true;
    }

    return false;
}