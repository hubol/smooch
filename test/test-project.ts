import { Fs } from "../lib/common/fs";
import { CwdRelativePath } from "../lib/common/relative-path";
import { TestProcess } from "./test-process";

function siblingPath(filename: string) {
    return Fs.resolve(__filename, '../' + filename);
}

const Paths = {
    imagePng: siblingPath('env-image.png'),
    testPackageJson: siblingPath('env-package.json'),
    testSmoochJson: siblingPath('env-smooch.json'),
    testEnv: new CwdRelativePath('.test_env').absolutePath,
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
        await Fs.copyFile(Paths.testPackageJson, envPath('package.json'));
        await TestProject.spawn(Commands.npm, ['i']).untilExited();
    },
    smooch(...args: string[]) {
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
}
