"use strict";
// import { Project } from 'ts-morph';
// import * as vscode from 'vscode';
// export default function example () {
//   const project = new Project();
//   const ast = project.getTypeChecker();
//   const editor = vscode.window.activeTextEditor!;
//   // path
//   const path_export = vscode.workspace.rootPath + '/src-demo/const.ts';
//   const path_import = editor.document.fileName;
//   // add source
//   project.addExistingSourceFile(path_export);
//   project.addExistingSourceFile(path_import);
//   // get source
//   const fileImport = project.getSourceFile(path_import)!.getImportDeclarationOrThrow('src-demo/const');
//   const constImport = fileImport.getNamedImports()[0].getNameNode();
//   const alias = constImport.getSymbolOrThrow().getAliasedSymbolOrThrow();
//   alias.getDeclarations().forEach(node => {
//     console.log(ast.getTypeText(ast.getTypeAtLocation(node)));
//     console.log(node.getText());
//   });
// }
//# sourceMappingURL=example.js.map