import * as vscode from 'vscode';

export interface SecurityIssue {
    type: VulnerabilityType;
    severity: vscode.DiagnosticSeverity;
    message: string;
    line: number;
    column: number;
    length: number;
    code?: string;
    source: string;
    relatedInformation?: vscode.DiagnosticRelatedInformation[];
}

export enum VulnerabilityType {
    PromptInjection = 'prompt-injection',
    ApiKeyExposure = 'api-key-exposure',
    UnsanitizedInput = 'unsanitized-input',
    MissingValidation = 'missing-validation',
    InsecureRag = 'insecure-rag',
    PiiLeakage = 'pii-leakage',
    HardcodedPrompt = 'hardcoded-prompt',
    InsecureToolCall = 'insecure-tool-call',
    UnvalidatedOutput = 'unvalidated-output',
    TokenExposure = 'token-exposure'
}

export class DiagnosticsManager {
    private diagnosticCollection: vscode.DiagnosticCollection;
    private diagnosticsMap: Map<string, vscode.Diagnostic[]> = new Map();

    constructor(collection: vscode.DiagnosticCollection) {
        this.diagnosticCollection = collection;
    }

    addIssue(document: vscode.TextDocument, issue: SecurityIssue): void {
        const range = new vscode.Range(
            new vscode.Position(issue.line, issue.column),
            new vscode.Position(issue.line, issue.column + issue.length)
        );

        const diagnostic = new vscode.Diagnostic(
            range,
            issue.message,
            issue.severity
        );

        diagnostic.source = issue.source;
        diagnostic.code = issue.code;

        if (issue.relatedInformation) {
            diagnostic.relatedInformation = issue.relatedInformation;
        }

        // Add tags for better visibility
        if (issue.severity === vscode.DiagnosticSeverity.Error) {
            diagnostic.tags = [vscode.DiagnosticTag.Deprecated];
        }

        const uri = document.uri.toString();
        const existing = this.diagnosticsMap.get(uri) || [];
        existing.push(diagnostic);
        this.diagnosticsMap.set(uri, existing);

        this.diagnosticCollection.set(document.uri, existing);
    }

    clearDiagnostics(document: vscode.TextDocument): void {
        const uri = document.uri.toString();
        this.diagnosticsMap.delete(uri);
        this.diagnosticCollection.delete(document.uri);
    }

    getDiagnosticsCount(uri: vscode.Uri): number {
        const diagnostics = this.diagnosticsMap.get(uri.toString());
        return diagnostics ? diagnostics.length : 0;
    }

    generateReport(): any {
        let filesScanned = 0;
        let criticalCount = 0;
        let warningCount = 0;
        let totalIssues = 0;
        const byType: Record<string, number> = {};

        this.diagnosticsMap.forEach((diagnostics) => {
            filesScanned++;
            diagnostics.forEach((diagnostic) => {
                totalIssues++;
                
                if (diagnostic.severity === vscode.DiagnosticSeverity.Error) {
                    criticalCount++;
                } else if (diagnostic.severity === vscode.DiagnosticSeverity.Warning) {
                    warningCount++;
                }

                // Extract type from diagnostic code or message
                const type = diagnostic.code?.toString() || 'unknown';
                byType[type] = (byType[type] || 0) + 1;
            });
        });

        return {
            filesScanned,
            criticalCount,
            warningCount,
            totalIssues,
            byType
        };
    }

    getAllDiagnostics(): Map<string, vscode.Diagnostic[]> {
        return this.diagnosticsMap;
    }
}
