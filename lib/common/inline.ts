export const inline = ([indentedString]: TemplateStringsArray) => {
    return indentedString.replace(/(\s+)?\n(\t+)?/g, " ");
};
