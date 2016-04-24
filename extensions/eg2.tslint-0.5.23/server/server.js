/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/
'use strict';
var minimatch = require('minimatch');
var server = require('vscode-languageserver');
var fs = require('fs');
var settings = null;
var linter = null;
var tslintNotFound = "Failed to load tslint library. Please install tslint in your workspace\nfolder using 'npm install tslint' or 'npm install -g tslint' and then press Retry.";
// Options passed to tslint
var options = {
    formatter: "json",
    configuration: {},
    rulesDirectory: undefined,
    formattersDirectory: undefined
};
var configFile = null;
var configFileWatcher = null;
var configCache = {
    filePath: null,
    configuration: null,
    isDefaultConfig: false
};
function makeDiagnostic(problem) {
    return {
        severity: server.DiagnosticSeverity.Warning,
        message: problem.failure,
        range: {
            start: {
                line: problem.startPosition.line,
                character: problem.startPosition.character
            },
            end: {
                line: problem.endPosition.line,
                character: problem.endPosition.character
            },
        },
        code: problem.ruleName,
        source: 'tslint'
    };
}
function getConfiguration(filePath, configFileName) {
    if (configCache.configuration && configCache.filePath === filePath) {
        return configCache.configuration;
    }
    var isDefaultConfig = false;
    if (linter.findConfigurationPath) {
        isDefaultConfig = linter.findConfigurationPath(configFileName, filePath) === undefined;
    }
    configCache = {
        filePath: filePath,
        isDefaultConfig: isDefaultConfig,
        configuration: linter.findConfiguration(configFileName, filePath)
    };
    return configCache.configuration;
}
function flushConfigCache() {
    configCache = {
        filePath: null,
        configuration: null,
        isDefaultConfig: false
    };
}
function getErrorMessage(err, document) {
    var errorMessage = "unknown error";
    if (typeof err.message === 'string' || err.message instanceof String) {
        errorMessage = err.message;
    }
    var fsPath = server.Files.uriToFilePath(document.uri);
    var message = "vscode-tslint: '" + errorMessage + "' while validating: " + fsPath + " stacktrace: " + err.stack;
    return message;
}
function showConfigurationFailure(conn, err) {
    var errorMessage = "unknown error";
    if (typeof err.message === 'string' || err.message instanceof String) {
        errorMessage = err.message;
    }
    var message = "vscode-tslint: Cannot read tslint configuration - '" + errorMessage + "'";
    conn.window.showInformationMessage(message);
}
function validateAllTextDocuments(connection, documents) {
    var tracker = new server.ErrorMessageTracker();
    documents.forEach(function (document) {
        try {
            validateTextDocument(connection, document);
        }
        catch (err) {
            tracker.add(getErrorMessage(err, document));
        }
    });
    tracker.sendErrors(connection);
}
function validateTextDocument(connection, document) {
    try {
        var uri = document.uri;
        var diagnostics = doValidate(connection, document);
        connection.sendDiagnostics({ uri: uri, diagnostics: diagnostics });
    }
    catch (err) {
        connection.window.showErrorMessage(getErrorMessage(err, document));
    }
}
var connection = server.createConnection(process.stdin, process.stdout);
var documents = new server.TextDocuments();
documents.listen(connection);
connection.onInitialize(function (params) {
    var rootFolder = params.rootPath;
    return server.Files.resolveModule(rootFolder, 'tslint').
        then(function (value) {
        linter = value;
        var result = { capabilities: { textDocumentSync: documents.syncKind } };
        return result;
    }, function (error) {
        return Promise.reject(new server.ResponseError(99, tslintNotFound, { retry: true }));
    });
});
function doValidate(conn, document) {
    var uri = document.uri;
    var diagnostics = [];
    var fsPath = server.Files.uriToFilePath(uri);
    if (!fsPath) {
        // tslint can only lint files on disk
        return diagnostics;
    }
    if (fileIsExcluded(fsPath)) {
        return diagnostics;
    }
    var contents = document.getText();
    try {
        options.configuration = getConfiguration(fsPath, configFile);
    }
    catch (err) {
        showConfigurationFailure(conn, err);
        return diagnostics;
    }
    if (settings && settings.tslint && settings.tslint.validateWithDefaultConfig === false && configCache.isDefaultConfig) {
        return diagnostics;
    }
    if (configCache.isDefaultConfig && settings.tslint.validateWithDefaultConfig === false) {
        return;
    }
    var result;
    try {
        var tslint = new linter(fsPath, contents, options);
        result = tslint.lint();
    }
    catch (err) {
        // TO DO show an indication in the workbench
        conn.console.error(getErrorMessage(err, document));
        return diagnostics;
    }
    if (result.failureCount > 0) {
        var problems = JSON.parse(result.output);
        problems.forEach(function (each) {
            diagnostics.push(makeDiagnostic(each));
        });
    }
    return diagnostics;
}
function fileIsExcluded(path) {
    function testForExclusionPattern(path, pattern) {
        return minimatch(path, pattern);
    }
    if (settings && settings.tslint) {
        if (settings.tslint.ignoreDefinitionFiles) {
            if (minimatch(path, "**/*.d.ts")) {
                return true;
            }
        }
        if (settings.tslint.exclude) {
            if (Array.isArray(settings.tslint.exclude)) {
                for (var _i = 0, _a = settings.tslint.exclude; _i < _a.length; _i++) {
                    var pattern = _a[_i];
                    if (testForExclusionPattern(path, pattern)) {
                        return true;
                    }
                }
            }
            else if (testForExclusionPattern(path, settings.tslint.exclude)) {
                return true;
            }
        }
    }
}
// A text document has changed. Validate the document.
documents.onDidChangeContent(function (event) {
    // the contents of a text document has changed
    validateTextDocument(connection, event.document);
});
function tslintConfigurationValid() {
    try {
        documents.all().forEach(function (each) {
            var fsPath = server.Files.uriToFilePath(each.uri);
            if (fsPath) {
                getConfiguration(fsPath, configFile);
            }
        });
    }
    catch (err) {
        return false;
    }
    return true;
}
// The VS Code tslint settings have changed. Revalidate all documents.
connection.onDidChangeConfiguration(function (params) {
    flushConfigCache();
    settings = params.settings;
    if (settings.tslint) {
        options.rulesDirectory = settings.tslint.rulesDirectory || null;
        var newConfigFile = settings.tslint.configFile || null;
        if (configFile !== newConfigFile) {
            if (configFileWatcher) {
                configFileWatcher.close();
                configFileWatcher = null;
            }
            if (!fs.existsSync(newConfigFile)) {
                connection.window.showWarningMessage("The file " + newConfigFile + " refered to by 'tslint.configFile' does not exist");
                configFile = null;
                return;
            }
            configFile = newConfigFile;
            if (configFile) {
                configFileWatcher = fs.watch(configFile, { persistent: false }, function (event, fileName) {
                    validateAllTextDocuments(connection, documents.all());
                });
            }
        }
    }
    validateAllTextDocuments(connection, documents.all());
});
// The watched tslint.json has changed. Revalidate all documents, IF the configuration is valid.
connection.onDidChangeWatchedFiles(function (params) {
    // Tslint 3.7 started to load configuration files using 'require' and they are now
    // cached in the node module cache. To ensure that the extension uses
    // the latest configuration file we remove the config file from the module cache.
    params.changes.forEach(function (element) {
        var configFilePath = server.Files.uriToFilePath(element.uri);
        var cached = require.cache[configFilePath];
        if (cached) {
            delete require.cache[configFilePath];
        }
    });
    flushConfigCache();
    if (tslintConfigurationValid()) {
        validateAllTextDocuments(connection, documents.all());
    }
});
connection.listen();
//# sourceMappingURL=server.js.map