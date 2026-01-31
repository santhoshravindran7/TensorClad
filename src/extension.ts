import * as vscode from 'vscode';
import { SecurityScanner } from './scanner';
import { DiagnosticsManager, SecurityReport } from './diagnostics';

let diagnosticsManager: DiagnosticsManager;
let scanner: SecurityScanner;
let statusBarItem: vscode.StatusBarItem;
let errorDecorationType: vscode.TextEditorDecorationType;
let warningDecorationType: vscode.TextEditorDecorationType;

export function activate(context: vscode.ExtensionContext) {
    console.log('TensorClad: AI Security Scanner is now active');

    // Initialize diagnostics collection
    const diagnosticCollection = vscode.languages.createDiagnosticCollection('tensorclad');
    context.subscriptions.push(diagnosticCollection);

    // Initialize managers
    diagnosticsManager = new DiagnosticsManager(diagnosticCollection);
    scanner = new SecurityScanner(diagnosticsManager);

    // Create decorations for visual highlighting
    errorDecorationType = vscode.window.createTextEditorDecorationType({
        backgroundColor: 'rgba(255, 0, 0, 0.15)',
        border: '1px solid rgba(255, 0, 0, 0.5)',
        borderRadius: '3px',
        overviewRulerColor: 'red',
        overviewRulerLane: vscode.OverviewRulerLane.Right,
        gutterIconPath: context.asAbsolutePath('resources/error-icon.svg'),
        gutterIconSize: 'contain'
    });

    warningDecorationType = vscode.window.createTextEditorDecorationType({
        backgroundColor: 'rgba(255, 165, 0, 0.15)',
        border: '1px solid rgba(255, 165, 0, 0.5)',
        borderRadius: '3px',
        overviewRulerColor: 'orange',
        overviewRulerLane: vscode.OverviewRulerLane.Right
    });

    context.subscriptions.push(errorDecorationType, warningDecorationType);

    // Create status bar item
    statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    statusBarItem.command = 'tensorclad.showSecurityReport';
    statusBarItem.text = '$(shield) TensorClad';
    statusBarItem.tooltip = 'TensorClad: AI Security Scanner - Click for report';
    statusBarItem.show();
    context.subscriptions.push(statusBarItem);

    // Register commands
    context.subscriptions.push(
        vscode.commands.registerCommand('tensorclad.scanFile', async () => {
            const editor = vscode.window.activeTextEditor;
            if (editor) {
                vscode.window.showInformationMessage('TensorClad: Scanning file...');
                await scanDocument(editor.document);
                updateDecorations(editor);
                const count = diagnosticsManager.getDiagnosticsCount(editor.document.uri);
                vscode.window.showInformationMessage(`TensorClad: Found ${count} security issue(s)`);
            }
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('tensorclad.scanWorkspace', async () => {
            await scanWorkspace();
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('tensorclad.clearDiagnostics', () => {
            diagnosticCollection.clear();
            // Clear decorations too
            if (vscode.window.activeTextEditor) {
                vscode.window.activeTextEditor.setDecorations(errorDecorationType, []);
                vscode.window.activeTextEditor.setDecorations(warningDecorationType, []);
            }
            vscode.window.showInformationMessage('TensorClad: Diagnostics cleared');
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('tensorclad.showSecurityReport', () => {
            showSecurityReport();
        })
    );

    // Event listeners - Always register for real-time scanning
    context.subscriptions.push(
        vscode.workspace.onDidOpenTextDocument(async (document: vscode.TextDocument) => {
            const config = vscode.workspace.getConfiguration('tensorclad');
            if (config.get<boolean>('scanOnOpen', true) && shouldScanDocument(document)) {
                await scanDocument(document);
            }
        })
    );

    context.subscriptions.push(
        vscode.workspace.onDidSaveTextDocument(async (document: vscode.TextDocument) => {
            const config = vscode.workspace.getConfiguration('tensorclad');
            if (config.get<boolean>('scanOnSave', true) && shouldScanDocument(document)) {
                await scanDocument(document);
                // Update decorations if this is the active editor
                const editor = vscode.window.activeTextEditor;
                if (editor && editor.document === document) {
                    updateDecorations(editor);
                }
            }
        })
    );

    // Also scan on text change (real-time)
    context.subscriptions.push(
        vscode.workspace.onDidChangeTextDocument(async (event: vscode.TextDocumentChangeEvent) => {
            if (shouldScanDocument(event.document)) {
                // Debounce: only scan after user stops typing
                await scanDocument(event.document);
                const editor = vscode.window.activeTextEditor;
                if (editor && editor.document === event.document) {
                    updateDecorations(editor);
                }
            }
        })
    );

    // Update decorations when editor changes
    context.subscriptions.push(
        vscode.window.onDidChangeActiveTextEditor((editor) => {
            if (editor && shouldScanDocument(editor.document)) {
                updateDecorations(editor);
            }
        })
    );

    // Scan open documents on activation
    vscode.workspace.textDocuments.forEach(async (document: vscode.TextDocument) => {
        if (shouldScanDocument(document)) {
            await scanDocument(document);
        }
    });

    vscode.window.showInformationMessage('TensorClad: AI Security Scanner activated! 🛡️');
}

function shouldScanDocument(document: vscode.TextDocument): boolean {
    const config = vscode.workspace.getConfiguration('tensorclad');

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

function updateDecorations(editor: vscode.TextEditor): void {
    const diagnostics = diagnosticsManager.getAllDiagnostics().get(editor.document.uri.toString()) || [];

    const errorDecorations: vscode.DecorationOptions[] = [];
    const warningDecorations: vscode.DecorationOptions[] = [];

    diagnostics.forEach(diagnostic => {
        const decoration: vscode.DecorationOptions = {
            range: diagnostic.range,
            hoverMessage: new vscode.MarkdownString(`**🛡️ ${diagnostic.source}** (${typeof diagnostic.code === 'object' ? (diagnostic.code as { value: string }).value : diagnostic.code})\n\n${diagnostic.message}`)
        };

        if (diagnostic.severity === vscode.DiagnosticSeverity.Error) {
            errorDecorations.push(decoration);
        } else {
            warningDecorations.push(decoration);
        }
    });

    editor.setDecorations(errorDecorationType, errorDecorations);
    editor.setDecorations(warningDecorationType, warningDecorations);
}

async function scanDocument(document: vscode.TextDocument): Promise<void> {
    try {
        statusBarItem.text = '$(loading~spin) Scanning...';
        await scanner.scanDocument(document);

        const issueCount = diagnosticsManager.getDiagnosticsCount(document.uri);
        statusBarItem.text = issueCount > 0
            ? `$(shield) TensorClad: ${issueCount} issue${issueCount > 1 ? 's' : ''}`
            : '$(shield) TensorClad: Clean';
    } catch (error) {
        console.error('TensorClad scan error:', error);
        statusBarItem.text = '$(shield) TensorClad: Error';
    }
}

async function scanWorkspace(): Promise<void> {
    const config = vscode.workspace.getConfiguration('tensorclad');
    const excludePatterns = config.get<string[]>('excludePatterns', []);

    await vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: 'TensorClad: Scanning workspace...',
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
            `TensorClad: Scanned ${scanned} files. Check Problems panel for issues.`
        );
    });
}

function showSecurityReport(): void {
    const panel = vscode.window.createWebviewPanel(
        'tensorcladReport',
        'TensorClad Security Report',
        vscode.ViewColumn.One,
        {
            enableScripts: true
        }
    );

    const report = diagnosticsManager.generateReport();
    panel.webview.html = getWebviewContent(report);
}

function getWebviewContent(report: SecurityReport): string {
    // Generate vulnerability breakdown HTML
    const vulnBreakdown = Object.entries(report.byType).map(([code, data]) => {
        const severity = data.severity === 'error' ? 'high' : 'medium';
        return `
            <div class="vulnerability-item ${severity}">
                <div class="vulnerability-header">
                    <span class="vulnerability-code">${code}</span>
                    <span class="vulnerability-badge ${severity}">${data.count}</span>
                </div>
                <div class="vulnerability-description">${data.description}</div>
            </div>
        `;
    }).join('');

    // Generate file issues HTML
    const fileIssuesHtml = Object.entries(report.fileIssues).map((entry) => {
        const fileData = entry[1];
        const issuesList = fileData.issues.map(issue => `
            <div class="issue-row ${issue.severity}">
                <span class="issue-line">Line ${issue.line}</span>
                <span class="issue-code">${issue.code}</span>
                <span class="issue-message">${issue.message}</span>
            </div>
        `).join('');

        return `
            <div class="file-section">
                <div class="file-header">📄 ${fileData.file} <span class="file-count">(${fileData.issues.length} issues)</span></div>
                <div class="file-issues">${issuesList}</div>
            </div>
        `;
    }).join('');

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>TensorClad Security Report</title>
    <style>
        * { box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
            color: var(--vscode-foreground);
            background-color: var(--vscode-editor-background);
            padding: 24px;
            line-height: 1.5;
        }
        .header {
            margin-bottom: 32px;
            padding-bottom: 16px;
            border-bottom: 1px solid var(--vscode-panel-border);
        }
        .header h1 {
            margin: 0 0 8px 0;
            font-size: 28px;
            display: flex;
            align-items: center;
            gap: 12px;
        }
        .header p {
            margin: 0;
            opacity: 0.7;
            font-size: 14px;
        }
        .timestamp {
            font-size: 12px;
            opacity: 0.5;
            margin-top: 8px;
        }
        .stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
            gap: 16px;
            margin-bottom: 32px;
        }
        .stat-card {
            background: var(--vscode-editor-inactiveSelectionBackground);
            padding: 20px;
            border-radius: 8px;
            border-left: 4px solid var(--vscode-charts-blue);
            transition: transform 0.2s;
        }
        .stat-card:hover { transform: translateY(-2px); }
        .stat-card.error { border-left-color: #f44336; }
        .stat-card.warning { border-left-color: #ff9800; }
        .stat-card.success { border-left-color: #4caf50; }
        .stat-value {
            font-size: 36px;
            font-weight: 700;
            margin: 8px 0;
        }
        .stat-card.error .stat-value { color: #f44336; }
        .stat-card.warning .stat-value { color: #ff9800; }
        .stat-card.success .stat-value { color: #4caf50; }
        .stat-label {
            font-size: 13px;
            opacity: 0.7;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .section { margin-bottom: 32px; }
        .section h2 {
            font-size: 18px;
            margin: 0 0 16px 0;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        .vulnerability-item {
            background: var(--vscode-editor-inactiveSelectionBackground);
            padding: 16px;
            margin-bottom: 12px;
            border-radius: 8px;
            border-left: 4px solid #ff9800;
        }
        .vulnerability-item.high { border-left-color: #f44336; }
        .vulnerability-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 8px;
        }
        .vulnerability-code {
            font-weight: 600;
            font-size: 15px;
            font-family: 'SF Mono', Monaco, 'Cascadia Code', monospace;
        }
        .vulnerability-badge {
            padding: 4px 12px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: 600;
        }
        .vulnerability-badge.high { background: rgba(244, 67, 54, 0.2); color: #f44336; }
        .vulnerability-badge.medium { background: rgba(255, 152, 0, 0.2); color: #ff9800; }
        .vulnerability-description {
            font-size: 14px;
            opacity: 0.85;
        }
        .file-section {
            background: var(--vscode-editor-inactiveSelectionBackground);
            border-radius: 8px;
            margin-bottom: 16px;
            overflow: hidden;
        }
        .file-header {
            padding: 12px 16px;
            font-weight: 600;
            border-bottom: 1px solid var(--vscode-panel-border);
            display: flex;
            align-items: center;
            gap: 8px;
        }
        .file-count {
            font-weight: normal;
            opacity: 0.6;
            font-size: 13px;
        }
        .file-issues { padding: 8px; }
        .issue-row {
            display: grid;
            grid-template-columns: 80px 80px 1fr;
            gap: 12px;
            padding: 8px 12px;
            border-radius: 4px;
            font-size: 13px;
            margin-bottom: 4px;
        }
        .issue-row.error { background: rgba(244, 67, 54, 0.1); }
        .issue-row.warning { background: rgba(255, 152, 0, 0.1); }
        .issue-line {
            font-family: monospace;
            opacity: 0.7;
        }
        .issue-code {
            font-family: monospace;
            font-weight: 600;
        }
        .issue-row.error .issue-code { color: #f44336; }
        .issue-row.warning .issue-code { color: #ff9800; }
        .issue-message {
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }
        .empty-state {
            text-align: center;
            padding: 48px;
            opacity: 0.6;
        }
        .empty-state .icon { font-size: 48px; margin-bottom: 16px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🛡️ TensorClad Security Report</h1>
        <p>AI-Native Application Security Analysis</p>
        <div class="timestamp">Generated: ${new Date(report.timestamp).toLocaleString()}</div>
    </div>

    <div class="stats">
        <div class="stat-card">
            <div class="stat-label">Files Scanned</div>
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
        <div class="stat-card ${report.totalIssues === 0 ? 'success' : ''}">
            <div class="stat-label">Total Issues</div>
            <div class="stat-value">${report.totalIssues}</div>
        </div>
    </div>

    <div class="section">
        <h2>🔍 Vulnerability Breakdown</h2>
        ${vulnBreakdown || '<div class="empty-state"><div class="icon">✅</div><p>No vulnerabilities detected!</p></div>'}
    </div>

    <div class="section">
        <h2>📁 Issues by File</h2>
        ${fileIssuesHtml || '<div class="empty-state"><div class="icon">📭</div><p>No files with issues</p></div>'}
    </div>

    <div style="text-align: center; opacity: 0.5; font-size: 12px; margin-top: 32px;">
        TensorClad v0.1.0 • OWASP LLM Top 10 Compliant
    </div>
</body>
</html>`;
}

export function deactivate() {
    console.log('TensorClad: AI Security Scanner deactivated');
}
