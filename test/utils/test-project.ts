import { Fs } from "../../lib/common/fs";
import { TestFixtures } from "./test-fixtures";
import { ProcessWithLogger } from "../../lib/common/process/process-with-logger";
import { TextFile } from "../../lib/common/text-file";
import { compareText } from "./compare-text";
import { Logger } from "../../lib/common/logger";
import { Path } from "../../lib/common/path";
import { NpmExecutable } from "../../lib/common/process/npm-executable";
import { SmoochConfigType } from "../../lib/main/smooch-config";

const Paths = {
    testEnv: Path.Directory.create('./.test_env'),
}

function envPath(filename: string) {
    return Fs.resolve(Paths.testEnv, filename);
}

export const TestProject = {
    async initialize() {
        await TestProject.cleanUp();
        await Fs.mkdir(Paths.testEnv, { recursive: true });

        await TestProject.fixture('packageJson', 'package.json');
        await TestProject.spawn(NpmExecutable.npm, ['i']).untilExited();
    },
    smooch(...args: string[]) {
        TestProject.log(`Starting smooch...`);
        return TestProject.spawn(NpmExecutable.npx, ['smooch', ...args]);
    },
    writeSmoochJson(config: any) {
        const configWithDefaults = { core: { cacheFolder: ".smooch" }, "$schema": "./node_modules/smooch/schema.json", ...config };
        return Fs.writeFile(envPath('smooch.json'), JSON.stringify(configWithDefaults, undefined, 2));
    },
    cleanUp() {
        return Fs.rm(Paths.testEnv, { recursive: true, force: true });
    },
    spawn(command: string, args: string[], options: ConstructorParameters<typeof ProcessWithLogger>[2] = {}) {
        return new ProcessWithLogger(command, args, { cwd: Paths.testEnv, ...options });
    },
    mkdir(path: string) {
        return Fs.mkdir(envPath(path));
    },
    mkdirs(...paths: string[]) {
        return Promise.all(paths.map(path => TestProject.mkdir(path)));
    },
    fixture(fixtureKey: keyof typeof TestFixtures, dstFileName: string) {
        const src = TestFixtures[fixtureKey];
        const dst = envPath(dstFileName);
        TestProject.log(`Copy fixture ${src} -> ${dst}`);
        return Fs.copyFile(src, dst);
    },
    check(envFileName: string, expected: string) {
        const actual = TextFile.readSync(envPath(envFileName));
        return compareText(actual, expected, { defaultContext: envFileName });
    },
    log(message: string) {
        logger.log(message);
    }
}

const logger = new Logger('test', 'green');

type PathType = Path.Directory.t | Path.File.t | Path.Glob.t

type LoosenPathTypes<T> = {
    [k in keyof T]:
        T[k] extends PathType
        ? string
        : T[k] extends PathType | undefined
        ? string | undefined
        : T[k] extends Record<string, unknown>
        ? Partial<LoosenPathTypes<T[k]>>
        : T[k] extends Array<infer ArrayType>
        ? Array<Partial<LoosenPathTypes<ArrayType>>>
        : T[k];
};

export type TestInlineConfig = Partial<LoosenPathTypes<SmoochConfigType>>;