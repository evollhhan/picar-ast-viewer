import * as ts from 'typescript';

export default function showType (program: ts.Program, node: ts.Node): void {
  ts.forEachChild(node, sn => {
    const checker = program.getTypeChecker();
    const str = checker.typeToString(checker.getTypeAtLocation(sn));
    // if (sn.kind === ts.SyntaxKind.PropertyAccessExpression) {
    //   // console.log(checker.getTypeAtLocation(sn));
    //   debugger;
    // }
    console.log(`

kind: ${ts.SyntaxKind[sn.kind]},
text: ${sn.getText()}
type: ${str}

    `);
    showType(program, sn);
  });
}
