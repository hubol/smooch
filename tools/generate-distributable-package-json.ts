import { Fs } from "../lib/common/fs";
import packageJson from "../package.json";

async function main() {
    const json: Partial<typeof packageJson> = packageJson;
    delete json.devDependencies;
    delete json.scripts;

    const string = JSON.stringify(json, undefined, 2);
    const dstFile = "dist/package.json";
    Fs.writeFile(dstFile, string);
    console.log(`Wrote distributable package.json to ${dstFile}`);
}

main();
