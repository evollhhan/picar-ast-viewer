import * as vscode from 'vscode';
import * as ts from 'typescript';
// import { writeFile } from 'fs';
// import showType from './show-type';
// import Test from './param-check';

export default function example () {
  const editor = vscode.window.activeTextEditor!;
  const { fileName } = editor.document;
  const prog = ts.createProgram([fileName], {
    removeComments: false
  });
  const source = prog.getSourceFile(fileName)!;
  const checker = prog.getTypeChecker();
}
