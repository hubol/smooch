import Ffmpeg from "fluent-ffmpeg";
import { Path } from "../common/path";
import { Logger } from "../common/logger";
import { Now } from "../common/now";
import { printMs } from "../common/print-ms";
import chalk from "chalk";
import { Native } from "../common/native/native-module";

const ffmpegBinary = Native.FfmpegInstaller;

Ffmpeg.setFfmpegPath(ffmpegBinary.path);

const logger = new Logger("Ffmpeg", "magenta");
logger.info(`Set Ffmpeg path to ${chalk.white(ffmpegBinary.path)}`);

export class AudioFileConverter {
    private static readonly _ffmpegOptions: Ffmpeg.FfmpegCommandOptions = { logger };

    private constructor() {}

    static convert(srcFile: Path.File.t, dstFile: Path.File.t) {
        const start = Now.ms;
        logger.log(`Converting ${chalk.blue(srcFile)}
=> ${chalk.green(dstFile)}...`);
        return new Promise<void>((resolve, reject) => {
            Ffmpeg(this._ffmpegOptions)
                .on("end", resolve)
                .on("error", reject)
                .input(srcFile)
                .addOption("-bitexact")
                .save(dstFile);
        })
            .then(() => logger.log(`Done after ${printMs(Now.ms - start)}: ${chalk.green(dstFile)}`));
    }
}
