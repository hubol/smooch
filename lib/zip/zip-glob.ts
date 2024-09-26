import archiver from "archiver";
import { Fs } from "../common/fs";
import { Logger } from "../common/logger";
import { Path } from "../common/path";
import { Gwob } from "../common/gwob";
import { Now } from "../common/now";
import { printMs } from "../common/print-ms";
import chalk from "chalk";

const logger = new Logger('ZipGlob', 'yellow');

// Always add entries to the archive with a particular timestamp
// To prevent false-positive differences when using git
const date = new Date('2020-08-21T23:00:00Z');

export async function zipGlob(srcGlob: Path.Glob.t, dstFile: Path.File.t, options?: archiver.ArchiverOptions) {
    const stream = Fs.createWriteStream(dstFile);
    
    // statConcurrency: 1 supposedly results in deterministic zips!
    // https://github.com/archiverjs/node-archiver/issues/383#issuecomment-2253139948
    const archive = archiver('zip', { statConcurrency: 1, ...options });
    archive.pipe(stream);

    const root = Gwob.root(srcGlob);

    // Note: archiver does support globs
    // But it seems to be slower than using this glob library
    // It was not significant (~20ms with a source directory with 312 files on my machine),
    // but every ms counts!
    const files = await Gwob.files(srcGlob);

    const start = Now.ms;
    
    logger.log(`Zipping ${chalk.blue(srcGlob)}
=> ${chalk.green(dstFile)}...`);

    for (const file of files)
        archive.file(file, { name: file.substring(root.length), date });

    await new Promise((resolve, reject) => {
        stream.on('close', resolve);
        stream.on('error', reject);

        archive.finalize();
    });

    logger.log(`Done after ${printMs(Now.ms - start)}: ${chalk.green(dstFile)}`);
}