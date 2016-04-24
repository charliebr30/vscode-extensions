'use strict';
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var vscode_1 = require('vscode');
var prompt_1 = require('./prompt');
var EscapeException_1 = require('../utils/EscapeException');
var figures = require('figures');
var CheckboxPrompt = (function (_super) {
    __extends(CheckboxPrompt, _super);
    function CheckboxPrompt(question) {
        _super.call(this, question);
    }
    CheckboxPrompt.prototype.render = function () {
        var _this = this;
        var choices = this._question.choices.reduce(function (result, choice) {
            var choiceName = choice.name || choice;
            result[((choice.checked === true ? figures.radioOn : figures.radioOff) + " " + choiceName)] = choice;
            return result;
        }, {});
        var options = {
            placeHolder: this._question.message
        };
        var quickPickOptions = Object.keys(choices);
        quickPickOptions.push(figures.tick);
        return vscode_1.window.showQuickPick(quickPickOptions, options)
            .then(function (result) {
            if (result === undefined) {
                throw new EscapeException_1.default();
            }
            if (result !== figures.tick) {
                choices[result].checked = !choices[result].checked;
                return _this.render();
            }
            return _this._question.choices.reduce(function (result, choice) {
                if (choice.checked === true) {
                    result.push(choice.value);
                }
                return result;
            }, []);
        });
    };
    return CheckboxPrompt;
})(prompt_1.default);
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = CheckboxPrompt;
//# sourceMappingURL=checkbox.js.map