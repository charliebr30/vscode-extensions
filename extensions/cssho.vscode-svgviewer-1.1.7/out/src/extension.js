'use strict';
var vscode = require('vscode');
var fs = require('pn/fs');
var svg2png = require('svg2png');
var tmp = require('tmp');
var cp = require('copy-paste');
function activate(context) {
    console.log('SVG Viewer is now active!');
    var previewUri = vscode.Uri.parse('svg-preview://authority/svg-preview');
    var SvgDocumentContentProvider = (function () {
        function SvgDocumentContentProvider() {
            this._onDidChange = new vscode.EventEmitter();
        }
        SvgDocumentContentProvider.prototype.provideTextDocumentContent = function (uri) {
            return this.createSvgSnippet();
        };
        Object.defineProperty(SvgDocumentContentProvider.prototype, "onDidChange", {
            get: function () {
                return this._onDidChange.event;
            },
            enumerable: true,
            configurable: true
        });
        SvgDocumentContentProvider.prototype.update = function (uri) {
            this._onDidChange.fire(uri);
        };
        SvgDocumentContentProvider.prototype.createSvgSnippet = function () {
            return this.extractSnippet();
        };
        SvgDocumentContentProvider.prototype.extractSnippet = function () {
            var editor = vscode.window.activeTextEditor;
            var text = editor.document.getText();
            return this.snippet(text);
        };
        SvgDocumentContentProvider.prototype.errorSnippet = function (error) {
            return "\n                <body>\n                    " + error + "\n                </body>";
        };
        SvgDocumentContentProvider.prototype.snippet = function (properties) {
            var showTransGrid = vscode.workspace.getConfiguration('svgviewer').get('transparencygrid');
            var transparencyGridCss = '';
            if (showTransGrid) {
                transparencyGridCss = "\n<style type=\"text/css\">\n.svgbg svg {\n  background:initial;\n  background-image: url(data:image/gif;base64,iVBORw0KGgoAAAANSUhEUgAAACgAAAAoCAYAAACM/rhtAAAAeUlEQVRYR+3XMQ4AIQhEUTiU9+/hUGy9Wk2G8luDIS8EMWdmYvF09+JtEUmBpieCJiA96AIiiKAswEsik10JCCIoCrAsiGBPOIK2YFWt/knOOW5Nv/ykQNMTQRMwEERQFWAOqmJ3PIIIigIMahHs3ahZt0xCetAEjA99oc8dGNmnIAAAAABJRU5ErkJggg==);\n  background-position: left,top;\n}\n</style>";
            }
            return "<!DOCTYPE html><html><head>" + transparencyGridCss + "</head><body><div class=\"svgbg\">" + properties + "</div></body></html>";
        };
        return SvgDocumentContentProvider;
    }());
    var provider = new SvgDocumentContentProvider();
    var registration = vscode.workspace.registerTextDocumentContentProvider('svg-preview', provider);
    vscode.workspace.onDidChangeTextDocument(function (e) {
        if (e.document === vscode.window.activeTextEditor.document && !checkNoSvg(vscode.window.activeTextEditor, false)) {
            provider.update(previewUri);
        }
    });
    var open = vscode.commands.registerTextEditorCommand('svgviewer.open', function (te, t) {
        if (checkNoSvg(te))
            return;
        provider.update(previewUri);
        return vscode.commands.executeCommand('vscode.previewHtml', previewUri, vscode.ViewColumn.Two)
            .then(function (s) { return console.log('done.'); }, vscode.window.showErrorMessage);
    });
    context.subscriptions.push(open);
    var saveas = vscode.commands.registerTextEditorCommand('svgviewer.saveas', function (te, t) {
        if (checkNoSvg(te))
            return;
        var editor = vscode.window.activeTextEditor;
        var text = editor.document.getText();
        var tmpobj = tmp.fileSync();
        var pngpath = editor.document.uri.fsPath.replace('.svg', '.png');
        exportPng(tmpobj, text, pngpath);
    });
    context.subscriptions.push(saveas);
    var saveassize = vscode.commands.registerTextEditorCommand('svgviewer.saveassize', function (te, t) {
        if (checkNoSvg(te))
            return;
        var editor = vscode.window.activeTextEditor;
        var text = editor.document.getText();
        var tmpobj = tmp.fileSync();
        var pngpath = editor.document.uri.fsPath.replace('.svg', '.png');
        creatInputBox('width')
            .then(function (width) {
            if (width) {
                creatInputBox('height')
                    .then(function (height) {
                    if (height) {
                        exportPng(tmpobj, text, pngpath, Number(width), Number(height));
                    }
                });
            }
        });
    });
    context.subscriptions.push(saveassize);
    var copydu = vscode.commands.registerTextEditorCommand('svgviewer.copydui', function (te, t) {
        if (checkNoSvg(te))
            return;
        var editor = vscode.window.activeTextEditor;
        var text = editor.document.getText();
        cp.copy('data:image/svg+xml,' + encodeURIComponent(text));
    });
    context.subscriptions.push(copydu);
}
exports.activate = activate;
function creatInputBox(param) {
    return vscode.window.showInputBox({
        prompt: "Set " + param + " of the png.",
        placeHolder: "" + param,
        validateInput: checkSizeInput
    });
}
function checkNoSvg(editor, displayMessage) {
    if (displayMessage === void 0) { displayMessage = true; }
    var isNGType = !(editor.document.languageId === 'xml') || editor.document.getText().indexOf('</svg>') < 0;
    if (isNGType && displayMessage) {
        vscode.window.showWarningMessage("Active editor doesn't show a SVG document - no properties to preview.");
    }
    return isNGType;
}
function checkSizeInput(value) {
    return value !== '' && !isNaN(Number(value)) && Number(value) > 0
        ? null : 'Please set number.';
}
function exportPng(tmpobj, text, pngpath, w, h) {
    console.log("export width:" + w + " height:" + h);
    var result = fs.writeFile(tmpobj.name, text, 'utf-8')
        .then(fs.readFile(tmpobj.name)
        .then(function (source) { return (w === undefined || h === undefined) ? svg2png(source) : svg2png(source, { width: w, height: h }); })
        .then(function (buffer) {
        fs.writeFile(pngpath, buffer);
        vscode.window.showInformationMessage('export done. ' + pngpath);
    })
        .catch(function (e) { return vscode.window.showErrorMessage(e.message); }));
}
function deactivate() {
}
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map