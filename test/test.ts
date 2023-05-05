import { Fs } from "../lib/common/fs";
import { handleFatalError } from "../lib/common/handle-fatal-error";
import { TestProject } from "./test-project";

Promise.resolve()
.then(runTest)
.catch(handleFatalError);

function siblingPath(filename: string) {
    return Fs.resolve(__filename, '../' + filename);
}

const Paths = {
    imagePng: siblingPath('env-image.png'),
}

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
    await TestProject.smooch().untilExited();
}
