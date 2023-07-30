const isWindows = /^win/.test(process.platform);

export const TestCommands = {
    npm: isWindows ? 'npm.cmd' : 'npm',
    npx: isWindows ? 'npx.cmd' : 'npx',
}