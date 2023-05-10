export function countLines(string: string) {
    return (string.match(/\n/g) || '').length + 1
}