module.exports = function ({ files }, { pascal, noext }) {
    return `
// This file is generated

export const Sfx = {
${files.map(file =>
`   "${pascal(noext(file.path))}": { ogg: "${file.convertedPaths.ogg}", mp3: "${file.convertedPaths.mp3}", }`).join(`,
`)}
}`;
}