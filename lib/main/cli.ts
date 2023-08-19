#!/usr/bin/env node

import { handleFatalError } from "../common/handle-fatal-error";
import { main } from "./main";

Promise.resolve()
.then(main)
.catch(handleFatalError);
