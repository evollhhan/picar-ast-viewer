import * as vscode from 'vscode';
import fieldManager from './field-manager';
import workspace from './workspace';
import blackboard from './blackboard';

export default function (context: vscode.ExtensionContext) {
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
