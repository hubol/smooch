import { handleFatalError } from "../lib/common/handle-fatal-error";
import { TestProject } from "./utils/test-project";

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
    smooch.kill();
    await smooch.untilExited();
}
