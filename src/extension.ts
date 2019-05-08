// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import fieldManager from './core/field-manager';
import workspace from './core/workspace';
import blackboard from './core/blackboard';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	let configFileDetected = false;

	vscode.workspace.findFiles('.pipe.config.json').then(res => {
		if (!res.length || res[0].scheme !== 'file') {
			return;
		}

		console.log('Active Pipe-designer.');

		configFileDetected = true;

		workspace.init();

		// init workspace
		workspace.findAllFiles().then(list => fieldManager.build(list));
		
		// on save document
		vscode.workspace.onDidSaveTextDocument(function (e: vscode.TextDocument) {
			fieldManager.update(e);
			blackboard.render();
		});

	});

	context.subscriptions.push(
		vscode.commands.registerCommand('pipedesigner.show', () => {
			if (configFileDetected) {
				blackboard.createView(context.extensionPath);
			} else {
				vscode.window.showWarningMessage('Please create .pipe.config.json in the project and reopen this workspace.');
			}
		})
	);
}

// this method is called when your extension is deactivated
export function deactivate() {}
