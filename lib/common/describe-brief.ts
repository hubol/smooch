import chalk from "chalk";

const D = {
    undefined: chalk.gray`Undefined`,
    null: chalk.gray`Null`,
};

export function describeBrief(x: any) {
    if (x === null) {
        return D.null;
    }
    if (x === undefined) {
        return D.undefined;
    }
    if (typeof x === "string" || typeof x === "number") {
        return JSON.stringify(x);
    }
    if (typeof x === "function") {
        return `Function ${x.name}(${getParameters(x)})`;
    }
    if (Array.isArray(x)) {
        return describeArray(x);
    }
    if (typeof x === "object") {
        return describeObject(x);
    }
}

function describeObject(x: object) {
    const entries = Object.keys(x)
        .map(key => [describeKey(key), describeBrief(x[key])])
        .map(pair => pair.join(": "))
        .join(", ");

    return `{ ${entries}${entries.length ? " " : ""}}`;
}

function describeArray(x: any[]) {
    if (!x.length) {
        return chalk.gray`<Empty>`;
    }
    return `${getArrayType(x)}[${x.length}]`;
}

function getArrayType(array: any[]) {
    for (const x of array) {
        if (x === null || x === undefined) {
            continue;
        }
        if (typeof x === "string") {
            return "String";
        }
        if (typeof x === "number") {
            return "Number";
        }
        if (typeof x === "function") {
            return "Function";
        }
        if (Array.isArray(x)) {
            return "2dArray";
        }
        if (typeof x === "object") {
            return "Object";
        }
    }
    if (array[0] === null) {
        return D.null;
    }
    if (array[0] === undefined) {
        return chalk.gray`Undefined`;
    }
}

const parameterNames = ["x", "y", "z"];

function getParameters(fn: Function) {
    const parameters = parameterNames.slice(0, fn.length);
    if (parameters.length < fn.length) {
        parameters.push(`...${fn.length - parameters.length} more`);
    }
    return parameters.join(", ");
}

function describeKey(key: string) {
    try {
        eval(`{ ${key}: 0 }`);
        return key;
    }
    catch (e) {
        return JSON.stringify(key);
    }
}
