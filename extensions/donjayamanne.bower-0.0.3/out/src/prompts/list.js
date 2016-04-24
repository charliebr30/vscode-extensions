'use strict';
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var vscode_1 = require('vscode');
var prompt_1 = require('./prompt');
var EscapeException_1 = require('../utils/EscapeException');
var ListPrompt = (function (_super) {
    __extends(ListPrompt, _super);
    function ListPrompt(question) {
        _super.call(this, question);
    }
    ListPrompt.prototype.render = function () {
        var choices = this._question.choices.reduce(function (result, choice) {
            result[choice.name || choice] = choice.value || choice;
            return result;
        }, {});
        var options = {
            placeHolder: this._question.message
        };
        return vscode_1.window.showQuickPick(Object.keys(choices), options)
            .then(function (result) {
            if (result === undefined) {
                throw new EscapeException_1.default();
            }
            return choices[result];
        });
    };
    return ListPrompt;
})(prompt_1.default);
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = ListPrompt;
//# sourceMappingURL=list.js.map