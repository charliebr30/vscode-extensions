'use strict';
var vscode_1 = require('vscode');
var ProgressIndicator = (function () {
    function ProgressIndicator() {
        this._tasks = [];
        this.ProgressText = ["|", "/", "-", "\\", "|", "/", "-", "\\"];
        this.ProgressCounter = 0;
        this._statusBarItem = vscode_1.window.createStatusBarItem(vscode_1.StatusBarAlignment.Left);
    }
    ProgressIndicator.prototype.beginTask = function (task) {
        this._tasks.push(task);
        this.displayProgressIndicator();
    };
    ProgressIndicator.prototype.endTask = function (task) {
        if (this._tasks.length > 0) {
            this._tasks.pop();
        }
        this.setMessage();
    };
    ProgressIndicator.prototype.setMessage = function () {
        if (this._tasks.length === 0) {
            this._statusBarItem.text = "";
            this.hideProgressIndicator();
            return;
        }
        this._statusBarItem.text = this._tasks[this._tasks.length - 1];
        this._statusBarItem.show();
    };
    ProgressIndicator.prototype.displayProgressIndicator = function () {
        var _this = this;
        this.setMessage();
        this.hideProgressIndicator();
        this._interval = setInterval(function () { return _this.onDisplayProgressIndicator(); }, 100);
    };
    ProgressIndicator.prototype.hideProgressIndicator = function () {
        if (this._interval) {
            clearInterval(this._interval);
            this._interval = null;
        }
        this.ProgressCounter = 0;
    };
    ProgressIndicator.prototype.onDisplayProgressIndicator = function () {
        if (this._tasks.length === 0) {
            return;
        }
        var txt = this.ProgressText[this.ProgressCounter];
        this._statusBarItem.text = this._tasks[this._tasks.length - 1] + " " + txt;
        this.ProgressCounter++;
        if (this.ProgressCounter >= this.ProgressText.length - 1) {
            this.ProgressCounter = 0;
        }
    };
    return ProgressIndicator;
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = ProgressIndicator;
//# sourceMappingURL=progressIndicator.js.map