import { countLines } from "../lib/common/count-lines";
import { Fs } from "../lib/common/fs";

async function main() {
    const regex = /<!-- npm skip -->[\r\n\w\W]*<!-- npm skip end -->/gm;
    const readmeMd = await Fs.readFile('README.md', 'utf8');
    const transformedReadmeMd = readmeMd.replace(regex, '').trim();

    console.log(`README.md lines ${countLines(readmeMd)} -> ${countLines(transformedReadmeMd)}`);
    await Fs.writeFile('dist/README.md', transformedReadmeMd);
}

main();