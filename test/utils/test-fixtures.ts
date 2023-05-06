import { Fs } from "../../lib/common/fs";

function fixturePath(filename: string) {
    return Fs.resolve(__filename, '../../fixtures/' + filename);
}

export const TestFixtures = {
    image256Png: fixturePath('image256.png'),
    packageJson: fixturePath('package.json'),
}