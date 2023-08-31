import ffmpegBinary from "@ffmpeg-installer/ffmpeg";
import Ffmpeg from "fluent-ffmpeg";
import { Path } from "../common/path";
import { Logger } from "../common/logger";
import { Now } from "../common/now";
import { printMs } from "../common/print-ms";

Ffmpeg.setFfmpegPath(ffmpegBinary.path);

export class AudioFileConverter {
    private static readonly _logger = new Logger('Ffmpeg', 'magenta');
    private static readonly _ffmpegOptions: Ffmpeg.FfmpegCommandOptions = { logger: this._logger };

    private constructor() { }

    static convert(srcFile: Path.File.t, dstFile: Path.File.t) {
        const start = Now.ms;
        this._logger.log(`${srcFile} -> ${dstFile}...`);
        return new Promise<void>((resolve, reject) => {
            Ffmpeg(this._ffmpegOptions)
                .on('end', resolve)
                .on('error', reject)
                .input(srcFile)
                .save(dstFile);
        })
        .then(() => this._logger.log(`Done after ${printMs(Now.ms - start)}: ${dstFile}`));
    }
}

