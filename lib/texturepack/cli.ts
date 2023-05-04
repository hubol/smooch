import { handleFatalError } from "../common/handle-fatal-error";
import { inline } from "../common/inline";
import { parseOptions } from "../common/parse-options";
import { validateOptions } from "../common/validate-options";
import { PackerOptions } from "./src/options";
import { texturePack } from "./src/texture-pack";

const args = process.argv.slice(2);

if (args.length < 1) {
	console.error(
		inline`Usage: texturepack folder 
      [--fileName=fileName] 
      [--outFolder=outFolder]
	  [--outTemplate=template.handlebars]
	  [--outTemplateExtension=js]
	  [--pack.maxWidth=1024]
	  [--pack.maxHeight=1024]`
	);
	process.exit(1);
}

const [folder, ...options] = args;
const parsedOptions = parseOptions(options);

Promise.resolve()
.then(() => texturePack(validateOptions({
	...parsedOptions,
	folder
}, PackerOptions)) )
.catch(handleFatalError);
