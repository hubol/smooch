import chalk from "chalk";
import { TestProject } from "./test-project";

export function compareText(actual: string, expected: string, options?: { defaultContext?: string }) {
    const differences = compareTextImpl(actual, expected);

    return {
        print(context = options?.defaultContext) {
            if (context) {
                if (differences.length) {
                    TestProject.log(chalk.red`Difference detected in ${context}`);
                }
                else {
                    TestProject.log(chalk.green`${context} matches expected!`);
                }
            }

            for (const difference of differences) {
                TestProject.log(chalk.red(difference));
            }
        },
    };
}

function compareTextImpl(actual: string, expected: string) {
    const differences: string[] = [];
    const actualLines = sanitizeLines(actual);
    const expectedLines = sanitizeLines(expected);

    const minLineCount = Math.min(actualLines.length, expectedLines.length);
    for (let i = 0; i < minLineCount; i++) {
        if (actualLines[i] !== expectedLines[i]) {
            differences.push(`Difference detected on line ${i + 1}`);
        }
    }

    if (actualLines.length !== expectedLines.length) {
        differences.push(`Text differs in number of lines!`);
    }

    return differences;
}

function sanitizeLines(src: string) {
    return src.trim().split("\n").map(str => str.trim());
}
