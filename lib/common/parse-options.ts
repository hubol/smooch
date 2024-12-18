export const parseOptions = (options: string[]) =>
    options
        .filter((opt) => opt.startsWith("--"))
        .reduce((res, optString) => {
            const [optName, optValue] = optString.slice(2).split("=");

            const value = parseOptionValue(optValue);

            const path = optName.split(".");
            let node = res;
            for (let i = 0; i < path.length; i++) {
                if (i === path.length - 1) {
                    node[path[i]] = value;
                }
                else {
                    node = node[path[i]] ?? (node[path[i]] = {});
                }
            }

            return res;
        }, {});

function parseOptionValue(optValue) {
    if (!isNaN(Number(optValue))) {
        return Number(optValue);
    }
    return optValue ? (optValue === "false" ? false : optValue) : true;
}
