import { Environment } from "../lib/common/environment";

Environment.isDev = true;

const fileToRequire = process.argv[2];
if (!fileToRequire)
    console.log("Must specify a file to require!");
else
    require(fileToRequire);