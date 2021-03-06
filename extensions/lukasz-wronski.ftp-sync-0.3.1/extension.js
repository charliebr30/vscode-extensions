// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
var vscode = require('vscode');

global.STATUS_TIMEOUT = 3000;

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
function activate(context) {
	
	var syncHelper, currentConfig;
	var ftpConfig = require('./modules/ftp-config');
	
	var getSyncHelper = function() {
		var oldConfig = currentConfig;
		currentConfig = ftpConfig.getSyncConfig();
		
		if(!syncHelper)
			syncHelper = require('./modules/sync-helper')();
		else if(ftpConfig.connectionChanged(oldConfig)) 
			syncHelper.disconnect();
		
		syncHelper.useConfig(currentConfig)
		
		return syncHelper;
	}
	
	var initCommand = vscode.commands.registerCommand('extension.ftpsyncinit', require('./modules/init-command'));
	var syncCommand = vscode.commands.registerCommand('extension.ftpsyncupload', function() { require('./modules/sync-command')(true, getSyncHelper) });
	var downloadCommand = vscode.commands.registerCommand('extension.ftpsyncdownload', function() { require('./modules/sync-command')(false, getSyncHelper) });
	var commitCommand = vscode.commands.registerCommand('extension.ftpsynccommit', function() { require('./modules/commit-command')(getSyncHelper) });
	
	var onSave = require('./modules/on-save');
	vscode.workspace.onDidSaveTextDocument(function(file) {
		onSave(file, getSyncHelper);
	});
	
	
	context.subscriptions.push(initCommand);
	context.subscriptions.push(syncCommand);
	context.subscriptions.push(downloadCommand);
	context.subscriptions.push(commitCommand);
}

exports.activate = activate;