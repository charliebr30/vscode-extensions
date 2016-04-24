"use strict";
var vscode_languageserver_1 = require("vscode-languageserver");
var child_process_1 = require("child_process");
var connection = vscode_languageserver_1.createConnection(process.stdin, process.stdout);
var lib = null;
var settings = null;
var options = null;
var documents = new vscode_languageserver_1.TextDocuments();
var ready = false;
function getDebugString(extra) {
    return [settings.machine, settings.container, settings.command, settings.regexp, extra].join(" | ");
}
;
function getDebugDiagnostic(message) {
    return {
        range: {
            start: { line: 0, character: 0 },
            end: { line: 0, character: Number.MAX_VALUE },
        },
        severity: vscode_languageserver_1.DiagnosticSeverity.Information,
        message: message
    };
}
function getDiagnostic(match) {
    var line = parseInt(match[settings.line], 10) - 1;
    var start = 0;
    var end = Number.MAX_VALUE;
    if (settings.column) {
        start = end = parseInt(match[settings.column], 10) - 1;
    }
    var severity = vscode_languageserver_1.DiagnosticSeverity.Error;
    if (settings.severity) {
        var tmp = settings.severity;
        if (typeof tmp === "number") {
            tmp = match[Number(tmp)];
        }
        switch (tmp) {
            case "warning":
                severity = vscode_languageserver_1.DiagnosticSeverity.Warning;
                break;
            case "info":
                severity = vscode_languageserver_1.DiagnosticSeverity.Information;
                break;
        }
    }
    var diagnostic = {
        range: {
            start: { line: line, character: start },
            end: { line: line, character: end }
        },
        severity: severity,
        message: match[settings.message]
    };
    if (settings.code) {
        diagnostic.code = match[settings.code];
    }
    return diagnostic;
}
;
function parseBuffer(buffer) {
    var result = [];
    var lines = buffer.toString().split("\n");
    var problemRegex = new RegExp(settings.regexp, "m");
    lines.forEach(function (line) {
        var match = line.match(problemRegex);
        if (match) {
            result.push(getDiagnostic(match));
        }
    });
    return result;
}
;
function isInteger(value) {
    return isFinite(value) && Math.floor(value) === value;
}
function checkDockerVersion() {
    return new Promise(function (resolve, reject) {
        child_process_1.exec("docker -v", function (error, stdout, stderr) {
            if (error) {
                var errString = "Could not find docker: '" + stderr.toString() + "'";
                reject(new vscode_languageserver_1.ResponseError(99, errString, { retry: true }));
            }
            resolve({ capabilities: { textDocumentSync: documents.syncKind } });
        });
    });
}
function setMachineEnv(machine) {
    return new Promise(function (resolve, reject) {
        if (machine.length === 0) {
            resolve(machine);
        }
        else {
            child_process_1.exec("docker-machine env " + machine + " --shell bash", function (error, stdout, stderr) {
                if (error) {
                    var errString = stderr.toString();
                    connection.window.showErrorMessage("Could not get docker-machine environment: '" + errString + "'");
                    reject(machine);
                }
                var out = stdout.toString();
                var envRegex = /export (.+)="(.+)"\n/g;
                var match;
                while (match = envRegex.exec(out)) {
                    process.env[match[1]] = match[2];
                }
                resolve(machine);
            });
        }
    });
}
documents.listen(connection);
documents.onDidChangeContent(function (event) {
    validateSingle(event.document);
});
connection.onInitialize(function (params) {
    return checkDockerVersion();
});
var isValidating = {};
var needsValidating = {};
function validate(document) {
    var uri = document.uri;
    // //connection.console.log(`Wants to validate ${uri}`);
    if (!ready || isValidating[uri]) {
        needsValidating[uri] = document;
        return;
    }
    ;
    isValidating[uri] = true;
    var child = child_process_1.spawn("docker", ("exec -i " + settings.container + " " + settings.command).split(" "));
    child.stdin.write(document.getText());
    child.stdin.end();
    var diagnostics = [];
    var debugString = "";
    child.stderr.on("data", function (data) {
        debugString += data.toString();
        diagnostics = diagnostics.concat(parseBuffer(data));
    });
    child.stdout.on("data", function (data) {
        debugString += data.toString();
        diagnostics = diagnostics.concat(parseBuffer(data));
    });
    child.on("close", function (code) {
        if (debugString.match(/^Error response from daemon/)) {
            connection.window.showErrorMessage("Is your container running? Error: " + debugString);
        }
        else if (debugString.match(/^An error occurred trying to connect/)) {
            connection.window.showErrorMessage("Is your machine correctly configured? Error: " + debugString);
        }
        else {
            //connection.console.log(code + " | " + getDebugString(debugString));
            connection.sendDiagnostics({ uri: uri, diagnostics: diagnostics });
        }
        isValidating[uri] = false;
        var revalidateDocument = needsValidating[uri];
        if (revalidateDocument) {
            //connection.console.log(`Revalidating ${uri}`);
            delete needsValidating[uri];
            validate(revalidateDocument);
        }
        else {
        }
    });
}
function getMessage(err, document) {
    var result = null;
    if (typeof err.message === "string" || err.message instanceof String) {
        result = err.message;
        result = result.replace(/\r?\n/g, " ");
        if (/^CLI: /.test(result)) {
            result = result.substr(5);
        }
    }
    else {
        result = "An unknown error occured while validating file: " + vscode_languageserver_1.Files.uriToFilePath(document.uri);
    }
    return result;
}
function validateSingle(document) {
    try {
        validate(document);
    }
    catch (err) {
        connection.window.showErrorMessage(getMessage(err, document));
    }
}
function validateMany(documents) {
    var tracker = new vscode_languageserver_1.ErrorMessageTracker();
    documents.forEach(function (document) {
        try {
            validate(document);
        }
        catch (err) {
            tracker.add(getMessage(err, document));
        }
    });
    tracker.sendErrors(connection);
}
var linters = ["perl", "perlcritic", "flake8", "rubocop"];
connection.onDidChangeConfiguration(function (params) {
    var dockerLinterSettings = params.settings["docker-linter"];
    linters.forEach(function (linter) {
        if (dockerLinterSettings[linter]) {
            settings = dockerLinterSettings[linter];
        }
        ;
    });
    setMachineEnv(settings.machine)
        .then(function (response) {
        ready = true;
        validateMany(documents.all());
    });
});
connection.onDidChangeWatchedFiles(function (params) {
    validateMany(documents.all());
});
connection.listen();
//# sourceMappingURL=server.js.map