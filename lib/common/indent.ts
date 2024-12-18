const whitespaceCache: Record<number, string> = {};

export function indent(string: string, spaces: number) {
    if (!whitespaceCache[spaces]) {
        whitespaceCache[spaces] = "\n" + new Array(spaces + 1).join(" ");
    }
    return string.replace(/\n/g, whitespaceCache[spaces]);
}
