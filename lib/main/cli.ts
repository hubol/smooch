import { handleFatalError } from "../common/handle-fatal-error";
import { JsonFile } from "../common/json-file";
import { validateOptions } from "../common/validate-options";
import { MainConfig, main } from "./main";

Promise.resolve()
.then(async () => {
	const configJson = await JsonFile.read('smooch.json');
	const mainConfig = validateOptions(configJson, MainConfig);
	await main(mainConfig);
})
.catch(handleFatalError);
