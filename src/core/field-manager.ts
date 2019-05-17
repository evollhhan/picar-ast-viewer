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

  update (fileName: string) {
    if (!this.fileList.has(fileName)) {
      this.fileList.add(fileName);
    }
    this.updateProgram();
    this.updateFromSourceFile(fileName);
  }

  private updateProgram () {
    this.program = ts.createProgram(Array.from(this.fileList), this.compileOptions);
  }

  private updateFromSourceFile (fileName: string) {
    const source = this.program.getSourceFile(fileName)!;
    const ast = new AstProvider(this.program.getTypeChecker());
    ast.build(fileName, source);
    delete this.tree[fileName];
    if (ast.list.length) {
      this.tree[fileName] = ast.list;
    }
  }

  editSourceFile (editInfo: Field.EditInfo): Promise<{ result: boolean, fileName?: string }> {
    return new Promise((resolve, reject) => {
      const ast = new AstProvider(this.program.getTypeChecker());
      const fileName = editInfo.pipeNode.env.filePath;
      const source = this.program.getSourceFile(fileName)!;
      ast.startEdit(editInfo);
      ast.build(fileName, source);
      ast.stopEdit();
      if (ast.output) {
        fs.writeFile(fileName, ast.output, err => {
          if (err) {
            return reject(err);
          }
          this.update(fileName);
          resolve({ result: true, fileName });
        });
      } else {
        resolve({ result: false });
      }
    });
  }
}

export default new FieldManager();
