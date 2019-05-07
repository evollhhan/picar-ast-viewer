"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const fs_1 = require("fs");
const path_1 = require("path");
const workspace_1 = require("./workspace");
const field_manager_1 = require("./field-manager");
class Blackboard {
    constructor() {
        this.panel = null;
    }
    createView() {
        if (this.panel) {
            const columnToShow = vscode.window.activeTextEditor ? vscode.window.activeTextEditor.viewColumn : undefined;
            this.panel.reveal(columnToShow);
            return;
        }
        this.panel = vscode.window.createWebviewPanel('pipeDesigner', 'Pipe Designer', vscode.ViewColumn.One, {
            enableScripts: true,
            retainContextWhenHidden: true
        });
        this.panel.onDidDispose(() => {
            this.panel = null;
        });
        this.panel.webview.onDidReceiveMessage(message => {
            switch (message.event) {
                case 'viewInitReady':
                    this.render();
                    break;
                case 'jumpLocation':
                    const { location, env } = message.data;
                    const file = workspace_1.default.files.filter(uri => uri.path === env.filePath);
                    if (file.length) {
                        vscode.window.showTextDocument(file[0], {
                            selection: new vscode.Range(new vscode.Position(location.line, location.character), new vscode.Position(location.line, location.character + location.range))
                        });
                    }
                    break;
                case 'forceUpdate':
                    workspace_1.default.findAllFiles()
                        .then(list => {
                        return field_manager_1.default.build(list);
                    }).then(() => this.render());
                    break;
            }
        });
        this.panel.onDidChangeViewState(evt => {
            if (evt.webviewPanel.visible) {
                this.render();
            }
        });
        fs_1.readFile(path_1.resolve(__dirname, '../../view/index.html'), (err, data) => {
            if (err) {
                console.log('Get html Error');
                return;
            }
            if (this.panel) {
                this.panel.webview.html = data.toString();
            }
        });
    }
    render(data) {
        if (!this.panel) {
            return;
        }
        this.panel.webview.postMessage({
            command: 'updateFlowData',
            data: data || field_manager_1.default.tree
        });
    }
}
exports.default = new Blackboard();
//# sourceMappingURL=blackboard.js.map