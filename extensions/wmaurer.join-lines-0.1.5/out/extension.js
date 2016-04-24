var vscode = require('vscode');
var whitespaceAtEndOfLine = /\s*$/;
function activate(context) {
    var disposable = vscode.commands.registerTextEditorCommand('extension.join-lines', function (textEditor, edit) {
        var document = textEditor.document;
        var newSelections = [];
        textEditor.edit(function (editBuilder) {
            var onlyOneSelection = textEditor.selections.length === 1;
            textEditor.selections
                .forEach(function (selection) {
                if (isRangeSimplyCursorPosition(selection)) {
                    var newSelectionEnd = document.lineAt(selection.start.line).range.end.character - joinLineWithNext(selection.start.line, editBuilder, document).whitespaceLengthAtEnd;
                    newSelections.push({
                        numLinesRemoved: 1,
                        selection: new vscode.Selection(selection.start.line, newSelectionEnd, selection.end.line, newSelectionEnd)
                    });
                }
                else if (isRangeOnOneLine(selection)) {
                    joinLineWithNext(selection.start.line, editBuilder, document);
                    newSelections.push({ numLinesRemoved: 1, selection: selection });
                }
                else {
                    var numberOfCharactersOnFirstLine = document.lineAt(selection.start.line).range.end.character;
                    var endCharacterOffset = 0;
                    for (var lineIndex = selection.start.line; lineIndex <= selection.end.line - 1; lineIndex++) {
                        var charactersInLine = lineIndex == selection.end.line - 1 ? selection.end.character + 1 : document.lineAt(lineIndex + 1).range.end.character + 1;
                        var whitespaceLengths = joinLineWithNext(lineIndex, editBuilder, document);
                        endCharacterOffset += charactersInLine - whitespaceLengths.whitespaceLengthAtEnd - whitespaceLengths.whitespaceLengthAtStart;
                    }
                    newSelections.push({
                        numLinesRemoved: selection.end.line - selection.start.line,
                        selection: new vscode.Selection(selection.start.line, selection.start.character, selection.start.line, numberOfCharactersOnFirstLine + endCharacterOffset)
                    });
                }
            });
        }).then(function () {
            var selections = newSelections.map(function (x, i) {
                var numLinesRemoved = x.numLinesRemoved, selection = x.selection;
                var numPreviousLinesRemoved = i == 0 ? 0 : newSelections.slice(0, i).map(function (x) { return x.numLinesRemoved; }).reduce(function (a, b) { return a + b; });
                var newLineNumber = selection.start.line - numPreviousLinesRemoved;
                return new vscode.Selection(newLineNumber, selection.start.character, newLineNumber, selection.end.character);
            });
            textEditor.selections;
            textEditor.selections = selections;
        });
    });
    context.subscriptions.push(disposable);
}
exports.activate = activate;
function isRangeOnOneLine(range) {
    return range.start.line === range.end.line;
}
function isRangeSimplyCursorPosition(range) {
    return isRangeOnOneLine(range) && range.start.character === range.end.character;
}
function joinLineWithNext(line, editBuilder, document) {
    var matchWhitespaceAtEnd = document.lineAt(line).text.match(whitespaceAtEndOfLine);
    var range = new vscode.Range(line, document.lineAt(line).range.end.character - matchWhitespaceAtEnd[0].length, line + 1, document.lineAt(line + 1).firstNonWhitespaceCharacterIndex);
    editBuilder.replace(range, ' ');
    return {
        whitespaceLengthAtEnd: matchWhitespaceAtEnd[0].length,
        whitespaceLengthAtStart: document.lineAt(line + 1).firstNonWhitespaceCharacterIndex
    };
}
//# sourceMappingURL=extension.js.map