export namespace Boundary_Prettier {
  // Copied from `@types/prettier`
  // https://github.com/DefinitelyTyped/DefinitelyTyped/blob/5bb07fc4b087cb7ee91084afa6fe750551a7bbb1/types/prettier/index.d.ts

  // Minimum TypeScript Version: 4.2

  interface PrinterOptions {
    /**
     * Specify the line length that the printer will wrap on.
     * @default 80
     */
    printWidth: number;
    /**
     * Specify the number of spaces per indentation-level.
     * @default 2
     */
    tabWidth: number;
    /**
     * Indent lines with tabs instead of spaces
     * @default false
     */
    useTabs?: boolean;
    parentParser?: string | undefined;
    __embeddedInHtml?: boolean | undefined;
  }

  // This utility is here to handle the case where you have an explicit union
  // between string literals and the generic string type. It would normally
  // resolve out to just the string type, but this generic LiteralUnion maintains
  // the intellisense of the original union.
  //
  // It comes from this issue: microsoft/TypeScript#29729:
  //   https://github.com/microsoft/TypeScript/issues/29729#issuecomment-700527227
  type LiteralUnion<T extends U, U = string> =
    | T
    | (Pick<U, never> & { _?: never | undefined });

  export type BuiltInParserName =
    | "acorn"
    | "angular"
    | "babel-flow"
    | "babel-ts"
    | "babel"
    | "css"
    | "espree"
    | "flow"
    | "glimmer"
    | "graphql"
    | "html"
    | "json-stringify"
    | "json"
    | "json5"
    | "less"
    | "lwc"
    | "markdown"
    | "mdx"
    | "meriyah"
    | "scss"
    | "typescript"
    | "vue"
    | "yaml";

  export interface Options extends PrinterOptions {
    /**
     * Print semicolons at the ends of statements.
     * @default true
     */
    semi: boolean;
    /**
     * Use single quotes instead of double quotes.
     * @default false
     */
    singleQuote: boolean;
    /**
     * Use single quotes in JSX.
     * @default false
     */
    jsxSingleQuote: boolean;
    /**
     * Print trailing commas wherever possible.
     * @default "all"
     */
    trailingComma: "none" | "es5" | "all";
    /**
     * Print spaces between brackets in object literals.
     * @default true
     */
    bracketSpacing: boolean;
    /**
     * Put the `>` of a multi-line HTML (HTML, JSX, Vue, Angular) element at the end of the last line instead of being
     * alone on the next line (does not apply to self closing elements).
     * @default false
     */
    bracketSameLine: boolean;
    /**
     * Put the `>` of a multi-line JSX element at the end of the last line instead of being alone on the next line.
     * @default false
     * @deprecated use bracketSameLine instead
     */
    jsxBracketSameLine: boolean;
    /**
     * Format only a segment of a file.
     * @default 0
     */
    rangeStart: number;
    /**
     * Format only a segment of a file.
     * @default Number.POSITIVE_INFINITY
     */
    rangeEnd: number;
    /**
     * Specify which parser to use.
     */
    parser: LiteralUnion<BuiltInParserName>;
    /**
     * Specify the input filepath. This will be used to do parser inference.
     */
    filepath: string;
    /**
     * Prettier can restrict itself to only format files that contain a special comment, called a pragma, at the top of the file.
     * This is very useful when gradually transitioning large, unformatted codebases to prettier.
     * @default false
     */
    requirePragma: boolean;
    /**
     * Prettier can insert a special @format marker at the top of files specifying that
     * the file has been formatted with prettier. This works well when used in tandem with
     * the --require-pragma option. If there is already a docblock at the top of
     * the file then this option will add a newline to it with the @format marker.
     * @default false
     */
    insertPragma: boolean;
    /**
     * By default, Prettier will wrap markdown text as-is since some services use a linebreak-sensitive renderer.
     * In some cases you may want to rely on editor/viewer soft wrapping instead, so this option allows you to opt out.
     * @default "preserve"
     */
    proseWrap: "always" | "never" | "preserve";
    /**
     * Include parentheses around a sole arrow function parameter.
     * @default "always"
     */
    arrowParens: "avoid" | "always";
    /**
     * Provide ability to support new languages to prettier.
     */
    plugins: Array<string | Plugin>;
    /**
     * How to handle whitespaces in HTML.
     * @default "css"
     */
    htmlWhitespaceSensitivity: "css" | "strict" | "ignore";
    /**
     * Which end of line characters to apply.
     * @default "lf"
     */
    endOfLine: "auto" | "lf" | "crlf" | "cr";
    /**
     * Change when properties in objects are quoted.
     * @default "as-needed"
     */
    quoteProps: "as-needed" | "consistent" | "preserve";
    /**
     * Whether or not to indent the code inside <script> and <style> tags in Vue files.
     * @default false
     */
    vueIndentScriptAndStyle: boolean;
    /**
     * Control whether Prettier formats quoted code embedded in the file.
     * @default "auto"
     */
    embeddedLanguageFormatting: "auto" | "off";
    /**
     * Enforce single attribute per line in HTML, Vue and JSX.
     * @default false
     */
    singleAttributePerLine: boolean;
  }

  export interface Api {
    format(source: string, options?: Options): Promise<string>;
  }
}
