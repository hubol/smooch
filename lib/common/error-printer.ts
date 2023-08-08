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
    
        return `Constructor: ${constructor}
Name: ${name}
Message: ${message}
Properties: ${properties}
Stack: ${stack}`;
    }
}

const excludableProperties = new Set([ 'name', 'message', 'stack' ]);
