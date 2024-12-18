#!/usr/bin/env node

import { handleFatalError } from "../common/handle-fatal-error";
import { NativeDependenciesChecker } from "./native-dependencies-checker";

Promise.resolve()
    .then(() => NativeDependenciesChecker.check())
    .then(() => require("./main").main())
    .catch(handleFatalError);
