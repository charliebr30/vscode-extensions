/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------*/
'use strict';
var vscode = require('vscode');
var cp = require('child_process');
var path = require('path');
var goPath_1 = require('./goPath');
var util_1 = require('./util');
var goInstallTools_1 = require('./goInstallTools');
var GoReferenceProvider = (function () {
    function GoReferenceProvider() {
    }
    GoReferenceProvider.prototype.provideReferences = function (document, position, options, token) {
        var _this = this;
        return vscode.workspace.saveAll(false).then(function () {
            return _this.doFindReferences(document, position, options, token);
        });
    };
    GoReferenceProvider.prototype.doFindReferences = function (document, position, options, token) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            var filename = _this.canonicalizeForWindows(document.fileName);
            var cwd = path.dirname(filename);
            // get current word
            var wordRange = document.getWordRangeAtPosition(position);
            if (!wordRange) {
                return resolve([]);
            }
            var offset = util_1.byteOffsetAt(document, position);
            var goGuru = goPath_1.getBinPath('guru');
            var process = cp.execFile(goGuru, ['referrers', (filename + ":#" + offset.toString())], {}, function (err, stdout, stderr) {
                try {
                    if (err && err.code === 'ENOENT') {
                        vscode.window.showInformationMessage('The "guru" command is not available.  Use "go get -v golang.org/x/tools/cmd/guru" to install.', 'Install').then(function (selected) {
                            goInstallTools_1.installTool('guru');
                        });
                        return resolve(null);
                    }
                    var lines = stdout.toString().split('\n');
                    var results = [];
                    for (var i = 0; i < lines.length; i++) {
                        var line = lines[i];
                        var match = /^(.*):(\d+)\.(\d+)-(\d+)\.(\d+):/.exec(lines[i]);
                        if (!match)
                            continue;
                        var _1 = match[0], file = match[1], lineStartStr = match[2], colStartStr = match[3], lineEndStr = match[4], colEndStr = match[5];
                        var referenceResource = vscode.Uri.file(path.resolve(cwd, file));
                        var range = new vscode.Range(+lineStartStr - 1, +colStartStr - 1, +lineEndStr - 1, +colEndStr);
                        results.push(new vscode.Location(referenceResource, range));
                    }
                    resolve(results);
                }
                catch (e) {
                    reject(e);
                }
            });
            token.onCancellationRequested(function () {
                return process.kill();
            });
        });
    };
    GoReferenceProvider.prototype.canonicalizeForWindows = function (filename) {
        // convert backslashes to forward slashes on Windows
        // otherwise go-find-references returns no matches
        if (/^[a-z]:\\/.test(filename))
            return filename.replace(/\\/g, '/');
        return filename;
    };
    return GoReferenceProvider;
}());
exports.GoReferenceProvider = GoReferenceProvider;
//# sourceMappingURL=goReferences.js.map