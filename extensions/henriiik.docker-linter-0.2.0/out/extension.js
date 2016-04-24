"use strict";
var path = require("path");
var vscode_languageclient_1 = require("vscode-languageclient");
var linters = [
    {
        name: "perl",
        language: "perl"
    }, {
        name: "perlcritic",
        language: "perl"
    }, {
        name: "flake8",
        language: "python"
    }, {
        name: "rubocop",
        language: "ruby"
    }
];
function activate(context) {
    linters.forEach(function (linter) {
        // We need to go one level up since an extension compile the js code into
        // the output folder.
        var serverModule = path.join(__dirname, "..", "server", "server.js");
        var debugOptions = { execArgv: ["--nolazy", "--debug=6004"] };
        var serverOptions = {
            run: { module: serverModule },
            debug: { module: serverModule, options: debugOptions }
        };
        var clientOptions = {
            documentSelector: [linter.language],
            synchronize: {
                configurationSection: "docker-linter." + linter.name
            }
        };
        var client = new vscode_languageclient_1.LanguageClient("Docker Linter: " + linter.name, serverOptions, clientOptions);
        context.subscriptions.push(new vscode_languageclient_1.SettingMonitor(client, "docker-linter." + linter.name + ".enable").start());
    });
}
exports.activate = activate;
//# sourceMappingURL=extension.js.map