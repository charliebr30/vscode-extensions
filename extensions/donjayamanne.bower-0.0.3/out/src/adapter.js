'use strict';
var vscode_1 = require('vscode');
var util = require('util');
var factory_1 = require('./prompts/factory');
var EscapeException_1 = require('./utils/EscapeException');
var CodeAdapter = (function () {
    function CodeAdapter() {
        this.outBuffer = '';
        this.messageLevelFormatters = {};
        var self = this;
        this.messageLevelFormatters["conflict"] = this.formatConflict;
        this.messageLevelFormatters["info"] = this.formatInfo;
        this.messageLevelFormatters["action"] = this.formatAction;
        this.outChannel = vscode_1.window.createOutputChannel('Bower');
        this.outChannel.clear();
    }
    CodeAdapter.prototype.logError = function (message) {
        var line = "error: " + message.message + "\n    Code - " + message.code;
        this.outBuffer += line + "\n";
        this.outChannel.appendLine(line);
    };
    CodeAdapter.prototype.formatInfo = function (message) {
        var prefix = message.level + ": (" + message.id + ") ";
        if (message.id === "json") {
            var jsonString = JSON.stringify(message.data, null, 4);
            return "" + prefix + message.message + "\n" + jsonString;
        }
        else {
            return "" + prefix + message.message;
        }
    };
    CodeAdapter.prototype.formatAction = function (message) {
        var prefix = "info: " + message.level + ": (" + message.id + ") ";
        return "" + prefix + message.message;
    };
    CodeAdapter.prototype.formatMessage = function (message) {
        var prefix = message.level + ": (" + message.id + ") ";
        return "" + prefix + message.message;
    };
    CodeAdapter.prototype.formatConflict = function (message) {
        var msg = message.message + ':\n';
        var picks = message.data.picks;
        var pickCount = 1;
        picks.forEach(function (pick) {
            var pickMessage = (pickCount++).toString() + "). " + pick.endpoint.name + "#" + pick.endpoint.target;
            if (pick.pkgMeta._resolution && pick.pkgMeta._resolution.tag) {
                pickMessage += " which resolved to " + pick.pkgMeta._resolution.tag;
            }
            if (Array.isArray(pick.dependants) && pick.dependants.length > 0) {
                pickMessage += " and is required by ";
                pick.dependants.forEach(function (dep) {
                    pickMessage += " " + dep.endpoint.name + "#" + dep.endpoint.target;
                });
            }
            msg += "    " + pickMessage + "\n";
        });
        var prefix = (message.id === "solved" ? "info" : "warn") + (": " + message.level + ": (" + message.id + ") ");
        return prefix + msg;
    };
    CodeAdapter.prototype.log = function (message) {
        var line = "";
        if (message && typeof (message.level) === "string") {
            var formatter = this.formatMessage;
            if (this.messageLevelFormatters[message.level]) {
                formatter = this.messageLevelFormatters[message.level];
            }
            line = formatter(message);
        }
        else {
            line = util.format(arguments);
        }
        this.outBuffer += line + "\n";
        this.outChannel.appendLine(line);
    };
    CodeAdapter.prototype.clearLog = function () {
        this.outChannel.clear();
    };
    CodeAdapter.prototype.showLog = function () {
        this.outChannel.show();
    };
    CodeAdapter.prototype.fixQuestion = function (question) {
        if (question.type === "checkbox" && Array.isArray(question.choices)) {
            //For some reason when there's a choice of checkboxes, they aren't formatted properly
            //Not sure where the issue is
            question.choices = question.choices.map(function (item) {
                if (typeof (item) === "string") {
                    return { checked: false, name: item, value: item };
                }
                else {
                    return item;
                }
            });
        }
    };
    CodeAdapter.prototype.prompt = function (questions, callback) {
        var _this = this;
        var answers = {};
        var promise = questions.reduce(function (promise, question) {
            _this.fixQuestion(question);
            return promise.then(function () {
                return factory_1.default.createPrompt(question);
            }).then(function (prompt) {
                if (!question.when || question.when(answers) === true) {
                    return prompt.render().then(function (result) { return answers[question.name] = question.filter ? question.filter(result) : result; });
                }
            });
        }, Promise.resolve());
        promise
            .then(function () {
            _this.outChannel.clear();
            _this.outChannel.append(_this.outBuffer);
            callback(answers);
        })
            .catch(function (err) {
            if (err instanceof EscapeException_1.default) {
                return;
            }
            vscode_1.window.showErrorMessage(err.message);
        });
    };
    return CodeAdapter;
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = CodeAdapter;
//# sourceMappingURL=adapter.js.map