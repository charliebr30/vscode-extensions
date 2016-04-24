/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/
'use strict';
var vscode = require('vscode');
function activateIndentFormatProvider(context) {
    var disposable = vscode.workspace.onDidChangeTextDocument(onDidChangeTextDocument);
    context.subscriptions.push(disposable);
}
exports.activateIndentFormatProvider = activateIndentFormatProvider;
function onDidChangeTextDocument(eventArgs) {
    if (eventArgs.contentChanges.length !== 1 && eventArgs.contentChanges[0].text !== "\r\n") {
        return;
    }
}
//# sourceMappingURL=indentFormatProvider.js.map