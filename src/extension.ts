// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import fieldManager from './core/field-manager';
import workspace from './core/workspace';
import blackboard from './core/blackboard';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	console.log('Active Pipe-designer.');

	workspace.init();

	// init workspace
	workspace.findAllFiles().then(list => fieldManager.build(list));
	
	// on save document
	vscode.workspace.onDidSaveTextDocument(function (e: vscode.TextDocument) {
		fieldManager.update(e);
		blackboard.render();
	});

	context.subscriptions.push(
		vscode.commands.registerCommand('pipedesigner.show', () => {
			blackboard.createView();
		})
	);
}

// this method is called when your extension is deactivated
export function deactivate() {}
