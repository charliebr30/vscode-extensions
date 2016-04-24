"use strict";
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
var vscode = require('vscode');
var history = require('./commands/fileHistory');
var lineHistory = require('./commands/lineHistory');
// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
function activate(context) {
    var outChannel;
    outChannel = vscode.window.createOutputChannel('Git');
    //outChannel.clear();
    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated
    console.log('Congratulations, your extension "githistory" is now active!');
    var outChannel;
    outChannel = vscode.window.createOutputChannel('Git');
    var disposable = vscode.commands.registerTextEditorCommand('git.viewFileHistory', function () {
        outChannel.clear();
        history.run(outChannel);
    });
    context.subscriptions.push(disposable);
    disposable = vscode.commands.registerTextEditorCommand('git.viewLineHistory', function () {
        outChannel.clear();
        lineHistory.run(outChannel);
    });
    context.subscriptions.push(disposable);
}
exports.activate = activate;
//# sourceMappingURL=extension.js.map