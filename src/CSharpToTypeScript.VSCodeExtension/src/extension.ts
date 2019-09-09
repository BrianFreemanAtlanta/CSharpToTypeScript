import * as vscode from 'vscode';
import * as process from './process';
import * as dll from './dll';
import * as error from './error';

export function activate(context: vscode.ExtensionContext) {
    const csharpToTypeScript = async (target: 'selection' | 'clipboard') => {
        if (!vscode.window.activeTextEditor) {
            return;
        }

        const document = vscode.window.activeTextEditor.document;

        const selection = vscode.window.activeTextEditor.selection;

        const fullRange = new vscode.Range(
            0, 0,
            document.lineCount - 1, document.lineAt(document.lineCount - 1).range.end.character);

        const code = !selection.isEmpty ? document.getText(selection) : document.getText();

        const tabSize = vscode.window.activeTextEditor.options.tabSize as number;
        const useTabs = !vscode.window.activeTextEditor.options.insertSpaces;

        const addExport = !!vscode.workspace.getConfiguration().get('csharpToTypeScript.export');

        try {
            const converted = await process.Run(
                'dotnet',
                [context.asAbsolutePath(dll.path), ...dll.args(code, useTabs, tabSize, addExport)]);

            if (!converted) {
                return;
            }

            if (target === 'selection') {
                await vscode.window.activeTextEditor.edit(
                    builder => builder.replace(!selection.isEmpty ? selection : fullRange, converted));
            } else if (target === 'clipboard') {
                await vscode.env.clipboard.writeText(converted);
            }
        } catch (err) {
            if (typeof err === 'string') {
                await vscode.window.showErrorMessage(error.template(err));
            } else if (err instanceof Error && err.message) {
                await vscode.window.showErrorMessage(error.template(err.message));
            } else {
                await vscode.window.showErrorMessage(error.template());
            }
        }
    };

    context.subscriptions.push(
        vscode.commands.registerCommand('csharpToTypeScript.csharpToTypeScriptReplace', () => csharpToTypeScript('selection')),
        vscode.commands.registerCommand('csharpToTypeScript.csharpToTypeScriptToClipboard', () => csharpToTypeScript('clipboard')));
}

export function deactivate() { }