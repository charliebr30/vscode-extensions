// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
var vscode = require('vscode');
var adapter_1 = require('./adapter');
var progressIndicator_1 = require('./progressIndicator');
var init_1 = require('./commands/init');
var restore_1 = require('./commands/restore');
var uninstall_1 = require('./commands/uninstall');
var update_1 = require('./commands/update');
var bowerCache = require('./commands/cache');
var bowerSearch = require('./commands/search');
var path = require('path');
var fs = require('fs');
// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
function activate(context) {
    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated
    console.log('Congratulations, your extension "bowerpm" is now active!');
    var adapter = new adapter_1.default();
    var progressIndicator = new progressIndicator_1.default();
    var commansAndHandlers = [
        {
            "label": "Bower Init",
            "description": "Create bower.json (bower init)",
            "handler": function () { init_1.default(adapter, progressIndicator); }
        },
        {
            "label": "Bower Install",
            "description": "Restore packages defined in bower.json (bower install)",
            "handler": function () { restore_1.default(adapter, progressIndicator); }
        },
        {
            "label": "Bower Search and Install",
            "description": "Search for a package and install it",
            "handler": function () { bowerSearch.search(adapter, progressIndicator); }
        },
        {
            "label": "Bower Uninstall",
            "description": "Select and uninstall a package",
            "handler": function () { uninstall_1.default(adapter, progressIndicator); }
        },
        {
            "label": "Bower Update",
            "description": "Update all packages or a selected package (bower update)",
            "handler": function () { update_1.default(adapter, progressIndicator); }
        },
        {
            "label": "Bower Cache - Clear",
            "description": "Clear bower cache (bower cache clear)",
            "handler": function () { bowerCache.cleanEverythingFromCache(adapter, progressIndicator); }
        },
        {
            "label": "Bower Cache - List",
            "description": "List the items in the bower cache and action them",
            "handler": function () { bowerCache.listCache(adapter, progressIndicator); }
        }
    ];
    var disposable = vscode.commands.registerCommand('extension.bower', function () {
        vscode.window.showQuickPick(commansAndHandlers).then(function (cmd) {
            if (!cmd) {
                return;
            }
            //var cwd2 = vscode.workspace.rootPath;
            var rootPath = vscode.workspace.rootPath;
            var currentFilePath = null;
            if (vscode.window.activeTextEditor && vscode.window.activeTextEditor.document) {
                currentFilePath = vscode.window.activeTextEditor.document.fileName;
            }
            getBowerConfigDir(rootPath, currentFilePath).then(function (cwd) {
                process.chdir(cwd);
                adapter.clearLog();
                adapter.showLog();
                cmd.handler();
            });
        });
    });
    context.subscriptions.push(disposable);
}
exports.activate = activate;
function getBowerConfigDirRecursively(recursiveDepth, rootDir, currentDir, resolve) {
    var relativePath = path.relative(rootDir, currentDir);
    if (relativePath.length === 0 || relativePath.startsWith("..")) {
        resolve(rootDir);
        return;
    }
    fs.exists(path.join(currentDir, "bower.json"), function (exists) {
        if (exists || recursiveDepth >= 20) {
            resolve(currentDir);
        }
        else {
            getBowerConfigDirRecursively(recursiveDepth++, rootDir, path.join(currentDir, "../"), resolve);
        }
    });
}
function getBowerConfigDir(rootPath, currentFilePath) {
    return new Promise(function (resolve, reject) {
        if (currentFilePath) {
            getBowerConfigDirRecursively(1, rootPath, currentFilePath, resolve);
        }
        else {
            resolve(vscode.workspace.rootPath);
        }
    });
}
//# sourceMappingURL=extension.js.map