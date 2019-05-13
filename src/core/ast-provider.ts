import * as ts from 'typescript';

const PIPE_ALIAS = `'pipe/index'`;

export class AstProvider {
  public list: Field.PipeModule[] = [];
  public sourceFile: ts.SourceFile;
  public checker: ts.TypeChecker;
  public env: Field.Env = {
    PIPE: 'pipe',
    FIELD: 'field',
    filePath: ''
  };

  constructor (filePath: string, sourceFile: ts.SourceFile, checker: ts.TypeChecker) {
    this.checker = checker;
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
      pipes: [],
    };
    Object.assign(field, this.getFieldOrMethodInfo(node));
    ts.forEachChild(node, it => {
      switch (it.kind) {
        case ts.SyntaxKind.MethodDeclaration:
          const res = this.checkPipeDecorator(it as ts.MethodDeclaration);
          if (res) {
            const { kind, desc } = this.getFieldOrMethodInfo(it);
            res.className = className;
            res.kind =  kind || field.kind;
            res.desc = desc;
            field.pipes.push(res);
          }
          break;
      }
    });
    if (field.pipes.length) {
      this.list.push(field);
    }
  }

  private getFieldOrMethodInfo (node: ts.Node): { kind: string, desc: string } {
    const res = { kind: '', desc: '' }; 
    ts.getJSDocTags(node).forEach(sn => {
      const text = sn.tagName.getText();
      if (text === 'as') {
        res.kind = sn.comment || '';
      } else if (text === 'description') {
        res.desc = sn.comment || '';
      }
    });
    return res;
  }

	private checkPipeDecorator (node: ts.MethodDeclaration): Field.PipeNode | undefined {
		if (!node.decorators || !node.decorators.length) {
			// TODO: 没有装饰器或者装饰器不是pipe的method也应该展示
			return;
    }

    const length = node.decorators.length;    
		const method = node.name.getText();
    const { line, character } = this.sourceFile.getLineAndCharacterOfPosition(node.getStart());
    const treeNode: Field.PipeNode = {
      method,
      source: [],
      enable: false,
      env: this.env,
      location: {
        line: line,
        character: character,
        range: method.length
      }
    };
    
		
		node.decorators.forEach(deco => {
			// check pipe decorator
			if (this.getPipeOperator(deco)) {
				const exp = deco.expression as ts.CallExpression;
				const args = exp.arguments;
				const length = args.length;
				this.parseArguments(treeNode, args[0]);
				if (length > 1) {
					treeNode.destination = this.getValueText(args[1]);
				}
				if (!treeNode.destination) {
					treeNode.destination = treeNode.method;
				}
			}
    });

    const lastDeco = node.decorators[length - 1];
    const { line: lastLine } = this.sourceFile.getLineAndCharacterOfPosition(lastDeco.getEnd());
    treeNode.location.line = lastLine + 1;

		return treeNode;
	}

	private parseArguments (treeNode: Field.PipeNode, arg: ts.Node) {
		const type = this.checker.getTypeAtLocation(arg);
		// 1. @pipe('test')
		// 2. var test = 'test'
		// 		@pipe(test)
		if (
      (type.flags === ts.TypeFlags.StringLiteral) ||
      (type.flags === ts.TypeFlags.String)
    ) {
			treeNode.source.push(this.getValueText(arg));
    }
		// 1. var test = { WORD: 'test' }
		// 		@pipe(test)
		// 2. @pipe({ test: 'test' })
		else if (type.flags === ts.TypeFlags.Object) {
			this.parseObjectArgument(
				treeNode,
				(type as ts.ObjectType).getProperties()
			);
		}
	}

	private parseObjectArgument (treeNode: Field.PipeNode, properties: ts.Symbol[]) {
		properties.forEach(prop => {
			const valueObject = (prop.valueDeclaration as ts.PropertyAssignment).initializer;
			switch (prop.name) {
				case 'prev':
					if (ts.isArrayLiteralExpression(valueObject)) {
						valueObject.elements.forEach(ele => {
							treeNode.source.push(this.getValueText(ele));
						});
					} else {
						treeNode.source.push(this.getValueText(valueObject));
					}
					break;
				case 'next':
					treeNode.destination = this.getValueText(valueObject);
					break;
				case 'key':
					treeNode.key = this.getValueText(valueObject);
					break;
				case 'worker':
					treeNode.enableWorker = this.getBoolean(valueObject);
					break;
				case 'lazy':
					treeNode.lazy = this.getBoolean(valueObject);
					break;
			}
		});
	}

	private getValueText (node: ts.Node): string {
		if (node.kind === ts.SyntaxKind.StringLiteral) {
			return (node as ts.StringLiteral).text;
		} else {
			const str = this.checker.typeToString(this.checker.getTypeAtLocation(node));
			if (str === 'string') {
				return node.getText();
			} else {
				return str.substr(1, str.length - 2);
			}
		}
	}

	private getBoolean (node: ts.Node): boolean {
		if (node.kind === ts.SyntaxKind.TrueKeyword) {
			return true;
		}
		else if (node.kind === ts.SyntaxKind.FalseKeyword) {
			return false;
		}
		else {
			return this.checker.typeToString(this.checker.getTypeAtLocation(node)) === 'true';
		}
	}

  private getPipeOperator (node: ts.Decorator): string | undefined {
		let type = '';
		if (node.expression.kind !== ts.SyntaxKind.CallExpression) {
			return;
		}
    const exp = (node as any).expression.expression;
		if (exp.kind === ts.SyntaxKind.Identifier && exp.text === this.env.PIPE) {
			type = this.env.PIPE;
		}
		// get operator like pipe.method
		// ----
		// if (
		//   exp.expression.text === this.env.PIPE
		//   && exp.kind === ts.SyntaxKind.PropertyAccessExpression
		//   && exp.name.text
		// ) {
		//   type = this.env.PIPE + '.' + exp.name.text;
		// }
    return type;
  }
}