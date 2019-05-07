"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ts = require("typescript");
const PIPE_ALIAS = `'pipe/index'`;
class AstProvider {
    constructor() {
        this.set = [];
        this.env = {
            PIPE: 'pipe',
            FIELD: 'field',
            filePath: ''
        };
    }
    // public program!: ts.Program;
    parse(filePath, node) {
        this.env.filePath = filePath;
        // this.program = ts.createProgram([filePath], {});
        this.createFieldMap(node);
    }
    createFieldMap(node) {
        ts.forEachChild(node, it => {
            switch (it.kind) {
                case ts.SyntaxKind.ImportDeclaration:
                    this.checkPipeReference(it);
                    break;
                case ts.SyntaxKind.ClassDeclaration:
                    const res = this.searchField(it);
                    if (res) {
                        this.searchPipeFromClass(it);
                    }
                    break;
                default: break;
            }
        });
    }
    checkPipeReference(node) {
        if (node.moduleSpecifier.getText() !== PIPE_ALIAS) {
            return;
        }
        ts.forEachChild(node, clause => {
            if (clause.kind === ts.SyntaxKind.ImportClause) {
                ts.forEachChild(clause, target => {
                    const names = target;
                    names.elements.forEach(importName => {
                        const name = importName.name.getText();
                        if (importName.propertyName) {
                            this.env[importName.propertyName.getText().toUpperCase()] = name;
                        }
                        else {
                            this.env[name.toUpperCase()] = name;
                        }
                    });
                });
            }
        });
    }
    searchField(node) {
        if (!node.decorators || !node.decorators.length) {
            return false;
        }
        let flag = false;
        node.decorators.forEach(deco => {
            const decoName = deco.expression.getText();
            if (decoName === this.env.FIELD) {
                if (flag) {
                    // TODO: ERROR
                    throw new Error('Duplicate field error');
                }
                else {
                    flag = true;
                }
            }
        });
        return flag;
    }
    searchPipeFromClass(node) {
        const className = node.name ? node.name.getText() : 'anonymousClass';
        const field = {
            env: this.env,
            className,
            pipes: []
        };
        ts.forEachChild(node, it => {
            switch (it.kind) {
                case ts.SyntaxKind.MethodDeclaration:
                    const res = this.checkPipeDecorator(it);
                    if (res) {
                        res.className = className;
                        field.pipes.push(res);
                    }
                    break;
            }
        });
        if (field.pipes.length) {
            this.set.push(field);
        }
    }
    checkPipeDecorator(node) {
        if (!node.decorators || !node.decorators.length) {
            return;
        }
        const method = node.name.getText();
        const treeNode = {
            method,
            source: [],
            enable: false,
            env: this.env
        };
        node.decorators.forEach(deco => {
            const type = this.getPipeOperator(deco);
            const args = deco.expression.arguments;
            switch (type) {
                case 'pipe':
                    treeNode.enable = true;
                    if (args && args.length) {
                        treeNode.source.push(args[0].text);
                    }
                    break;
                case 'pipe.key':
                    break;
            }
        });
        if (!treeNode.enable) {
            return;
        }
        if (!treeNode.destination) {
            treeNode.destination = treeNode.method;
        }
        return treeNode;
    }
    getPipeOperator(node) {
        let type = '';
        const exp = node.expression.expression;
        if (exp) {
            if (exp.kind === ts.SyntaxKind.Identifier && exp.text === this.env.PIPE) {
                type = this.env.PIPE;
            }
            else if (exp.expression.text === this.env.PIPE
                && exp.kind === ts.SyntaxKind.PropertyAccessExpression
                && exp.name.text) {
                type = this.env.PIPE + '.' + exp.name.text;
            }
        }
        return type;
    }
}
exports.AstProvider = AstProvider;
//# sourceMappingURL=ast-provider.js.map