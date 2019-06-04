import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import * as ts from 'typescript';
import state from './state';

class Workspace {
  public root: string = '';
  public include: string[] = [];
  public files: vscode.Uri[] = [];

  init () {
    this.root = vscode.workspace.rootPath || '';
    this.loadTsConfig();
    this.loadProjectConfig();
    this.loadPreset();
  }

  private loadTsConfig () {
    const url = path.resolve(this.root, 'tsconfig.json');
    const { config, error } = ts.readConfigFile(url, path => {
      return fs.readFileSync(path).toString();
    });

    if (error) {
      throw error;
    }

    if (!config) {
      return;
    }

    state.tsConfig = config;
    if (!config.include) {
      this.include.push('src/**/*.ts');
    } else {
      config.include.forEach((path: string) => {
        this.include.push(this.resolveIncludePath(path));
      });
    }
  }

  public loadProjectConfig () {
    try {
      const url = path.resolve(this.root, '.pipe.config.json');
      const config = JSON.parse(fs.readFileSync(url).toString());
      Object.assign(state.projectConfig, config);
    } catch (e) {
      console.error('Read .pipe.config.json file error');
    }
  }

  public loadPreset () {
    if (!state.projectConfig.preset) {
      return;
    }

    try {
      const url = path.resolve(this.root, state.projectConfig.preset);
      const preset = JSON.parse(fs.readFileSync(url).toString());
      Object.assign(state.preset, preset);
    } catch (e) {
      console.error('Read preset file error');
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
