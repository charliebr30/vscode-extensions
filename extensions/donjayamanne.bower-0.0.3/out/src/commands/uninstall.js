// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
var vscode = require('vscode');
// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
function uninstall(adapter, progressIndicator) {
    var bower = require('bower');
    bower.commands
        .list({ paths: true }, { offline: true })
        .on('error', function (error) {
        adapter.logError(error);
        vscode.window.showErrorMessage('bower uninstall failed! View Output window for further details');
    }).on('log', function (msg) {
        adapter.log(msg);
    }).on('end', function (installed) {
        var installedPackages = Object.keys(installed);
        if (installedPackages.length === 0) {
            vscode.window.showInformationMessage("No packages installed");
            return;
        }
        var packages = installedPackages.map(function (item) {
            return {
                label: item,
                description: Array.isArray(installed[item]) ? installed[item][0] : installed[item],
                name: item };
        });
        displayPackageList(packages);
    }).on('prompt', function (prompts, callback) {
        adapter.prompt(prompts, callback);
    });
    function displayPackageList(packages) {
        vscode.window.showQuickPick(packages, { placeHolder: "Select the package to uninstall" }).then(function (item) {
            //displayPackageForUnInstallation(item);
            if (!item) {
                return;
            }
            displayPackageForUnInstallation(item);
        });
    }
    var UNINSTALL_NO_UPDATE = "Uninstall";
    var UNINSTALL = "Uninstall from dependency";
    var UNINSTALL_DEV = "Uninstall from devDependency";
    function displayPackageForUnInstallation(pkg) {
        var actions = [
            { label: UNINSTALL_NO_UPDATE, description: "bower uninstall <name>" },
            { label: UNINSTALL, description: "Uninstall from bower.json dependencies (bower uninstall <name> --save)" } //,
        ];
        vscode.window.showQuickPick(actions, { placeHolder: "Install " + pkg.label }).then(function (action) {
            if (!action) {
                return;
            }
            var options = {};
            if (action.label === UNINSTALL) {
                options.save = true;
            }
            if (action.label === UNINSTALL_DEV) {
                options["save-dev"] = true;
            }
            confirmUninstallPackage(pkg.name, options);
        });
    }
    function confirmUninstallPackage(packageName, options) {
        vscode.window.showWarningMessage("Are you sure you want to uninstall '" + packageName + "'?", "Yes").then(function (cmd) {
            if (cmd === "Yes") {
                uninstallPackage(packageName, options);
            }
        });
    }
    function uninstallPackage(name, options) {
        bower.commands
            .uninstall([name], options)
            .on('error', function (error) {
            adapter.logError(error);
            vscode.window.showErrorMessage('bower uninstall failed! View Output window for further details');
        }).on('end', function (msg) {
            vscode.window.showInformationMessage("bower package '" + name + "' successfully uninstalled!");
        }).on('log', function (msg) {
            adapter.log(msg);
        }).on('prompt', function (prompts, callback) {
            adapter.prompt(prompts, callback);
        });
    }
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = uninstall;
//# sourceMappingURL=uninstall.js.map