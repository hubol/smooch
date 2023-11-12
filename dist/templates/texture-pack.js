/**
@param {import("@hubol/smooch/template-api").TemplateContext.TexturePack} context;
@param {import("@hubol/smooch/template-api").Utils} utils;
*/
module.exports = function ({ atlases, textures }, { pascal, noext }) {
    return `
// This file is generated

export const Atlases = [ ${atlases.map(x => `"${x.fileName}"`).join(', ')} ];

export const Txs = {
${textures.map(tx =>
`   "${pascal(noext(tx.fileName))}": { atlas: "${tx.atlasFileName}", x: ${tx.x}, y: ${tx.y}, width: ${tx.width}, height: ${tx.height} }`).join(`,
`)}
}`;
}