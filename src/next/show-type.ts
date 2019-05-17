import * as ts from 'typescript';

export default function showType (checker: ts.TypeChecker, node: ts.Node): void {
  ts.forEachChild(node, sn => {
    const str = checker.typeToString(checker.getTypeAtLocation(sn));
    console.log(`

KIND -> ${ts.SyntaxKind[sn.kind]},
TYPE -> ${str}
TEXT -> ${sn.getText()}

    `);
    showType(checker, sn);
  });
}
