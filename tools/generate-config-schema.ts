import * as TJS from "typescript-json-schema";
import { Force } from "../lib/common/force";
import { wait } from "../lib/common/wait";
import { Fs } from "../lib/common/fs";
import { countLines } from "../lib/common/count-lines";

async function generateSmoochConfigSchema() {
    const rawJsonSchema = await interceptOneStdOutWrite(() => TJS.exec("tsconfig.json", "SmoochConfigType"));
    console.log(`Got raw schema with ${countLines(rawJsonSchema)} lines.`);

    const schemaObject = JSON.parse(rawJsonSchema);
    for (const key of ["Path.Directory.t", "Path.File.t", "Path.Glob.t"]) {
        schemaObject.definitions[key] = { type: "string" };
    }

    const transformedJsonSchema = JSON.stringify(schemaObject, undefined, 2);
    console.log(`Got transformed schema with ${countLines(transformedJsonSchema)} lines.`);

    const dstFile = "dist/schema.json";
    await Fs.writeFile(dstFile, transformedJsonSchema);
    console.log(`Wrote schema to ${dstFile}.`);
}

generateSmoochConfigSchema();

async function interceptOneStdOutWrite(work: () => unknown) {
    const oldStdOutWrite = process.stdout.write;

    let interceptedText = Force<string>();
    function steal(text: string) {
        interceptedText = text;
    }

    // @ts-ignore
    process.stdout.write = steal;

    work();

    await wait(() => !!interceptedText);

    process.stdout.write = oldStdOutWrite;

    return interceptedText;
}
