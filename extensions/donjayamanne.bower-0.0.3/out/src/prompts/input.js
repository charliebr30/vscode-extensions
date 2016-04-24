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
var InputPrompt = (function (_super) {
    __extends(InputPrompt, _super);
    function InputPrompt(question) {
        _super.call(this, question);
        this._options = {
            prompt: this._question.message
        };
    }
    InputPrompt.prototype.render = function () {
        var _this = this;
        var placeHolder = this._question.default;
        if (this._question.default instanceof Error) {
            placeHolder = this._question.default.message;
            this._question.default = undefined;
        }
        this._options.placeHolder = placeHolder;
        return vscode_1.window.showInputBox(this._options)
            .then(function (result) {
            if (result === undefined) {
                throw new EscapeException_1.default();
            }
            if (result === '') {
                result = _this._question.default || '';
            }
            var valid = _this._question.validate ? _this._question.validate(result || '') : true;
            if (valid !== true) {
                _this._question.default = new Error(figures.warning + " " + valid);
                return _this.render();
            }
            return result;
        });
    };
    return InputPrompt;
})(prompt_1.default);
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = InputPrompt;
//# sourceMappingURL=input.js.map