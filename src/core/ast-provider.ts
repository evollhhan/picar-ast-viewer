import * as ts from 'typescript';

const PIPE_ALIAS = `'pipe/index'`;

export class AstProvider {
  private sourceFile: ts.SourceFile | null = null;
  private checker: ts.TypeChecker;
  private editorMode: boolean = false;
  private editInfo!: Field.EditInfo;
  private status: 'build' | 'done' | 'ready' = 'ready';
  public output: string | undefined = '';
  public list: Field.PipeModule[] = [];
  public env: Field.Env = {
    PIPE: 'pipe',
    FIELD: 'field',
    filePath: ''
  };

  constructor (checker: ts.TypeChecker) {
    this.checker = checker;
  }

  build (filePath: string, sourceFile: ts.SourceFile) {
    this.sourceFile = sourceFile;
    this.env.filePath = filePath;
    this.status = 'build';
    ts.forEachChild(this.sourceFile, it => {
      if (this.status === 'done') {
        return;
      }

      switch (it.kind) {
        case ts.SyntaxKind.ImportDeclaration:
          this.checkPipeReference(it as ts.ImportDeclaration);
          break;
        case ts.SyntaxKind.ClassDeclaration:
          // TODO 是否要处理未加Field标签的类
          if (this.editorMode) {
            this.editTargetNode(it);
          } else {
            if (this.searchTargetDecorator(it as ts.ClassDeclaration, this.env.FIELD)) {
              this.searchPipeFromClass(it as ts.ClassDeclaration);
            }
          }
          break;
        default: break;
      }
    });
  }

  done (output?: string) {
    this.status = 'done';
    this.output = output;
  }

  startEdit (editInfo: Field.EditInfo) {
    this.editorMode = true;
    this.editInfo = editInfo;
  }

  stopEdit () {
    this.editorMode = false;
  }

  private editTargetNode (node: ts.Node) {
    ts.forEachChild(node, sn => {
      if (sn.kind === ts.SyntaxKind.MethodDeclaration) {
        this.editFieldMethod(sn as ts.MethodDeclaration);
      }
    });
  }

  private editFieldMethod (met: ts.MethodDeclaration) {
    if (met.name.getText() !== this.editInfo.pipeNode.method) {
      return;
    }
    const transformer = this.createDecoratorTransformer();
    const res = ts.transform(met, [ transformer ]);
    const transformedMethod = res.transformed[0];
    const source = this.sourceFile!;
    if (transformedMethod) {
      const printer = ts.createPrinter();
      const outputCode = printer.printNode(ts.EmitHint.Unspecified, transformedMethod, source);
      const oldsrc = source.getFullText();
      const startPos = met.getFullStart() + 1;
      const newsrc = oldsrc.substr(0, startPos) + outputCode + oldsrc.substr(startPos + met.getFullText().length, oldsrc.length);
      this.done(newsrc);
    }
  }

  private createDecoratorTransformer () {
    const { action, pipeNode } = this.editInfo;
    const self = this;
    return function transformer (ctx: ts.TransformationContext): ts.Transformer<ts.Node> {
      const visitor: ts.Visitor = (node: ts.Node): ts.Node => {
        // TODO: check exist decorator
        // TODO: 需要注意的是，目前装饰器的顺序是被添加在最后
        const filterDecoArray: ts.Decorator[] = [];
        if (node.decorators) {
          node.decorators.forEach(deco => {
            if (
              deco.expression.kind === ts.SyntaxKind.CallExpression &&
              (deco.expression as ts.CallExpression).expression.getText() !== self.env.PIPE
            ) {
              filterDecoArray.push(deco);
            }
          });
        }
        if (action === 'modify') {
          filterDecoArray.push(
            self.createPipeDecorator(pipeNode)
          );
        }
        node.decorators = ts.createNodeArray(filterDecoArray);
        return node;
      };
    
      return (node: ts.Node) => {
        return ts.visitNode(node, visitor);
      };
    };
  }

  private createStringOrIndentifierProperty (text: string): ts.Expression {
    if (!text) {
      return ts.createNull();
    }
  
    if (/'.+'/g.test(text)) {
      const str = ts.createStringLiteral(text.substr(1, text.length - 2));
      (str as any).singleQuote = true;
      return str;
    } else {
      return ts.createIdentifier(text);
    }
  }
  
  private createPipeDecorator (pipe: Field.PipeNode) {
    const properties: ts.ObjectLiteralElementLike[] = [];
    if (pipe.source) {
      const srcArray: ts.Expression[] = [];
      pipe.source.forEach(src => {
        srcArray.push(this.createStringOrIndentifierProperty(src));
      });
      properties.push(
        ts.createPropertyAssignment('prev', ts.createArrayLiteral(srcArray))
      );
    }
    if (pipe.destination) {
      properties.push(
        ts.createPropertyAssignment('next', this.createStringOrIndentifierProperty(pipe.destination))
      );
    }
    if (pipe.key) {
      properties.push(
        ts.createPropertyAssignment('key', this.createStringOrIndentifierProperty(pipe.key))
      );
    }
    if (pipe.enableWorker) {
      properties.push(
        ts.createPropertyAssignment('worker', ts.createTrue())
      );
    }
    if (pipe.lazy) {
      properties.push(
        ts.createPropertyAssignment('lazy', ts.createTrue())
      );
    }
    return ts.createDecorator(
      ts.createCall(
        ts.createIdentifier(this.env.PIPE),
        [],
        [ts.createObjectLiteral(properties, true)]
      )
    );
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

  private searchTargetDecorator (node: ts.Node, flag: string): ts.Decorator | undefined {
    return node.decorators && node.decorators.find(deco => {
      return deco.expression.getText() === flag;
    });
  }

  private searchPipeFromClass (node: ts.ClassDeclaration) {
    const className = node.name ? node.name.getText() : 'anonymousClass';
    const field: Field.PipeModule = {
      env: this.env,
      className,
      pipes: [],
      methods: []
    };
    Object.assign(field, this.getFieldOrMethodInfo(node));
    ts.forEachChild(node, it => {
      switch (it.kind) {
        case ts.SyntaxKind.MethodDeclaration:
          if (this.isPublic(it)) {
            field.methods.push((it as ts.MethodDeclaration).name.getText());
            const res = this.checkPipeDecorator(it as ts.MethodDeclaration);
            if (res) {
              const { kind, desc } = this.getFieldOrMethodInfo(it);
              res.className = className;
              res.kind =  kind || field.kind;
              res.desc = desc;
              field.pipes.push(res);
            }
          }
          break;
      }
    });
    if (field.pipes.length) {
      this.list.push(field);
    }
  }

  private isPublic (node: ts.Node): boolean {
    if (!node.modifiers) {
      return true;
    }
    return node.modifiers.some((token: ts.Modifier) => {
      return token.kind !== ts.SyntaxKind.PrivateKeyword
        && token.kind !== ts.SyntaxKind.ProtectedKeyword;
    });
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
    const { line, character } = this.sourceFile!.getLineAndCharacterOfPosition(node.getStart());
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
        // TODO: Ignore this!
				if (!treeNode.destination) {
					treeNode.destination = treeNode.method;
				}
			}
    });

    const lastDeco = node.decorators[length - 1];
    const { line: lastLine } = this.sourceFile!.getLineAndCharacterOfPosition(lastDeco.getEnd());
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
			return '\'' + (node as ts.StringLiteral).text + '\'';
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