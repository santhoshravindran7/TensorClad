import * as vscode from 'vscode';
import { DiagnosticsManager, SecurityIssue } from './diagnostics';
import { DetectionRule, createDetectionRules } from './rules/ruleEngine';

export class SecurityScanner {
    private diagnosticsManager: DiagnosticsManager;
    private rules: DetectionRule[];

    constructor(diagnosticsManager: DiagnosticsManager) {
        this.diagnosticsManager = diagnosticsManager;
        this.rules = createDetectionRules();
    }

    async scanDocument(document: vscode.TextDocument): Promise<void> {
        // Clear existing diagnostics
        this.diagnosticsManager.clearDiagnostics(document);

        const text = document.getText();
        const lines = text.split('\n');

        // Apply each detection rule
        for (const rule of this.rules) {
            if (rule.languageIds.includes(document.languageId)) {
                this.applyRule(document, lines, rule);
            }
        }
    }

    private applyRule(
        document: vscode.TextDocument,
        lines: string[],
        rule: DetectionRule
    ): void {
        lines.forEach((line, lineIndex) => {
            for (const pattern of rule.patterns) {
                const matches = this.findMatches(line, pattern);
                
                matches.forEach((match) => {
                    // Check if context is valid (not in comments, etc.)
                    if (this.isValidContext(document, lineIndex, match.index, line)) {
                        const issue: SecurityIssue = {
                            type: rule.type,
                            severity: rule.severity,
                            message: rule.message,
                            line: lineIndex,
                            column: match.index,
                            length: match.length,
                            code: rule.code,
                            source: 'TensorClad',
                            documentation: rule.documentation,
                            relatedInformation: rule.documentation ? [
                                new vscode.DiagnosticRelatedInformation(
                                    new vscode.Location(
                                        document.uri,
                                        new vscode.Range(lineIndex, match.index, lineIndex, match.index + match.length)
                                    ),
                                    `\ud83d\udee1\ufe0f OWASP LLM Top 10: ${rule.documentation}`
                                )
                            ] : undefined
                        };

                        this.diagnosticsManager.addIssue(document, issue);
                    }
                });
            }
        });
    }

    private findMatches(text: string, pattern: RegExp): Array<{ index: number; length: number; match: string }> {
        const matches: Array<{ index: number; length: number; match: string }> = [];
        let match: RegExpExecArray | null;

        // Reset regex lastIndex
        pattern.lastIndex = 0;

        while ((match = pattern.exec(text)) !== null) {
            matches.push({
                index: match.index,
                length: match[0].length,
                match: match[0]
            });

            // Prevent infinite loops on zero-width matches
            if (match.index === pattern.lastIndex) {
                pattern.lastIndex++;
            }
        }

        return matches;
    }

    private isValidContext(
        document: vscode.TextDocument,
        _line: number,
        column: number,
        lineText: string
    ): boolean {
        // Skip if in comment
        if (this.isInComment(document.languageId, lineText, column)) {
            return false;
        }

        // Skip if in documentation string (for Python)
        if (document.languageId === 'python' && this.isInDocstring(lineText, column)) {
            return false;
        }

        return true;
    }

    private isInComment(languageId: string, line: string, position: number): boolean {
        const commentPatterns: Record<string, RegExp[]> = {
            python: [/^\s*#/, /"""[\s\S]*"""/],
            javascript: [/^\s*\/\//, /\/\*[\s\S]*?\*\//],
            typescript: [/^\s*\/\//, /\/\*[\s\S]*?\*\//],
            javascriptreact: [/^\s*\/\//, /\/\*[\s\S]*?\*\//],
            typescriptreact: [/^\s*\/\//, /\/\*[\s\S]*?\*\//]
        };

        const patterns = commentPatterns[languageId] || [];
        
        for (const pattern of patterns) {
            const match = line.match(pattern);
            if (match && match.index !== undefined && match.index <= position) {
                return true;
            }
        }

        return false;
    }

    private isInDocstring(line: string, position: number): boolean {
        const tripleQuotesBefore = (line.substring(0, position).match(/"""/g) || []).length;
        return tripleQuotesBefore % 2 !== 0;
    }
}
