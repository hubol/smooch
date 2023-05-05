import { Fs } from "../lib/common/fs";
import { handleFatalError } from "../lib/common/handle-fatal-error";
import { CwdRelativePath } from "../lib/common/relative-path";
import { TestProcess } from "./test-process";

Promise.resolve()
.then(runTest)
.catch(handleFatalError);

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

async function runTest() {
    await Fs.rm(Paths.testEnv, { recursive: true, force: true });
    await Fs.mkdir(Paths.testEnv, { recursive: true });
    await Fs.copyFile(Paths.testPackageJson, envPath('package.json'));

    await new TestProcess(Commands.npm, ['i'], { cwd: Paths.testEnv }).untilExited();

    await Fs.copyFile(Paths.testSmoochJson, envPath('smooch.json'));
    await Fs.mkdir(Fs.resolve(Paths.testEnv, 'src-images'));
    await Fs.mkdir(Fs.resolve(Paths.testEnv, 'dst-images'));
    await new TestProcess(Commands.npx, ['smooch'], { cwd: Paths.testEnv }).untilExited();
}
