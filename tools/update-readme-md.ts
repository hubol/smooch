import { countLines } from "../lib/common/count-lines";
import { Fs } from "../lib/common/fs";
import { getCommandMetadatas } from "../lib/main/cli-utils/commands";

async function main() {
    const readmeFile = '../README.md';

    const regex = /<!-- smooch commands -->[\r\n\w\W]*<!-- smooch commands end -->/gm;
    const readmeMd = await Fs.readFile(readmeFile, 'utf8');
    const transformedReadmeMd = readmeMd.replace(regex,
`<!-- smooch commands -->
${await createCommandsMarkdown()}
<!-- smooch commands end -->`).trim();

    console.log(`README.md lines ${countLines(readmeMd)} -> ${countLines(transformedReadmeMd)}`);
    await Fs.writeFile(readmeFile, transformedReadmeMd);
}

async function createCommandsMarkdown() {
    const metadatas = await getCommandMetadatas();
    metadatas.unshift({
        name: '',
        description: `Start in watch mode. Aggregates and transforms assets as file changes are detected.
Probably should be used while developing!`,
        args: undefined,
    });

    return metadatas.map(({ name, args, description }) =>
`\`${`smooch ${name} ${args ? args : ''}`.trim()}\`

${description}`)
    .join('\n\n');
}

main();