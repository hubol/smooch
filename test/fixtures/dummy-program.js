module.exports = function (_, utils) {
    const printableObject = Object.entries(utils).reduce((obj, [key, value]) => {
        obj[key] = typeof value;
        return obj;
    }, {});
    return `// Dummy
${JSON.stringify(printableObject, undefined, 2)}`;
};
