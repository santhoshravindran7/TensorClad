import * as vscode from 'vscode';
import { SecurityScanner } from './scanner';
import { DiagnosticsManager } from './diagnostics';

let diagnosticsManager: DiagnosticsManager;
let scanner: SecurityScanner;
let statusBarItem: vscode.StatusBarItem;

export function activate(context: vscode.ExtensionContext) {
    console.log('Bastion: AI Security Scanner is now active');

    // Initialize diagnostics collection
    const diagnosticCollection = vscode.languages.createDiagnosticCollection('bastion');
    context.subscriptions.push(diagnosticCollection);

    // Initialize managers
    diagnosticsManager = new DiagnosticsManager(diagnosticCollection);
    scanner = new SecurityScanner(diagnosticsManager);

    // Create status bar item
    statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    statusBarItem.command = 'bastion.showSecurityReport';
    statusBarItem.text = '$(shield) Bastion';
    statusBarItem.tooltip = 'Bastion: AI Security Scanner';
    statusBarItem.show();
    context.subscriptions.push(statusBarItem);

    // Register commands
    context.subscriptions.push(
        vscode.commands.registerCommand('bastion.scanFile', async () => {
            const editor = vscode.window.activeTextEditor;
            if (editor) {
                await scanDocument(editor.document);
            }
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('bastion.scanWorkspace', async () => {
            await scanWorkspace();
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('bastion.clearDiagnostics', () => {
            diagnosticCollection.clear();
            vscode.window.showInformationMessage('Bastion: Diagnostics cleared');
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('bastion.showSecurityReport', () => {
            showSecurityReport();
        })
    );

    // Event listeners
    const config = vscode.workspace.getConfiguration('bastion');

    if (config.get<boolean>('scanOnOpen', true)) {
        context.subscriptions.push(
            vscode.workspace.onDidOpenTextDocument(async (document: vscode.TextDocument) => {
                if (shouldScanDocument(document)) {
                    await scanDocument(document);
                }
            })
        );
    }

    if (config.get<boolean>('scanOnSave', true)) {
        context.subscriptions.push(
            vscode.workspace.onDidSaveTextDocument(async (document: vscode.TextDocument) => {
                if (shouldScanDocument(document)) {
                    await scanDocument(document);
                }
            })
        );
    }

    // Scan open documents on activation
    vscode.workspace.textDocuments.forEach(async (document: vscode.TextDocument) => {
        if (shouldScanDocument(document)) {
            await scanDocument(document);
        }
    });

    vscode.window.showInformationMessage('Bastion: AI Security Scanner activated! 🛡️');
}

function shouldScanDocument(document: vscode.TextDocument): boolean {
    const config = vscode.workspace.getConfiguration('bastion');
    
    if (!config.get<boolean>('enabled', true)) {
        return false;
    }

    // Check if document is in supported languages
    const supportedLanguages = [
        'python',
        'javascript',
        'typescript',
        'javascriptreact',
        'typescriptreact',
        'json',
        'jsonc'
    ];

    if (!supportedLanguages.includes(document.languageId)) {
        return false;
    }

    // Check exclude patterns
    const excludePatterns = config.get<string[]>('excludePatterns', []);
    
    for (const pattern of excludePatterns) {
        const globPattern = new vscode.RelativePattern(
            vscode.workspace.workspaceFolders?.[0] ?? '',
            pattern
        );
        if (vscode.languages.match({ pattern: globPattern }, document)) {
            return false;
        }
    }

    return true;
}

async function scanDocument(document: vscode.TextDocument): Promise<void> {
    try {
        statusBarItem.text = '$(loading~spin) Scanning...';
        await scanner.scanDocument(document);
        
        const issueCount = diagnosticsManager.getDiagnosticsCount(document.uri);
        statusBarItem.text = issueCount > 0 
            ? `$(shield) Bastion: ${issueCount} issue${issueCount > 1 ? 's' : ''}` 
            : '$(shield) Bastion: Clean';
    } catch (error) {
        console.error('Bastion scan error:', error);
        statusBarItem.text = '$(shield) Bastion: Error';
    }
}

async function scanWorkspace(): Promise<void> {
    const config = vscode.workspace.getConfiguration('bastion');
    const excludePatterns = config.get<string[]>('excludePatterns', []);

    await vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: 'Bastion: Scanning workspace...',
        cancellable: true
    }, async (progress: vscode.Progress<{ increment?: number; message?: string }>, token: vscode.CancellationToken) => {
        const files = await vscode.workspace.findFiles(
            '**/*.{py,js,ts,jsx,tsx}',
            `{${excludePatterns.join(',')}}`
        );

        let scanned = 0;
        for (const file of files) {
            if (token.isCancellationRequested) {
                break;
            }

            const document = await vscode.workspace.openTextDocument(file);
            await scanDocument(document);

            scanned++;
            progress.report({ 
                increment: (100 / files.length),
                message: `${scanned}/${files.length} files` 
            });
        }

        vscode.window.showInformationMessage(
            `Bastion: Scanned ${scanned} files. Check Problems panel for issues.`
        );
    });
}

function showSecurityReport(): void {
    const panel = vscode.window.createWebviewPanel(
        'bastionReport',
        'Bastion Security Report',
        vscode.ViewColumn.One,
        {
            enableScripts: true
        }
    );

    const report = diagnosticsManager.generateReport();
    panel.webview.html = getWebviewContent(report);
}

function getWebviewContent(report: any): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Bastion Security Report</title>
    <style>
        body {
            font-family: var(--vscode-font-family);
            color: var(--vscode-foreground);
            background-color: var(--vscode-editor-background);
            padding: 20px;
        }
        .header {
            margin-bottom: 30px;
        }
        .header h1 {
            margin: 0;
            font-size: 24px;
        }
        .stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin-bottom: 30px;
        }
        .stat-card {
            background: var(--vscode-editor-inactiveSelectionBackground);
            padding: 15px;
            border-radius: 5px;
            border-left: 3px solid var(--vscode-charts-blue);
        }
        .stat-card.error {
            border-left-color: var(--vscode-charts-red);
        }
        .stat-card.warning {
            border-left-color: var(--vscode-charts-orange);
        }
        .stat-value {
            font-size: 32px;
            font-weight: bold;
            margin: 5px 0;
        }
        .stat-label {
            font-size: 12px;
            opacity: 0.8;
        }
        .vulnerabilities {
            margin-top: 20px;
        }
        .vulnerability-item {
            background: var(--vscode-editor-inactiveSelectionBackground);
            padding: 15px;
            margin-bottom: 10px;
            border-radius: 5px;
            border-left: 3px solid var(--vscode-charts-yellow);
        }
        .vulnerability-item.high {
            border-left-color: var(--vscode-charts-red);
        }
        .vulnerability-item.medium {
            border-left-color: var(--vscode-charts-orange);
        }
        .vulnerability-type {
            font-weight: bold;
            font-size: 14px;
        }
        .vulnerability-count {
            opacity: 0.8;
            font-size: 12px;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>🛡️ Bastion Security Report</h1>
        <p>AI-Native Application Security Analysis</p>
    </div>
    <div class="stats">
        <div class="stat-card">
            <div class="stat-label">Total Files Scanned</div>
            <div class="stat-value">${report.filesScanned}</div>
        </div>
        <div class="stat-card error">
            <div class="stat-label">Critical Issues</div>
            <div class="stat-value">${report.criticalCount}</div>
        </div>
        <div class="stat-card warning">
            <div class="stat-label">Warnings</div>
            <div class="stat-value">${report.warningCount}</div>
        </div>
        <div class="stat-card">
            <div class="stat-label">Total Issues</div>
            <div class="stat-value">${report.totalIssues}</div>
        </div>
    </div>
    <div class="vulnerabilities">
        <h2>Vulnerability Breakdown</h2>
        ${Object.entries(report.byType).map(([type, count]) => {
            const numCount = Number(count);
            return `
            <div class="vulnerability-item ${numCount > 5 ? 'high' : numCount > 2 ? 'medium' : ''}">
                <div class="vulnerability-type">${type}</div>
                <div class="vulnerability-count">${numCount} occurrence${numCount > 1 ? 's' : ''}</div>
            </div>
        `;}).join('')}
    </div>
</body>
</html>`;
}

export function deactivate() {
    console.log('Bastion: AI Security Scanner deactivated');
}
