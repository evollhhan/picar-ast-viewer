import * as vscode from 'vscode';
import { readFile } from 'fs';
import { resolve } from 'path';
import workspace from './workspace';
import fieldManager from './field-manager';

class Blackboard {
  private extensionPath: string = '';
  public panel: vscode.WebviewPanel | null = null;

  createView (extensionPath: string) {
    this.extensionPath = extensionPath;

    if (this.panel) {
      const columnToShow = vscode.window.activeTextEditor ? vscode.window.activeTextEditor.viewColumn : undefined;
      this.panel.reveal(columnToShow);
      return;
    }

	  this.panel = vscode.window.createWebviewPanel(
      'pipeDesigner',
      'Pipe Designer',
      vscode.ViewColumn.One,
      {
        enableScripts: true,
        retainContextWhenHidden: true
      }
    );

    this.panel.onDidDispose(() => {
      this.panel = null;
    });

    this.panel.webview.onDidReceiveMessage(message => {
      const { event, data } = message;
      // @ts-ignore
      if (this[event]) { this[event](data); }
    });

    this.panel.onDidChangeViewState(evt => {
      if (evt.webviewPanel.visible) {
        this.render();
      }
    });

    readFile(resolve(extensionPath, './view/index.html'), (err, data) => {
      if (err) {
        console.log('Get html Error');
        return;
      }

      if (this.panel) {
        this.panel.webview.html = data.toString();
      }
    });
  }

  render (data?: Field.Map) {
    if (!this.panel) {
      return;
    }
    this.panel.webview.postMessage({
      command: 'updateFlowData',
      data: data || fieldManager.tree
    });
  }

  viewInitReady () {
    this.render();
    (this.panel!).webview.postMessage({
      command: 'updateContentPath',
      data: 'vscode-resource:' + resolve(this.extensionPath, './view/')
    });
  }

  forceUpdate () {
    workspace.findAllFiles()
    .then(list => {
      return fieldManager.build(list);
    }).then(() => this.render());
  }

  jumpLocation (data: { env: Field.Env, location: Field.PipeMethodLocation }) {
    const { location, env } = data;
    const file = workspace.files.filter(uri => uri.path === env.filePath);
    if (file.length) {
      vscode.window.showTextDocument(file[0], {
        selection: new vscode.Range(
          new vscode.Position(location.line, location.character),
          new vscode.Position(location.line, location.character + location.range)
        )
      });
    }
  }

  async editNode (data: Field.EditInfo) {
    try {
      const { result, fileName } = await fieldManager.editSourceFile(data);
      if (result && fileName) {
        this.render();
        // const doc = await vscode.workspace.openTextDocument(fileName);
        // await vscode.window.showTextDocument(doc, {
        //   preview: false,
        //   viewColumn: vscode.ViewColumn.One
        // });
        // vscode.commands.executeCommand('editor.action.formatDocument');
        // await vscode.commands.executeCommand('workbench.action.files.save');
        // await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
      }
    } catch (e) {
      console.error(e);
    }
  }
}

export default new Blackboard();
