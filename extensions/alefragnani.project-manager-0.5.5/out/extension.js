// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
var vscode = require('vscode');
var fs = require('fs');
var path = require('path');
var child_process_1 = require('child_process');
// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
function activate() {
    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated
    console.log('Congratulations, your extension "project-manager" is now active!');
    // 
    var projectFile;
    var appdata = process.env.APPDATA || (process.platform == 'darwin' ? process.env.HOME + '/Library/Application Support' : '/var/local');
    projectFile = path.join(appdata, "Code/User/projects.json");
    // in linux, it may not work with /var/local, then try to use /home/myuser/.config
    if ((process.platform == 'linux') && (!fs.existsSync(projectFile))) {
        var os = require('os');
        projectFile = path.join(os.homedir(), '.config/Code/User/projects.json');
    }
    // Save the Projects
    vscode.commands.registerCommand('projectManager.saveProject', function () {
        // The code you place here will be executed every time your command is executed
        // Display a message box to the user
        var wpath = vscode.workspace.rootPath;
        if (process.platform == 'win32') {
            wpath = wpath.substr(wpath.lastIndexOf("\\") + 1);
        }
        else {
            wpath = wpath.substr(wpath.lastIndexOf("/") + 1);
        }
        // ask the PROJECT NAME (suggest the )
        var ibo = {
            prompt: "Project Name",
            placeHolder: "Noname",
            value: wpath
        };
        vscode.window.showInputBox(ibo).then(function (projectName) {
            console.log("Project Name: " + projectName);
            if (typeof projectName == 'undefined') {
                return;
            }
            var rootPath = vscode.workspace.rootPath;
            var items = [];
            if (fs.existsSync(projectFile)) {
                items = loadProjects(projectFile);
                if (items == null) {
                    return;
                }
            }
            var found = false;
            for (var i = 0; i < items.length; i++) {
                var element = items[i];
                if (element.label == projectName) {
                    found = true;
                }
            }
            if (!found) {
                items.push({ label: projectName, description: rootPath });
                fs.writeFileSync(projectFile, JSON.stringify(items, null, "\t"));
                vscode.window.showInformationMessage('Project saved!');
            }
            else {
                var optionUpdate = {
                    title: "Update"
                };
                var optionCancel = {
                    title: "Cancel"
                };
                vscode.window.showInformationMessage('Project already exists!', optionUpdate, optionCancel).then(function (option) {
                    // nothing selected
                    if (typeof option == 'undefined') {
                        return;
                    }
                    if (option.title == "Update") {
                        for (var i = 0; i < items.length; i++) {
                            if (items[i].label == projectName) {
                                items[i].description = rootPath;
                                fs.writeFileSync(projectFile, JSON.stringify(items, null, "\t"));
                                vscode.window.showInformationMessage('Project saved!');
                                return;
                            }
                        }
                    }
                    else {
                        return;
                    }
                });
            }
        });
    });
    // List the Projects and allow the user to pick (select) one of them to activate
    vscode.commands.registerCommand('projectManager.listProjects', function () {
        var items = [];
        if (fs.existsSync(projectFile)) {
            items = loadProjects(projectFile);
            if (items == null) {
                return;
            }
        }
        else {
            vscode.window.showInformationMessage('No projects saved yet!');
            return;
        }
        var sortList = vscode.workspace.getConfiguration('projectManager').get('sortList');
        var itemsSorted = [];
        if (sortList == "Name") {
            itemsSorted = getSortedByName(items);
        }
        else {
            itemsSorted = getSortedByPath(items);
        }
        ;
        vscode.window.showQuickPick(itemsSorted).then(function (selection) {
            if (typeof selection == 'undefined') {
                return;
            }
            // code path
            var codePath = vscode.workspace.getConfiguration('projectManager').get('codePath', 'none');
            if (codePath == 'none') {
                codePath = "Code";
            }
            else {
                codePath = normalizePath(codePath);
            }
            // project path
            var projectPath = selection.description;
            projectPath = normalizePath(projectPath);
            var openInNewWindow = vscode.workspace.getConfiguration('projectManager').get('openInNewWindow', true);
            var reuseCmdOption = openInNewWindow ? "" : " -r";
            var useAlternativeMacOSXPath = vscode.workspace.getConfiguration('projectManager').get('useAlternativeMacOSXPath', false);
            if (useAlternativeMacOSXPath && (process.platform == 'darwin')) {
                child_process_1.exec("open" + " -b " + codePath + " " + projectPath + reuseCmdOption);
            }
            else {
                child_process_1.exec(codePath + " " + projectPath + reuseCmdOption);
            }
        });
    });
    vscode.commands.registerCommand('projectManager.editProjects', function () {
        if (fs.existsSync(projectFile)) {
            vscode.workspace.openTextDocument(projectFile).then(function (doc) {
                vscode.window.showTextDocument(doc);
            });
        }
        else {
            vscode.window.showInformationMessage('No projects saved yet!');
        }
    });
    function getSortedByName(items) {
        var itemsSorted = items.sort(function (n1, n2) {
            if (n1.label > n2.label) {
                return 1;
            }
            if (n1.label < n2.label) {
                return -1;
            }
            return 0;
        });
        return itemsSorted;
    }
    function getSortedByPath(items) {
        var itemsSorted = items.sort(function (n1, n2) {
            if (n1.description > n2.description) {
                return 1;
            }
            if (n1.description < n2.description) {
                return -1;
            }
            return 0;
        });
        return itemsSorted;
    }
    function surroundByDoubleQuotes(path) {
        return "\"" + path + "\"";
    }
    function pathIsUNC(path) {
        return path.indexOf('\\\\') == 0;
    }
    function normalizePath(path) {
        var normalizedPath = path;
        if (!pathIsUNC(normalizedPath)) {
            var replaceable = normalizedPath.split('\\');
            normalizedPath = replaceable.join('\\\\');
        }
        normalizedPath = surroundByDoubleQuotes(normalizedPath);
        return normalizedPath;
    }
    function loadProjects(file) {
        var items = [];
        try {
            items = JSON.parse(fs.readFileSync(file).toString());
            return items;
        }
        catch (error) {
            var optionOpenFile = {
                title: "Open File"
            };
            vscode.window.showErrorMessage('Error loading projects.json file. Message: ' + error.toString(), optionOpenFile).then(function (option) {
                // nothing selected
                if (typeof option == 'undefined') {
                    return;
                }
                if (option.title == "Open File") {
                    vscode.commands.executeCommand('projectManager.editProjects');
                }
                else {
                    return;
                }
            });
            return null;
        }
    }
}
exports.activate = activate;
//# sourceMappingURL=extension.js.map