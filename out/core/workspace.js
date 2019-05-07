"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const path = require("path");
const vscode = require("vscode");
const ts = require("typescript");
class Workspace {
    constructor() {
        this.root = '';
        this.config = null;
        this.include = [];
        this.files = [];
    }
    init() {
        this.root = vscode.workspace.rootPath || '';
        this.setConfig();
    }
    setConfig() {
        const url = path.resolve(this.root, 'tsconfig.json');
        const { config, error } = ts.readConfigFile(url, path => {
            return fs.readFileSync(path).toString();
        });
        if (error) {
            throw error;
        }
        this.config = config;
        if (!this.config.include) {
            this.include.push('src/**/*.ts');
        }
        else {
            this.config.include.forEach((path) => {
                this.include.push(this.resolveIncludePath(path));
            });
        }
    }
    resolveIncludePath(path) {
        if (path.indexOf('./') === 0) {
            path = path.substr(2, path.length);
        }
        if (path.lastIndexOf('.ts') !== (path.length - 3)) {
            path += '.ts';
        }
        return path;
    }
    findAllFiles() {
        return new Promise(resolve => {
            let res = [];
            let resolvedDir = 0;
            const length = this.include.length;
            this.include.forEach(path => {
                vscode.workspace.findFiles(path).then(list => {
                    res = res.concat(list);
                    resolvedDir += 1;
                    if (resolvedDir === length) {
                        this.files = res;
                        resolve(res);
                    }
                });
            });
        });
    }
}
exports.default = new Workspace();
//# sourceMappingURL=workspace.js.map