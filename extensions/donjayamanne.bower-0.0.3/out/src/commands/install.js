// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
var vscode = require('vscode');
// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
function install(adapter, name, config, progressIndicator) {
    var bower = require('bower');
    progressIndicator.beginTask("bower install");
    bower.commands
        .install([name], config, { interactive: true })
        .on('error', function (error) {
        progressIndicator.endTask("bower install");
        adapter.logError(error);
        vscode.window.showErrorMessage('bower install failed! View Output window for further details');
    }).on('log', function (msg) {
        adapter.log(msg);
    }).on('end', function () {
        progressIndicator.endTask("bower install");
        vscode.window.showInformationMessage("bower package '" + name + "' successfully installed!");
    }).on('prompt', function (prompts, callback) {
        adapter.prompt(prompts, callback);
    });
}
exports.install = install;
//# sourceMappingURL=install.js.map