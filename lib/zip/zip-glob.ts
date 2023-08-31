import archiver from "archiver";
import { Fs } from "../common/fs";
import { Logger } from "../common/logger";
import { Path } from "../common/path";
import { Gwob } from "../common/gwob";
import { Now } from "../common/now";
import { printMs } from "../common/print-ms";

const logger = new Logger('ZipGlob', 'yellow');

export async function zipGlob(srcGlob: Path.Glob.t, dstFile: Path.File.t, options?: archiver.ArchiverOptions) {
    const stream = Fs.createWriteStream(dstFile);
    const archive = archiver('zip', options);
    archive.pipe(stream);

    const root = Gwob.root(srcGlob);

    // Note: archiver does support globs
    // But it seems to be slower than using this glob library
    // It was not significant (~20ms with a source directory with 312 files on my machine),
    // but every ms counts!
    const files = await Gwob.files(srcGlob);

    const start = Now.ms;
    
    logger.log(`Zipping ${srcGlob} to ${dstFile}...`);

    for (const file of files)
        archive.file(file, { name: file.substring(root.length) });

    await new Promise((resolve, reject) => {
        stream.on('close', resolve);
        stream.on('error', reject);

        archive.finalize();
    });

    logger.log(`Done after ${printMs(Now.ms - start)}: ${dstFile}`);
}