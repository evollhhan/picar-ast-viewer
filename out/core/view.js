"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
class Blackboard {
    createView() {
        this.view = vscode.window.createWebviewPanel('pipeDesigner', 'Pipe Blackboard', vscode.ViewColumn.One, {
            enableScripts: true
        });
    }
    update() {
        if (!this.view) {
            this.createView();
        }
    }
}
exports.default = new Blackboard();
//# sourceMappingURL=view.js.map