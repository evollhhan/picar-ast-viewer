import * as ts from 'typescript';

const PIPE_ALIAS = `'pipe/index'`;

export class AstProvider {
  public list: Field.PipeModule[] = [];
  public sourceFile: ts.SourceFile;
  public env: Field.Env = {
    PIPE: 'pipe',
    FIELD: 'field',
    filePath: ''
  };

  constructor (filePath: string, sourceFile: ts.SourceFile) {
    this.sourceFile = sourceFile;
    this.env.filePath = filePath;
    this.createFieldMap(sourceFile);
  }

  private createFieldMap (node: ts.Node) {
    ts.forEachChild(node, it => {
      switch (it.kind) {
        case ts.SyntaxKind.ImportDeclaration:
          this.checkPipeReference(it as ts.ImportDeclaration);
          break;
        case ts.SyntaxKind.ClassDeclaration:
          const res = this.searchField(it as ts.ClassDeclaration);
          if (res) {
            this.searchPipeFromClass(it as ts.ClassDeclaration);
          }
          break;
        default: break;
      }
    });
  }

  private checkPipeReference (node: ts.ImportDeclaration) {
    if ((node as ts.ImportDeclaration).moduleSpecifier.getText() !== PIPE_ALIAS) {
      return;
    }
  
    ts.forEachChild(node, clause => {
      if (clause.kind === ts.SyntaxKind.ImportClause) {
        ts.forEachChild(clause, target => {
          const names = target as ts.NamedImports;
          names.elements.forEach(importName => {
            const name = importName.name.getText();
            if (importName.propertyName) {
              this.env[importName.propertyName.getText().toUpperCase()] = name;
            } else {
              this.env[name.toUpperCase()] = name;
            }
          });
        });
      }
    });
  }

  private searchField (node: ts.ClassDeclaration): boolean {
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
        } else {
          flag = true;
        }
      }
    });
    return flag;
  }

  private searchPipeFromClass (node: ts.ClassDeclaration) {
    const className = node.name ? node.name.getText() : 'anonymousClass';
    const field: Field.PipeModule = {
      env: this.env,
      className,
      pipes: []
    };
    ts.forEachChild(node, it => {
      switch (it.kind) {
        case ts.SyntaxKind.MethodDeclaration:
          const res = this.checkPipeDecorator(it as ts.MethodDeclaration);
          if (res) {
            res.className = className;
            field.pipes.push(res);
          }
          break;
      }
    });
    if (field.pipes.length) {
      this.list.push(field);
    }
  }

  private checkPipeDecorator (node: ts.MethodDeclaration): Field.PipeNode | undefined {
    if (!node.decorators || !node.decorators.length) {
      return;
    }

    const { line, character } = this.sourceFile.getLineAndCharacterOfPosition(node.getStart());
    const method = node.name.getText();
    const treeNode: Field.PipeNode = {
      method,
      source: [],
      enable: false,
      env: this.env,
      location: {
        line: line + node.decorators.length,
        character: character,
        range: method.length
      }
    };
    
    node.decorators.forEach(deco => {
      const type = this.getPipeOperator(deco);
      const args = (deco as any).expression.arguments;
      switch (type) {
        case 'pipe':
          treeNode.enable = true;
          const text = this.getPipeArgumentText(args);
          if (text) { treeNode.source.push(text); }
          break;
        case 'pipe.key':
          treeNode.key = this.getPipeArgumentText(args);
          break;
        case 'pipe.destination':
          treeNode.destination = this.getPipeArgumentText(args);
          break;
        case 'pipe.worker':
          treeNode.enableWorker = true;
          break;
        case 'pipe.lazy':
          if (args && args.length && args[0].kind === ts.SyntaxKind.TrueKeyword) {
            treeNode.lazy = true;
          }
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

  private getPipeArgumentText (argv: any[]) {
    if (argv && argv.length) {
      return argv[0].text;
    }
  }

  private getPipeOperator (node: ts.Decorator): string {
    let type = '';
    const exp = (node as any).expression.expression;
    if (exp) {
      if (exp.kind === ts.SyntaxKind.Identifier && exp.text === this.env.PIPE) {
        type = this.env.PIPE;
      } else if (
        exp.expression.text === this.env.PIPE
        && exp.kind === ts.SyntaxKind.PropertyAccessExpression
        && exp.name.text
      ) {
        type = this.env.PIPE + '.' + exp.name.text;
      }
    }
    return type;
  }
}