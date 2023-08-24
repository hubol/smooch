import chalk from "chalk";

export function describeList(items: unknown[]) {
    if (items.length === 0)
        return chalk.gray`<None>`;

    return items.join(', ');
}