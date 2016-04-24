// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
var vscode = require('vscode');
// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
function list(adapter, progressIndicator) {
    var bower = require('bower');
    bower.commands
        .list({ xrelative: true, xpaths: true }, { offline: false })
        .on('error', function (error) {
        adapter.logError(error);
        vscode.window.showErrorMessage('bower install failed! View Output window for further details');
    }).on('log', function (msg) {
        adapter.log(msg);
    }).on('end', function (installed) {
        adapter.log(installed);
        adapter.log(installed.dependencies);
    })
        .on('prompt', function (prompts, callback) {
        adapter.prompt(prompts, callback);
    });
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = list;
//# sourceMappingURL=list.js.map