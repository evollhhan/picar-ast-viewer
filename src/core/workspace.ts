import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import * as ts from 'typescript';

class Workspace {
  public root: string = '';
  public config: any = null;
  public include: string[] = [];
  public files: vscode.Uri[] = [];

  init () {
    this.root = vscode.workspace.rootPath || '';
    this.setConfig();
  }

  private setConfig () {
    const url = path.resolve(this.root, 'tsconfig.json');
    const { config, error } = ts.readConfigFile(url, path => {
      return fs.readFileSync(path).toString();
    });

    if (error) {
      throw error;
    }

    this.config = config;
    if (!this.config.include) {
      this.include.push('src/**/*.ts');
    } else {
      this.config.include.forEach((path: string) => {
        this.include.push(this.resolveIncludePath(path));
      });
    }
  }

  private resolveIncludePath (path: string): string {
    if (path.indexOf('./') === 0) {
      path = path.substr(2, path.length);
    }
    if (path.lastIndexOf('.ts') !== (path.length - 3)) {
      path += '.ts';
    }
    return path;
  }

  public findAllFiles (): Promise<vscode.Uri[]> {
    return new Promise(resolve => {
      let res: vscode.Uri[] = [];
      let resolvedDir = 0;
      const length = this.include.length;
      this.include.forEach(path => {
        vscode.workspace.findFiles(path).then(list => {
          res = res.concat(list);
          resolvedDir += 1;
          if (resolvedDir === length) {
            this.files = res;
            resolve(res);
          }
        });
      });
    });
  }
}

export default new Workspace();
