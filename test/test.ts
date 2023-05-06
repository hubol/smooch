import { handleFatalError } from "../lib/common/handle-fatal-error";
import { TestProject } from "./utils/test-project";

Promise.resolve()
.then(runTest)
.catch(handleFatalError);

async function runTest() {
    await TestProject.initialize();
    await TestProject.mkdirs('src-images', 'dst-images');
    await TestProject.writeSmoochJson({
        "textures": [{
            "folder": "src-images",
            "outFolder": "dst-images",
            "outTemplateExtension": "ts",
            "pack": {
                "maxWidth": 1024,
                "maxHeight": 1024,
            }
        }]
    });
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
