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
        }]
    });
    const smooch = TestProject.smooch();
    await smooch.untilStdOutIncludes('Packed');
    smooch.kill();
    await smooch.untilExited();
}
