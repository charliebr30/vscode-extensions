// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
var vscode = require('vscode');
// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
function restore(adapter, progressIndicator) {
    progressIndicator.beginTask("bower install");
    var bower = require('bower');
    bower.commands
        .install(null, null, { interactive: true })
        .on('error', function (error) {
        progressIndicator.endTask("bower install");
        adapter.logError(error);
        vscode.window.showErrorMessage('bower install failed! View Output window for further details');
    }).on('log', function (msg) {
        adapter.log(msg);
    }).on('end', function (msg) {
        progressIndicator.endTask("bower install");
        vscode.window.showInformationMessage('bower install completed!');
    }).on('prompt', function (prompts, callback) {
        adapter.prompt(prompts, callback);
    });
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = restore;
//# sourceMappingURL=restore.js.map