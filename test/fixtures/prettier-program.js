module.exports = function (_, { format }) {
    const source = `// Prettier

const aaaaaa = {
    hello: "b",
    "c": 'd'
}`;

    return format(source, { parser: 'typescript' });
}