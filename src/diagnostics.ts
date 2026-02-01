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
    documentation?: string;
    relatedInformation?: vscode.DiagnosticRelatedInformation[];
}

export interface SecurityReport {
    filesScanned: number;
    criticalCount: number;
    warningCount: number;
    totalIssues: number;
    byType: Record<string, { count: number; severity: string; description: string }>;
    fileIssues: Record<string, { file: string; issues: Array<{ code: string; message: string; line: number; severity: string }> }>;
    timestamp: string;
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

        // Create rich message with documentation
        const fullMessage = issue.documentation
            ? `${issue.message}\n\n💡 Fix: ${issue.documentation}`
            : issue.message;

        const diagnostic = new vscode.Diagnostic(
            range,
            fullMessage,
            issue.severity
        );

        diagnostic.source = issue.source;

        // Create clickable code with link to documentation
        diagnostic.code = {
            value: issue.code || 'TC000',
            target: vscode.Uri.parse(`https://github.com/santhoshravindran7/TensorClad/docs/${issue.code}`)
        };

        if (issue.relatedInformation) {
            diagnostic.relatedInformation = issue.relatedInformation;
        }

        // Add visual tags based on severity
        if (issue.severity === vscode.DiagnosticSeverity.Error) {
            // Deprecated tag shows strikethrough for critical issues
            diagnostic.tags = [vscode.DiagnosticTag.Deprecated];
        }

        const uri = document.uri.toString();
        const existing = this.diagnosticsMap.get(uri) || [];

        // Avoid duplicate diagnostics at same location
        const isDuplicate = existing.some(d =>
            d.range.start.line === range.start.line &&
            d.range.start.character === range.start.character &&
            d.code === diagnostic.code
        );

        if (!isDuplicate) {
            existing.push(diagnostic);
            this.diagnosticsMap.set(uri, existing);
            this.diagnosticCollection.set(document.uri, existing);
        }
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

    generateReport(): SecurityReport {
        let filesScanned = 0;
        let criticalCount = 0;
        let warningCount = 0;
        let totalIssues = 0;
        const byType: Record<string, { count: number; severity: string; description: string }> = {};
        const fileIssues: Record<string, { file: string; issues: Array<{ code: string; message: string; line: number; severity: string }> }> = {};

        // Vulnerability code descriptions
        const codeDescriptions: Record<string, string> = {
            'TC001': 'OpenAI API Key Exposure - Hardcoded API keys can be extracted from source code',
            'TC002': 'Anthropic API Key Exposure - API credentials should use environment variables',
            'TC003': 'Azure API Key Exposure - Use Azure Key Vault for secure credential storage',
            'TC010': 'Prompt Injection - Direct user input in prompts enables malicious manipulation',
            'TC011': 'Unsanitized Input - User input should be validated before LLM processing',
            'TC020': 'Hardcoded System Prompt - Externalize prompts for security and maintainability',
            'TC030': 'Unvalidated LLM Output - Model responses should be validated before use',
            'TC040': 'Insecure RAG Query - Vector database queries need input sanitization',
            'TC050': 'PII Leakage - Sensitive data logged or exposed in outputs',
            'TC060': 'Insecure Tool Execution - Dynamic code execution without validation',
            'TC070': 'Token Exposure - Credentials potentially exposed in responses',
            'TC080': 'Missing Rate Limiting - API calls without abuse prevention'
        };

        this.diagnosticsMap.forEach((diagnostics, uri) => {
            filesScanned++;
            const fileName = uri.split('/').pop() || uri;

            diagnostics.forEach((diagnostic) => {
                totalIssues++;
                const severity = diagnostic.severity === vscode.DiagnosticSeverity.Error ? 'error' : 'warning';

                if (diagnostic.severity === vscode.DiagnosticSeverity.Error) {
                    criticalCount++;
                } else if (diagnostic.severity === vscode.DiagnosticSeverity.Warning) {
                    warningCount++;
                }

                // Extract code properly (handle object or string)
                const codeValue = typeof diagnostic.code === 'object' && diagnostic.code !== null
                    ? (diagnostic.code as { value: string }).value
                    : diagnostic.code?.toString() || 'unknown';

                if (!byType[codeValue]) {
                    byType[codeValue] = {
                        count: 0,
                        severity: severity,
                        description: codeDescriptions[codeValue] || 'Security vulnerability detected'
                    };
                }
                byType[codeValue].count++;

                // Track issues by file
                if (!fileIssues[uri]) {
                    fileIssues[uri] = { file: fileName, issues: [] };
                }
                fileIssues[uri].issues.push({
                    code: codeValue,
                    message: diagnostic.message.split('\n')[0], // First line only
                    line: diagnostic.range.start.line + 1,
                    severity
                });
            });
        });

        return {
            filesScanned,
            criticalCount,
            warningCount,
            totalIssues,
            byType,
            fileIssues,
            timestamp: new Date().toISOString()
        };
    }

    getAllDiagnostics(): Map<string, vscode.Diagnostic[]> {
        return this.diagnosticsMap;
    }
}
