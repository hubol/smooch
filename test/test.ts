import { handleFatalError } from "../lib/common/handle-fatal-error";
import { Logger } from "../lib/common/logger";
import { TestInlineConfig, TestProject } from "./utils/test-project";

Logger.globalOptions.maxContextLength = 14;

Promise.resolve()
.then(runTest)
.catch(handleFatalError);

async function runTest() {
    await TestProject.initialize();
    await TestProject.mkdirs('src-images', 'dst-images', 'src-jsons', 'dst-jsons', 'src-audio');

    for (const templateProgram of ['audio-convert', 'json-aggregate', 'texture-pack'])
        await TestProject.smooch('copy-program', templateProgram).untilExited();

    for (let i = 0; i < 3; i++)
        await TestProject.fixture('fixtureJson', `src-jsons/json${i}.json`);

    await TestProject.smooch('init').untilExited();

    const smooch = TestProject.smooch();

    await smooch.stdOut.untilPrinted('Nascent');

    const config: TestInlineConfig = {
        "textures": [{
            "glob": "src-images/**/*.png",
            atlas: {
                directory: "dst-images",
            },
            template: {
                program: 'texture-pack.js',
                out: "dst-images/atlas.ts",
            },
            "pack": {
                "maxWidth": 1024,
                "maxHeight": 1024,
            }
        }],
        "jsonFiles": [{
            glob: "src-jsons/**/*.json",
            template: {
                program: 'json-aggregate.js',
                out: 'dst-jsons/result.ts',
            }
        }]
    };
    
    await TestProject.writeSmoochJson(config);
    await smooch.stdOut.untilPrinted('restart');

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

    config.textures![0].pack!.maxHeight = 4096;
    config.textures![0].pack!.maxWidth = 4096;
    await TestProject.writeSmoochJson(config);

    await smooch2.stdOut.untilPrinted('Restarting application...');
    await smooch2.stdOut.untilPrinted('Created 1 image buffer');
    await smooch2.stdOut.untilPrinted('Saved state.');

    await TestProject.fixture('soundWav', 'src-audio/sound0.wav');

    config.audioFiles = [{
        glob: "src-audio/**/*.wav",
        convert: [
            {
                directory: 'dst-audio/ogg',
                format: 'OGG ',
            },
            {
                directory: 'dst-audio/mp3',
                format: ' Mp3  ',
            }
        ],
        template: {
            program: 'audio-convert.js',
            out: 'dst-audio/sound.ts'
        }
    }];

    await TestProject.writeSmoochJson(config);

    await smooch2.stdOut.untilPrinted('smooch.json change detected');
    await smooch2.stdOut.untilPrinted('AudioConverter Done converting 1 file');
    await smooch2.stdOut.untilPrinted('Saved state.');

    TestProject.check('dst-audio/sound.ts', `// This file is generated

export const Sfx = {
   "Sound0": { ogg: "sound0.ogg", mp3: "sound0.mp3", }
}`).print();

    delete config.textures;
    delete config.jsonFiles;
    config.audioFiles = [{
        glob: "src-audio/**/*.wav",
        convert: [
            {
                zip: 'dst-audio/both.zip',
                format: 'OGG ',
            },
            {
                zip: 'dst-audio/both.zip',
                format: ' Mp3  ',
            },
            {
                zip: 'dst-audio/ogg.zip',
                format: 'OGG ',
            },
            {
                zip: 'dst-audio/mp3.zip',
                format: ' Mp3  ',
            }
        ],
        template: {
            program: 'audio-convert.js',
            out: 'dst-audio/sound.ts'
        }
    }];

    await TestProject.writeSmoochJson(config);

    await smooch2.stdOut.untilPrinted('smooch.json change detected');
    await smooch2.stdOut.untilPrinted('AudioConverter Done converting 1 file');
    await smooch2.stdOut.untilPrinted('=> dst-audio/mp3.zip...');
    await smooch2.stdOut.untilPrinted('Saved state.');

    await TestProject.fixture('dummyProgram', 'audio-convert.js');
    await smooch2.stdOut.untilPrinted('Saved state.');
    TestProject.check('dst-audio/sound.ts', `// Dummy`).print();

    smooch2.kill();
    await smooch2.untilExited();

    delete config.audioFiles;
    await TestProject.writeSmoochJson(config);

    const smooch3 = TestProject.smooch();
    await smooch3.stdOut.untilPrinted('Creating Nascent Catch-up message');
    smooch3.kill();
    await smooch3.untilExited();
}
