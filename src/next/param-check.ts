import * as ts from 'typescript';

enum TypeKind {
  any = 'any',
  ref = 'ref',
  primitive = 'primitive'
}

interface ISourceFileInterface {
  export: boolean;
}

interface TreeNode {
  param: any;
  return: any;
}

export default class Test {
  checker: ts.TypeChecker;
  env: any = {
    interfaces: [] as ISourceFileInterface[]
  };

  constructor (checker: ts.TypeChecker, source: ts.Node) {
    this.checker = checker;
    this.checkNode(source);
  }

  checkNode (source: ts.Node) {
    ts.forEachChild(source, sn => {
      switch (sn.kind) {
        case ts.SyntaxKind.ClassDeclaration:
          ts.forEachChild(sn, child => {
            if (child.kind === ts.SyntaxKind.MethodDeclaration) {
              this.methodTypeCheck(child as any);
            }
          });
          break;
        case ts.SyntaxKind.InterfaceDeclaration:
          this.addInterface(sn);
          break;
      }
    });
  }

  addInterface (node: ts.Node) {
    const inf: ISourceFileInterface = {
      export: false
    };
    ts.forEachChild(node, sn => {
      switch (sn.kind) {
        case ts.SyntaxKind.ExportKeyword:
          inf.export = true;
          break;
      }
      console.log(sn, sn.getText());
    });
  }

  methodTypeCheck (method: ts.MethodDeclaration) {
    const treeNode: TreeNode = {
      param: null,
      return: null
    };

    // if no param, then param is null
    if (!method.parameters.length) { return; }
    const { type } = method.parameters[0];

    this.checkType(treeNode, type);

    console.log(`

-> Parse Result
`,  JSON.stringify(treeNode, null, 2),
    `
    `);
  }

  checkType (obj: any, type: ts.TypeNode | undefined) {
    if (!type) {
      obj.param = {
        kind: TypeKind.any
      };
      return;
    }

    switch (type.kind) {
      case ts.SyntaxKind.TypeReference:
        obj.param = {
          kind: TypeKind.ref,
          value: type.getText()
        };
        break;
      case ts.SyntaxKind.BooleanKeyword:
      case ts.SyntaxKind.StringKeyword:
      case ts.SyntaxKind.NumberKeyword:
        obj.param = {
          kind: TypeKind.primitive,
          value: type.getText()
        };
        break;
    }
  }
}