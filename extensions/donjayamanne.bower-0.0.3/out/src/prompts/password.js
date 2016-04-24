'use strict';
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var input_1 = require('./input');
var PasswordPrompt = (function (_super) {
    __extends(PasswordPrompt, _super);
    function PasswordPrompt(question) {
        _super.call(this, question);
        this._options.password = true;
    }
    return PasswordPrompt;
})(input_1.default);
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = PasswordPrompt;
//# sourceMappingURL=password.js.map