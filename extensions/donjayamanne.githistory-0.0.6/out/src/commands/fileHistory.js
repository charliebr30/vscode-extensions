"use strict";
var vscode = require('vscode');
var historyUtil = require('../helpers/historyUtils');
var path = require('path');
function run(outChannel) {
    if (!vscode.window.activeTextEditor || !vscode.window.activeTextEditor.document) {
        return;
    }
    historyUtil.getGitRepositoryPath(vscode.window.activeTextEditor.document.fileName).then(function (gitRepositoryPath) {
        var relativeFilePath = path.relative(gitRepositoryPath, vscode.window.activeTextEditor.document.fileName);
        historyUtil.getFileHistory(gitRepositoryPath, relativeFilePath).then(displayHistory, genericErrorHandler);
        function displayHistory(log) {
            if (log.length === 0) {
                vscode.window.showInformationMessage("There are no history items for this item '" + relativeFilePath + "'.");
                return;
            }
            var itemPickList = log.map(function (item) {
                var dateTime = new Date(Date.parse(item.author_date)).toLocaleString();
                var label = vscode.workspace.getConfiguration('gitHistory').get('displayLabel'), description = vscode.workspace.getConfiguration('gitHistory').get('displayDescription');
                label = label.replace('${date}', dateTime).replace('${name}', item.author_name)
                    .replace('${email}', item.author_email).replace('${message}', item.message);
                description = description.replace('${date}', dateTime).replace('${name}', item.author_name)
                    .replace('${email}', item.author_email).replace('${message}', item.message);
                return { label: label, description: description, data: item };
            });
            itemPickList.forEach(function (item, index) {
                if (index === (itemPickList.length - 1)) {
                    item.isLast = true;
                }
                else {
                    item.data.previousSha1 = log[index + 1].sha1;
                }
            });
            vscode.window.showQuickPick(itemPickList, { placeHolder: "", matchOnDescription: true }).then(function (item) {
                if (!item) {
                    return;
                }
                onItemSelected(item);
            });
        }
        function onItemSelected(item) {
            var itemPickList = [];
            itemPickList.push({ label: "View Change Log", description: "Author, committer and message" });
            itemPickList.push({ label: "View File Contents", description: "" });
            itemPickList.push({ label: "Compare against workspace file", description: "" });
            if (!item.isLast) {
                itemPickList.push({ label: "Compare against previous version", description: "" });
            }
            vscode.window.showQuickPick(itemPickList, { placeHolder: item.label, matchOnDescription: true }).then(function (cmd) {
                if (!cmd) {
                    return;
                }
                var data = item.data;
                if (cmd.label === itemPickList[0].label) {
                    viewLog(data);
                    return;
                }
                if (cmd.label === itemPickList[1].label) {
                    viewFile(data);
                    return;
                }
                if (cmd.label === itemPickList[2].label) {
                    launchFileCompareWithLocal(data);
                    return;
                }
                if (itemPickList.length > 3 && cmd.label === itemPickList[3].label) {
                    launchFileCompareWithPrevious(data);
                    return;
                }
            });
        }
        function viewFile(details) {
            displayFile(details.sha1, relativeFilePath).then(function () { }, genericErrorHandler);
        }
        function viewLog(details) {
            var authorDate = new Date(Date.parse(details.author_date)).toLocaleString();
            var committerDate = new Date(Date.parse(details.commit_date)).toLocaleString();
            var log = ("sha1 : " + details.sha1 + "\n") +
                ("Author : " + details.author_name + " <" + details.author_email + ">\n") +
                ("Author Date : " + authorDate + "\n") +
                ("Committer Name : " + details.author_email + " <" + details.author_email + ">\n") +
                ("Commit Date : " + committerDate + "\n") +
                ("Message : " + details.message);
            outChannel.append(log);
            outChannel.show();
        }
        function launchFileCompareWithLocal(details) {
            compareFileWithLocalCopy(details.sha1, relativeFilePath).then(function () { }, genericErrorHandler);
        }
        function genericErrorHandler(error) {
            if (error.code && error.syscall && error.code === 'ENOENT' && error.syscall === 'spawn git') {
                vscode.window.showErrorMessage("Cannot find the git installation");
            }
            else {
                outChannel.appendLine(error);
                outChannel.show();
                vscode.window.showErrorMessage("There was an error, please view details in output log");
            }
        }
        function launchFileCompareWithPrevious(details) {
            function getFile1() {
                return getFile(details.sha1, relativeFilePath);
            }
            function getFile2() {
                return getFile(details.previousSha1, relativeFilePath);
            }
            getFile(details.sha1, relativeFilePath).then(function (file1) {
                //Ok, now get file2
                getFile(details.previousSha1, relativeFilePath).then(function (file2) {
                    vscode.workspace.openTextDocument(file1).then(function (d) {
                        vscode.window.showTextDocument(d).then(function () {
                            vscode.commands.executeCommand("workbench.files.action.compareFileWith");
                            vscode.workspace.openTextDocument(file2).then(function (d2) {
                                vscode.window.showTextDocument(d2);
                            });
                        });
                    });
                }, genericErrorHandler);
            }, genericErrorHandler);
        }
    });
}
exports.run = run;
function getFile(commitSha1, localFilePath) {
    var rootDir = vscode.workspace.rootPath;
    return new Promise(function (resolve, reject) {
        var ext = path.extname(localFilePath);
        var tmp = require("tmp");
        tmp.file({ postfix: ext }, function _tempFileCreated(err, tmpFilePath, fd) {
            if (err) {
                reject(err);
                return;
            }
            historyUtil.writeFile(rootDir, commitSha1, localFilePath, tmpFilePath).then(function () {
                resolve(tmpFilePath);
            }, reject);
        });
    });
}
function displayFile(commitSha1, localFilePath) {
    return new Promise(function (resolve, reject) {
        getFile(commitSha1, localFilePath).then(function (tmpFilePath) {
            vscode.workspace.openTextDocument(tmpFilePath).then(function (d) {
                vscode.window.showTextDocument(d);
                resolve(tmpFilePath);
            });
        }, reject);
    });
}
function compareFileWithLocalCopy(commitSha1, localFilePath) {
    //The way the command "workbench.files.action.compareFileWith" works is:
    //It first selects the currently active editor for comparison
    //Then launches the open file dropdown
    //& as soon as a file/text document is opened, that is used as the text document for comparison
    //So, all we need to do is invoke the comparison command
    //Then open our file
    return new Promise(function (resolve, reject) {
        getFile(commitSha1, localFilePath).then(function (tmpFilePath) {
            vscode.commands.executeCommand("workbench.files.action.compareFileWith");
            vscode.workspace.openTextDocument(tmpFilePath).then(function (d) {
                vscode.window.showTextDocument(d);
                resolve(tmpFilePath);
            });
        }, reject);
    });
}
//# sourceMappingURL=fileHistory.js.map