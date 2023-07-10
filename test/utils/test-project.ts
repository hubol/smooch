import { Fs } from "../../lib/common/fs";
import { TestFixtures } from "./test-fixtures";
import { TestProcess } from "./test-process";
import { TextFile } from "../../lib/common/text-file";
import { compareText } from "./compare-text";
import { Logger } from "../../lib/common/logger";
import { Path } from "../../lib/common/path";

const Paths = {
    testEnv: Path.Directory.create('./.test_env'),
}

function envPath(filename: string) {
    return Fs.resolve(Paths.testEnv, filename);
}

const isWindows = /^win/.test(process.platform);

const Commands = {
    npm: isWindows ? 'npm.cmd' : 'npm',
    npx: isWindows ? 'npx.cmd' : 'npx',
}

export const TestProject = {
    async initialize() {
        await TestProject.cleanUp();
        await Fs.mkdir(Paths.testEnv, { recursive: true });
        await TestProject.fixture('packageJson', 'package.json');
        await TestProject.spawn(Commands.npm, ['i']).untilExited();
    },
    smooch(...args: string[]) {
        TestProject.log(`Starting smooch...`);
        return TestProject.spawn(Commands.npx, ['smooch', ...args]);
    },
    writeSmoochJson(config: any) {
        const configWithDefaults = { core: { cacheFolder: ".smooch" }, ...config };
        return Fs.writeFile(envPath('smooch.json'), JSON.stringify(configWithDefaults, undefined, 2));
    },
    cleanUp() {
        return Fs.rm(Paths.testEnv, { recursive: true, force: true });
    },
    spawn(command: string, args: string[], options: ConstructorParameters<typeof TestProcess>[2] = {}) {
        return new TestProcess(command, args, { cwd: Paths.testEnv, ...options });
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
