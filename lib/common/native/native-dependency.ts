import chalk from "chalk";;
import { Fs } from "../fs";
import { JsonFile } from "../json-file";
import { Logger } from "../logger";
import { packageJson } from "../package-json"
import { NpmExecutable } from "../process/npm-executable";
import { ProcessWithLogger } from "../process/process-with-logger";
import { Global } from "../../main/global";
import { Boundary_FfmpegInstaller } from "./boundary/ffmpeg-installer-api";
import { Boundary_ParcelWatcher } from "./boundary/parcel-watcher-api";
import { requireModule } from "../require-module";

const defaultDependencies = {
    "@ffmpeg-installer/ffmpeg": dependency<Boundary_FfmpegInstaller.Api>("^1.1.0"),
    "@parcel/watcher": dependency<Boundary_ParcelWatcher.Api>("2.2.0"),
};

export type ModuleName = keyof Dependencies;

type Dependencies = typeof defaultDependencies;
type NativeDependencyVersions = Record<ModuleName, string>;

const defaultDependencyVersions: NativeDependencyVersions = Object.keys(defaultDependencies).reduce((obj, key) => {
    obj[key] = defaultDependencies[key];
    return obj;
}, {} as any)

function dependency<TApi>(version: string): TApi {
    return version as any;
}

function getNativePath(...paths: string[]) {
    return Fs.resolve(Global.cacheDir, 'native-deps', ...paths);
}

export class NativeDependencies {
    private constructor() { }

    static get defaultVersions(): NativeDependencyVersions {
        return { ...defaultDependencyVersions };
    }

    static async isInstalled(deps: NativeDependencyVersions) {
        logger.info(`Checking that native dependencies are installed to ${chalk.white(getNativePath())}`);

        try {
            const nativePackageJson = await JsonFile.read(getNativePath('package.json'));
            // TODO check that deps matches package.json !!
            logger.warn(`Native dependencies appear to be installed.`);
            return true;
        }
        catch (e) {
            logger.warn(`Native dependencies do not appear to be installed.`);
            return false;
        }
    }

    static async install(deps: NativeDependencyVersions) {
        const nativePackageJson = {
            name: 'smooch-native-deps',
            description: "Native dependencies for smooch--tracked separately from your package.json to avoid annoying version conflicts!",
            version: packageJson.version,
            dependencies: deps,
        }

        const nativePackageJsonText = JSON.stringify(nativePackageJson, undefined, '\t');

        await Fs.mkdir(getNativePath(), { recursive: true });
        await Fs.writeFile(getNativePath('package.json'), nativePackageJsonText);

        const cwd = getNativePath();
        await new ProcessWithLogger(NpmExecutable.npm, [ '-v' ], { cwd }).untilExited();
        await new ProcessWithLogger(NpmExecutable.npm, [ 'i' ], { cwd }).untilExited();
    }

    static require<T extends ModuleName>(module: T): Dependencies[T] {
        return requireModule(getNativePath('node_modules', module));
    }
}

const logger = new Logger(NativeDependencies, 'green');