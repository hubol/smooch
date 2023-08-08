import chalk from "chalk";
import { indent } from "./indent";

export class ErrorPrinter {
    private constructor() { }

    static toPrintable(error: any) {
        const constructor = error?.constructor?.name ?? '<No Constructor>';
        const name = error?.name ?? '<No Name>';
        const message = error?.message ?? '<No Message>';
        const propertiesList = Object.keys(error)
            .filter(key => !excludableProperties.has(key))
            .join(', ');
        const properties = propertiesList ? `[ ${propertiesList} ]` : `<No Additional Properties>`;
        const stack = error?.stack ?? '<No Stack>';
    
        return `${chalk.gray`Constructor: `}${constructor}
${chalk.gray`Name: `}${name}
${chalk.gray`Message: `}${indent(message, 'Message: '.length)}
${chalk.gray`Properties: `}${properties}
${chalk.gray`Stack: `}${indent(stack, 'Stack: '.length)}`;
    }
}

const excludableProperties = new Set([ 'name', 'message', 'stack' ]);
