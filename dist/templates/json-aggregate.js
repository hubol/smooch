/**
@param {import("smooch/template-api").TemplateContext.JsonAggregate} context;
@param {import("smooch/template-api").Utils} utils;
*/
module.exports = function ({ files }, { pascal, noext, oneline, json }) {
    return `// This file is generated.

export const JsonFiles = {
${ files.map(file => `  "${ pascal(noext(file.fileName)) }": ${ oneline(json(file.json)) }`).join(`,
`) }
}`;
}