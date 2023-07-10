import { handleFatalError } from "../lib/common/handle-fatal-error";
import { Logger } from "../lib/common/logger";
import { TestProject } from "./utils/test-project";

Logger.globalOptions.maxContextLength = 14;

Promise.resolve()
.then(runTest)
.catch(handleFatalError);

async function runTest() {
    await TestProject.initialize();
    await TestProject.mkdirs('src-images', 'dst-images', 'src-jsons', 'dst-jsons');
    await TestProject.writeSmoochJson({
        "textures": [{
            "folder": "src-images",
            "outFolder": "dst-images",
            "outTemplateExtension": "ts",
            "pack": {
                "maxWidth": 1024,
                "maxHeight": 1024,
            }
        }],
        "jsonFiles": [{
            "folder": "src-jsons",
            "outFile": "dst-jsons/result.ts",
        }]
    });
    for (let i = 0; i < 3; i++)
        await TestProject.fixture('fixtureJson', `src-jsons/json${i}.json`);
    const smooch = TestProject.smooch();
    await smooch.stdOut.untilPrinted('Packed');
    await TestProject.fixture('image256Png', 'src-images/image0.png');
    await smooch.stdOut.untilPrinted('Packed');
    for (let i = 1; i < 10; i++) {
        await TestProject.fixture('image256Png', `src-images/image${i}.png`);
    }
    await smooch.stdOut.untilPrinted('Packed');
    await smooch.stdOut.untilPrinted('Saved state.');
    smooch.kill();
    await smooch.untilExited();
    
    TestProject.check('dst-jsons/result.ts', `// This file is generated.

export const JsonFiles = {
  "Json2": { "name": "Hubol", "level": 100 },
  "Json1": { "name": "Hubol", "level": 100 },
  "Json0": { "name": "Hubol", "level": 100 }
}`).print();

    await TestProject.fixture('image256Png', `src-images/image11.png`);

    const smooch2 = TestProject.smooch();
    await smooch2.stdOut.untilPrinted('Saved state.');
    smooch2.kill();
    await smooch2.untilExited();
}
