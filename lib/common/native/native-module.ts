import { NativeDependencies } from "./native-dependency";

export const Native = {
    FfmpegInstaller: NativeDependencies.require("@ffmpeg-installer/ffmpeg"),
    ParcelWatcher: NativeDependencies.require("@parcel/watcher"),
}