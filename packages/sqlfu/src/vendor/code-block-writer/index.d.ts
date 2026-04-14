type Options = {
    useTabs?: boolean;
    newLine?: '\n' | '\r\n';
    indentNumberOfSpaces?: number;
};
export default class CodeBlockWriter {
    private readonly indentationText;
    private readonly newLineText;
    private readonly chunks;
    private currentIndentation;
    private atLineStart;
    private newLineOnNextWrite;
    constructor(options?: Options);
    write(text: string): this;
    writeLine(text: string): this;
    newLine(): this;
    blankLine(): this;
    block(block: () => void): this;
    inlineBlock(block: () => void): this;
    indent(timesOrBlock?: number | (() => void)): this;
    toString(): string;
    private flushDeferredNewLine;
    private writeIndentIfNeeded;
    private isLastNewLine;
}
export {};
//# sourceMappingURL=index.d.ts.map