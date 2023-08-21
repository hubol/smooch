import { Environment } from "../common/environment";

Environment.isDev = true;
process.chdir('./.test_env');

require('./cli.ts');