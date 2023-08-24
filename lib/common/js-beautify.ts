import { js_beautify } from "js-beautify";

export function jsBeautify(source: string, options?: JSBeautifyOptions) {
    return js_beautify(source, options);
}

interface CoreBeautifyOptions {
    disabled?: boolean | undefined;
    eol?: string | undefined;
    end_with_newline?: boolean | undefined;
    indent_size?: number | undefined;
    indent_char?: string | undefined;
    indent_level?: number | undefined;
    preserve_newlines?: boolean | undefined;
    max_preserve_newlines?: number | undefined;
    indent_with_tabs?: boolean | undefined;
    wrap_line_length?: number | undefined;
    indent_empty_lines?: boolean | undefined;
    templating?: string[] | undefined;
}

interface JSBeautifyOptions extends CoreBeautifyOptions {
    brace_style?: 'collapse' | 'expand' | 'end-expand' | 'none' | 'preserve-inline' | undefined;
    unindent_chained_methods?: boolean | undefined;
    break_chained_methods?: boolean | undefined;
    space_in_paren?: boolean | undefined;
    space_in_empty_paren?: boolean | undefined;
    jslint_happy?: boolean | undefined;
    space_after_anon_function?: boolean | undefined;
    space_after_named_function?: boolean | undefined;
    keep_array_indentation?: boolean | undefined;
    space_before_conditional?: boolean | undefined;
    unescape_strings?: boolean | undefined;
    e4x?: boolean | undefined;
    comma_first?: boolean | undefined;
    operator_position?: 'before-newline' | 'after-newline' | 'preserve-newline' | undefined;
    test_output_raw?: boolean | undefined;
}