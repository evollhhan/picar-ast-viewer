"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ts = require("typescript");
const ast_provider_1 = require("./ast-provider");
const fs = require("fs");
class FieldManager {
    constructor() {
        this.tree = Object.create(null);
    }
    build(list) {
        list.forEach(uri => {
            fs.readFile(uri.path, (err, data) => {
                if (err) {
                    console.error('err read file.', err);
                    return;
                }
                const source = ts.createSourceFile(uri.path, data.toString(), ts.ScriptTarget.Latest, true);
                this.updateFromSourceFile(uri.path, source);
            });
        });
    }
    update(doc) {
        const source = ts.createSourceFile(doc.fileName, doc.getText(), ts.ScriptTarget.Latest, true);
        this.updateFromSourceFile(doc.fileName, source);
    }
    updateFromSourceFile(fileName, source) {
        const ast = new ast_provider_1.AstProvider();
        ast.parse(fileName, source);
        delete this.tree[fileName];
        if (ast.set.length) {
            this.tree[fileName] = ast.set;
        }
        console.log('Field Updated:', this.tree);
    }
}
exports.default = new FieldManager();
//# sourceMappingURL=field-manager.js.map