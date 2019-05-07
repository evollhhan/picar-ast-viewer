"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require("vscode");
const field_manager_1 = require("./core/field-manager");
const workspace_1 = require("./core/workspace");
const blackboard_1 = require("./core/blackboard");
// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
function activate(context) {
    console.log('Active Pipe-designer.');
    workspace_1.default.init();
    // init workspace
    workspace_1.default.findAllFiles().then(list => field_manager_1.default.build(list));
    // on save document
    vscode.workspace.onDidSaveTextDocument(function (e) {
        field_manager_1.default.update(e);
        blackboard_1.default.render();
    });
    context.subscriptions.push(vscode.commands.registerCommand('pipedesigner.show', () => {
        blackboard_1.default.createView();
    }));
}
exports.activate = activate;
// this method is called when your extension is deactivated
function deactivate() { }
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map