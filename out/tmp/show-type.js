"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ts = require("typescript");
function showType(program, node) {
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
exports.default = showType;
//# sourceMappingURL=show-type.js.map