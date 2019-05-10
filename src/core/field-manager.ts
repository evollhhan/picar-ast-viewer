import * as vscode from 'vscode';
import * as ts from 'typescript';
import { AstProvider } from './ast-provider';
import * as fs from 'fs';

class FieldManager {
  public tree: Field.Map = Object.create(null);
  public fileList: Set<string> = new Set();
  public program!: ts.Program;
  public compileOptions: ts.CompilerOptions = {
    target: ts.ScriptTarget.Latest
  };

  build (list: vscode.Uri[]) {
    list.forEach(file => this.fileList.add(file.path));
    this.updateProgram();
    this.fileList.forEach(fileName => {
      this.updateFromSourceFile(fileName);
    });
  }

  update (doc: vscode.TextDocument) {
    if (!this.fileList.has(doc.fileName)) {
      this.fileList.add(doc.fileName);
    }
    this.updateProgram();
    this.updateFromSourceFile(doc.fileName);
  }

  updateProgram () {
    this.program = ts.createProgram(Array.from(this.fileList), this.compileOptions);
  }

  updateFromSourceFile (fileName: string) {
    const source = this.program.getSourceFile(fileName)!;
    const ast = new AstProvider(fileName, source, this.program.getTypeChecker());
    delete this.tree[fileName];
    if (ast.list.length) {
      this.tree[fileName] = ast.list;
    }
  }
}

export default new FieldManager();
