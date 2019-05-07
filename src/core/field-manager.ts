import * as vscode from 'vscode';
import * as ts from 'typescript';
import { AstProvider } from './ast-provider';
import * as fs from 'fs';

class FieldManager {
  public tree: Field.Map = Object.create(null);
  public program!: ts.Program;

  build (list: vscode.Uri[]) {
    return new Promise(resolve => {
      let resolvedCount = 0;
      const length = list.length;
      list.forEach(uri => {
        fs.readFile(uri.path, (err, data) => {
          if (err) {
            console.error('err read file.', err);
            return;
          }
  
          const source = ts.createSourceFile(uri.path, data.toString(), ts.ScriptTarget.Latest, true);
          this.updateFromSourceFile(uri.path, source);
          resolvedCount += 1;
          if (resolvedCount === length) {
            resolve();
          }
        });
      });
    });
  }

  update (doc: vscode.TextDocument) {
    const source = ts.createSourceFile(doc.fileName, doc.getText(), ts.ScriptTarget.Latest, true);
    this.updateFromSourceFile(doc.fileName, source);
  }

  updateFromSourceFile (fileName: string, source: ts.SourceFile) {
    const ast = new AstProvider(fileName, source);
    delete this.tree[fileName];
    if (ast.list.length) {
      this.tree[fileName] = ast.list;
    }
  }
}

export default new FieldManager();
