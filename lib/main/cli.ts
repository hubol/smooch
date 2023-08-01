#!/usr/bin/env node

import { handleFatalError } from "../common/handle-fatal-error";
import { JsonFile } from "../common/json-file";
import { validateOptions } from "../common/validate-options";
import { main } from "./main";
import { SmoochConfig } from "./smooch-config";

Promise.resolve()
.then(async () => {
	const configJson = await JsonFile.read('smooch.json');
	const smoochConfig = validateOptions(configJson, SmoochConfig);
	await main(smoochConfig);
})
.catch(handleFatalError);
