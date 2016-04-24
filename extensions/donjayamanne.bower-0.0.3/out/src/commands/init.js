// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
var vscode = require('vscode');
// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
function init(adapter, progressIndicator) {
    var bower = require('bower');
    bower.commands
        .init({ interactive: true })
        .on('error', function (error) {
        adapter.logError(error);
        vscode.window.showErrorMessage('bower init failed! View Output window for further details');
    }).on('log', function (msg) {
        adapter.log(msg);
    }).on('end', function (msg) {
        vscode.window.showInformationMessage('bower init completed!');
    }).on('prompt', function (prompts, callback) {
        adapter.prompt(prompts, callback);
    });
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = init;
//# sourceMappingURL=init.js.map