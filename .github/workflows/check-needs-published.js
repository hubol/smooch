const versionExists = require('version-exists');
const packageJson = require('./package.json');
const packageLockJson = require('./package-lock.json');

async function main() {
    console.log(`Got package.json version=${packageJson.version} and package-lock.json version=${packageLockJson.version}`);
    if (packageJson.version !== packageLockJson.version)
        throw new Error(`package.json version and package-lock.json version do not match!`);

    const { version } = packageJson;

    const isThisVersionPublished = await versionExists('@hubol/smooch', version);

    if (isThisVersionPublished)
        throw new Error(`Version ${version} is already published!`);
}

main();