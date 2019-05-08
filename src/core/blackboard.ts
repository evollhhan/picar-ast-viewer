import * as vscode from 'vscode';
import { readFile } from 'fs';
import { resolve } from 'path';
import workspace from './workspace';
import fieldManager from './field-manager';

class Blackboard {
  public panel: vscode.WebviewPanel | null = null;

  createView () {
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
      switch (message.event) {
        case 'viewInitReady':
          this.render();
          (this.panel!).webview.postMessage({
            command: 'updateContentPath',
            data: 'vscode-resource:' + resolve(__dirname, '../../view/')
          });
          break;
        case 'jumpLocation':
          const { location, env } = message.data as { env: Field.Env, location: Field.PipeMethodLocation };
          const file = workspace.files.filter(uri => uri.path === env.filePath);
          if (file.length) {
            vscode.window.showTextDocument(file[0], {
              selection: new vscode.Range(
                new vscode.Position(location.line, location.character),
                new vscode.Position(location.line, location.character + location.range)
              )
            });
          }
          break;
        case 'forceUpdate':
          workspace.findAllFiles()
            .then(list => {
              return fieldManager.build(list);
            }).then(() => this.render());
          break;
      }
    });

    this.panel.onDidChangeViewState(evt => {
      if (evt.webviewPanel.visible) {
        this.render();
      }
    });

    readFile(resolve(__dirname, '../../view/index.html'), (err, data) => {
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
}

export default new Blackboard();
