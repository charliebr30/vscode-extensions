// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
var vscode = require('vscode');
// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
function search(adapter, progressIndicator) {
    var bower = require('bower');
    search();
    function search() {
        vscode.window.showInputBox({ placeHolder: "Enter package name to search (bower search <name>)" }).then(function (searchString) {
            if (typeof (searchString) !== "string" || searchString.length === 0) {
                return;
            }
            progressIndicator.beginTask("bower search");
            bower.commands
                .search(searchString)
                .on('error', function (error) {
                progressIndicator.endTask("bower search");
                adapter.logError(error);
                vscode.window.showErrorMessage('bower search failed! View Output window for further details');
            }).on('log', function (msg) {
                adapter.log(msg);
            }).on('end', function (results) {
                progressIndicator.endTask("bower search");
                var packages = results.map(function (item) { return { label: item.name, description: item.url, name: item.name }; });
                displayPackageList(packages);
            }).on('prompt', function (prompts, callback) {
                adapter.prompt(prompts, callback);
            });
        });
    }
    function displayPackageList(packages) {
        vscode.window.showQuickPick(packages, { placeHolder: "Select the package to install" }).then(function (item) {
            if (!item) {
                return;
            }
            displayPackageForInstallation(item);
        });
    }
    var SAVE_NO_UPDATE = "Install";
    var SAVE = "Install as Dependency";
    var SAVE_DEV = "Install as Dev Dependency";
    var SAVE_DEV_BOTH = "Install as Dependency and Dev Dependency";
    function displayPackageForInstallation(pkg) {
        var actions = [
            { label: SAVE_NO_UPDATE, description: "bower install <name>" },
            { label: SAVE, description: "Install into bower.json dependencies (bower install <name> --save)" }
        ];
        vscode.window.showQuickPick(actions, { placeHolder: "Install " + pkg.label }).then(function (action) {
            if (!action) {
                return;
            }
            var options = {};
            if (action.label === SAVE) {
                options.save = true;
            }
            if (action.label === SAVE_DEV) {
                options["save-dev"] = true;
            }
            installPackage(pkg.name, options);
        });
    }
    function installPackage(name, options) {
        progressIndicator.beginTask("bower install");
        bower.commands
            .install([name], options, { interactive: true })
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
}
exports.search = search;
//# sourceMappingURL=search.js.map