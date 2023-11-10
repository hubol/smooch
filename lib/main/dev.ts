import { Environment } from "../common/environment";

Environment.isDev = true;
process.chdir('./.test_env');

const fileToRequire = process.argv[2] ?? './cli.ts';

require(fileToRequire);