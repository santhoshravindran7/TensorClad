import * as vscode from 'vscode';

/**
 * Provides Quick Fix code actions for TensorClad security diagnostics
 */
export class SecurityCodeActionProvider implements vscode.CodeActionProvider {
    public static readonly providedCodeActionKinds = [
        vscode.CodeActionKind.QuickFix
    ];

    provideCodeActions(
        document: vscode.TextDocument,
        range: vscode.Range | vscode.Selection,
        context: vscode.CodeActionContext,
        _token: vscode.CancellationToken
    ): vscode.CodeAction[] {
        const actions: vscode.CodeAction[] = [];

        // Only process TensorClad diagnostics
        const tensorCladDiagnostics = context.diagnostics.filter(
            d => d.source === 'TensorClad'
        );

        for (const diagnostic of tensorCladDiagnostics) {
            const code = this.extractCode(diagnostic);
            const fixActions = this.createFixActions(document, diagnostic, code);
            actions.push(...fixActions);
        }

        return actions;
    }

    private extractCode(diagnostic: vscode.Diagnostic): string {
        if (typeof diagnostic.code === 'object' && diagnostic.code !== null) {
            return (diagnostic.code as { value: string }).value;
        }
        return diagnostic.code?.toString() || '';
    }

    private createFixActions(
        document: vscode.TextDocument,
        diagnostic: vscode.Diagnostic,
        code: string
    ): vscode.CodeAction[] {
        const actions: vscode.CodeAction[] = [];
        const range = diagnostic.range;
        const text = document.getText(range);
        const languageId = document.languageId;

        switch (code) {
            // API Key Exposure Fixes
            case 'TC001': // OpenAI
            case 'TC002': // Anthropic  
            case 'TC003': // Azure
                actions.push(...this.createApiKeyFixes(document, diagnostic, range, text, languageId, code));
                break;

            // Prompt Injection Fixes
            case 'TC010':
                actions.push(...this.createPromptInjectionFixes(document, diagnostic, range, text, languageId));
                break;

            // Unsanitized Input
            case 'TC011':
                actions.push(...this.createSanitizationFixes(document, diagnostic, range, text, languageId));
                break;

            // Hardcoded System Prompt
            case 'TC020':
                actions.push(...this.createExternalizePromptFixes(document, diagnostic, range, text, languageId));
                break;

            // Unvalidated Output
            case 'TC030':
                actions.push(...this.createOutputValidationFixes(document, diagnostic, range, text, languageId));
                break;

            // Insecure RAG Query
            case 'TC040':
                actions.push(...this.createRagSecurityFixes(document, diagnostic, range, text, languageId));
                break;

            // PII Leakage
            case 'TC050':
                actions.push(...this.createPiiRedactionFixes(document, diagnostic, range, text, languageId));
                break;

            // Insecure Tool Call (eval/exec)
            case 'TC060':
                actions.push(...this.createSecureExecutionFixes(document, diagnostic, range, text, languageId));
                break;

            // Token Exposure
            case 'TC070':
                actions.push(...this.createTokenRedactionFixes(document, diagnostic, range, text, languageId));
                break;

            // Missing Rate Limiting
            case 'TC080':
                actions.push(...this.createRateLimitingFixes(document, diagnostic, range, text, languageId));
                break;
        }

        // Add a "Learn More" action for all issues
        actions.push(this.createLearnMoreAction(diagnostic, code));

        return actions;
    }

    // ========== API Key Exposure Fixes ==========
    private createApiKeyFixes(
        document: vscode.TextDocument,
        diagnostic: vscode.Diagnostic,
        range: vscode.Range,
        text: string,
        languageId: string,
        code: string
    ): vscode.CodeAction[] {
        const actions: vscode.CodeAction[] = [];

        // Determine the environment variable name based on the key type
        let envVarName = 'API_KEY';
        if (code === 'TC001') {
            envVarName = 'OPENAI_API_KEY';
        } else if (code === 'TC002') {
            envVarName = 'ANTHROPIC_API_KEY';
        } else if (code === 'TC003') {
            envVarName = 'AZURE_OPENAI_API_KEY';
        }

        // Fix 1: Replace with environment variable
        const envVarFix = new vscode.CodeAction(
            `🔐 Replace with environment variable`,
            vscode.CodeActionKind.QuickFix
        );
        envVarFix.diagnostics = [diagnostic];
        envVarFix.isPreferred = true;

        const envVarReplacement = this.getEnvVarSyntax(languageId, envVarName);
        envVarFix.edit = new vscode.WorkspaceEdit();
        envVarFix.edit.replace(document.uri, range, envVarReplacement);
        actions.push(envVarFix);

        // Fix 2: Redact the secret
        const redactFix = new vscode.CodeAction(
            `🚫 Redact secret (replace with placeholder)`,
            vscode.CodeActionKind.QuickFix
        );
        redactFix.diagnostics = [diagnostic];
        redactFix.edit = new vscode.WorkspaceEdit();
        redactFix.edit.replace(document.uri, range, `"***REDACTED_${envVarName}***"`);
        actions.push(redactFix);

        // Fix 3: Add .env file reminder (shows info)
        const dotEnvFix = new vscode.CodeAction(
            `📝 Add to .env file (opens new file)`,
            vscode.CodeActionKind.QuickFix
        );
        dotEnvFix.diagnostics = [diagnostic];
        dotEnvFix.command = {
            command: 'tensorclad.createEnvEntry',
            title: 'Create .env entry',
            arguments: [envVarName, this.extractSecretValue(text)]
        };
        actions.push(dotEnvFix);

        return actions;
    }

    // ========== Prompt Injection Fixes ==========
    private createPromptInjectionFixes(
        document: vscode.TextDocument,
        diagnostic: vscode.Diagnostic,
        range: vscode.Range,
        text: string,
        languageId: string
    ): vscode.CodeAction[] {
        const actions: vscode.CodeAction[] = [];

        // Fix 1: Wrap with sanitization function
        const sanitizeFix = new vscode.CodeAction(
            `🛡️ Wrap user input with sanitization`,
            vscode.CodeActionKind.QuickFix
        );
        sanitizeFix.diagnostics = [diagnostic];
        sanitizeFix.isPreferred = true;
        sanitizeFix.edit = new vscode.WorkspaceEdit();

        const sanitizedText = this.wrapWithSanitization(text, languageId);
        sanitizeFix.edit.replace(document.uri, range, sanitizedText);
        actions.push(sanitizeFix);

        // Fix 2: Add input length limit
        const limitFix = new vscode.CodeAction(
            `📏 Add input length validation`,
            vscode.CodeActionKind.QuickFix
        );
        limitFix.diagnostics = [diagnostic];
        limitFix.command = {
            command: 'tensorclad.insertValidation',
            title: 'Insert validation code',
            arguments: [document.uri, range.start.line, 'length', languageId]
        };
        actions.push(limitFix);

        return actions;
    }

    // ========== Sanitization Fixes ==========
    private createSanitizationFixes(
        document: vscode.TextDocument,
        diagnostic: vscode.Diagnostic,
        range: vscode.Range,
        text: string,
        languageId: string
    ): vscode.CodeAction[] {
        const actions: vscode.CodeAction[] = [];

        const sanitizeFix = new vscode.CodeAction(
            `🧹 Add input sanitization`,
            vscode.CodeActionKind.QuickFix
        );
        sanitizeFix.diagnostics = [diagnostic];
        sanitizeFix.isPreferred = true;
        sanitizeFix.command = {
            command: 'tensorclad.insertSanitizer',
            title: 'Insert sanitizer function',
            arguments: [document.uri, range.start.line, languageId]
        };
        actions.push(sanitizeFix);

        return actions;
    }

    // ========== Externalize Prompt Fixes ==========
    private createExternalizePromptFixes(
        document: vscode.TextDocument,
        diagnostic: vscode.Diagnostic,
        range: vscode.Range,
        text: string,
        languageId: string
    ): vscode.CodeAction[] {
        const actions: vscode.CodeAction[] = [];

        // Fix 1: Extract to constant
        const constantFix = new vscode.CodeAction(
            `📤 Extract prompt to constant`,
            vscode.CodeActionKind.QuickFix
        );
        constantFix.diagnostics = [diagnostic];
        constantFix.isPreferred = true;
        constantFix.command = {
            command: 'tensorclad.extractPromptToConstant',
            title: 'Extract to constant',
            arguments: [document.uri, range, text, languageId]
        };
        actions.push(constantFix);

        // Fix 2: Move to config file
        const configFix = new vscode.CodeAction(
            `📁 Move prompt to config file`,
            vscode.CodeActionKind.QuickFix
        );
        configFix.diagnostics = [diagnostic];
        configFix.command = {
            command: 'tensorclad.extractPromptToConfig',
            title: 'Move to config',
            arguments: [document.uri, range, text]
        };
        actions.push(configFix);

        return actions;
    }

    // ========== Output Validation Fixes ==========
    private createOutputValidationFixes(
        document: vscode.TextDocument,
        diagnostic: vscode.Diagnostic,
        range: vscode.Range,
        text: string,
        languageId: string
    ): vscode.CodeAction[] {
        const actions: vscode.CodeAction[] = [];

        const validateFix = new vscode.CodeAction(
            `✅ Add output validation`,
            vscode.CodeActionKind.QuickFix
        );
        validateFix.diagnostics = [diagnostic];
        validateFix.isPreferred = true;

        const validatedCode = this.wrapWithOutputValidation(text, languageId);
        validateFix.edit = new vscode.WorkspaceEdit();
        validateFix.edit.replace(document.uri, range, validatedCode);
        actions.push(validateFix);

        return actions;
    }

    // ========== RAG Security Fixes ==========
    private createRagSecurityFixes(
        document: vscode.TextDocument,
        diagnostic: vscode.Diagnostic,
        range: vscode.Range,
        text: string,
        languageId: string
    ): vscode.CodeAction[] {
        const actions: vscode.CodeAction[] = [];

        const sanitizeFix = new vscode.CodeAction(
            `🔒 Sanitize RAG query input`,
            vscode.CodeActionKind.QuickFix
        );
        sanitizeFix.diagnostics = [diagnostic];
        sanitizeFix.isPreferred = true;
        sanitizeFix.command = {
            command: 'tensorclad.insertRagSanitizer',
            title: 'Insert RAG sanitizer',
            arguments: [document.uri, range.start.line, languageId]
        };
        actions.push(sanitizeFix);

        return actions;
    }

    // ========== PII Redaction Fixes ==========
    private createPiiRedactionFixes(
        document: vscode.TextDocument,
        diagnostic: vscode.Diagnostic,
        range: vscode.Range,
        text: string,
        languageId: string
    ): vscode.CodeAction[] {
        const actions: vscode.CodeAction[] = [];

        // Fix 1: Remove the log statement
        const removeFix = new vscode.CodeAction(
            `🗑️ Remove logging statement`,
            vscode.CodeActionKind.QuickFix
        );
        removeFix.diagnostics = [diagnostic];

        // Extend range to full line for removal
        const fullLineRange = document.lineAt(range.start.line).range;
        removeFix.edit = new vscode.WorkspaceEdit();
        removeFix.edit.delete(document.uri, new vscode.Range(
            fullLineRange.start,
            new vscode.Position(fullLineRange.end.line + 1, 0)
        ));
        actions.push(removeFix);

        // Fix 2: Redact the sensitive data in log
        const redactFix = new vscode.CodeAction(
            `🔏 Redact PII in log output`,
            vscode.CodeActionKind.QuickFix
        );
        redactFix.diagnostics = [diagnostic];
        redactFix.isPreferred = true;

        const redactedText = this.redactPiiInLog(text, languageId);
        redactFix.edit = new vscode.WorkspaceEdit();
        redactFix.edit.replace(document.uri, range, redactedText);
        actions.push(redactFix);

        return actions;
    }

    // ========== Secure Execution Fixes ==========
    private createSecureExecutionFixes(
        document: vscode.TextDocument,
        diagnostic: vscode.Diagnostic,
        range: vscode.Range,
        text: string,
        languageId: string
    ): vscode.CodeAction[] {
        const actions: vscode.CodeAction[] = [];

        // Fix 1: Replace eval with safer alternative
        if (text.includes('eval') || text.includes('exec')) {
            const safeFix = new vscode.CodeAction(
                `⚠️ Replace with safer alternative (manual review required)`,
                vscode.CodeActionKind.QuickFix
            );
            safeFix.diagnostics = [diagnostic];
            safeFix.command = {
                command: 'tensorclad.showSecureAlternatives',
                title: 'Show secure alternatives',
                arguments: [text, languageId]
            };
            actions.push(safeFix);
        }

        // Fix 2: Add comment warning
        const commentFix = new vscode.CodeAction(
            `💬 Add security review comment`,
            vscode.CodeActionKind.QuickFix
        );
        commentFix.diagnostics = [diagnostic];
        commentFix.edit = new vscode.WorkspaceEdit();

        const comment = languageId === 'python'
            ? `# SECURITY: Review required - dynamic code execution\n`
            : `// SECURITY: Review required - dynamic code execution\n`;

        commentFix.edit.insert(document.uri, new vscode.Position(range.start.line, 0), comment);
        actions.push(commentFix);

        return actions;
    }

    // ========== Token Redaction Fixes ==========
    private createTokenRedactionFixes(
        document: vscode.TextDocument,
        diagnostic: vscode.Diagnostic,
        range: vscode.Range,
        text: string,
        languageId: string
    ): vscode.CodeAction[] {
        const actions: vscode.CodeAction[] = [];

        const filterFix = new vscode.CodeAction(
            `🔐 Add output filtering for sensitive data`,
            vscode.CodeActionKind.QuickFix
        );
        filterFix.diagnostics = [diagnostic];
        filterFix.isPreferred = true;
        filterFix.command = {
            command: 'tensorclad.insertOutputFilter',
            title: 'Insert output filter',
            arguments: [document.uri, range.start.line, languageId]
        };
        actions.push(filterFix);

        return actions;
    }

    // ========== Rate Limiting Fixes ==========
    private createRateLimitingFixes(
        document: vscode.TextDocument,
        diagnostic: vscode.Diagnostic,
        range: vscode.Range,
        text: string,
        languageId: string
    ): vscode.CodeAction[] {
        const actions: vscode.CodeAction[] = [];

        const rateLimitFix = new vscode.CodeAction(
            `⏱️ Add rate limiting wrapper`,
            vscode.CodeActionKind.QuickFix
        );
        rateLimitFix.diagnostics = [diagnostic];
        rateLimitFix.isPreferred = true;
        rateLimitFix.command = {
            command: 'tensorclad.insertRateLimiter',
            title: 'Insert rate limiter',
            arguments: [document.uri, range.start.line, languageId]
        };
        actions.push(rateLimitFix);

        // Add comment about rate limiting
        const commentFix = new vscode.CodeAction(
            `💬 Add TODO for rate limiting`,
            vscode.CodeActionKind.QuickFix
        );
        commentFix.diagnostics = [diagnostic];
        commentFix.edit = new vscode.WorkspaceEdit();

        const comment = languageId === 'python'
            ? `# TODO: Implement rate limiting for this API call\n`
            : `// TODO: Implement rate limiting for this API call\n`;

        commentFix.edit.insert(document.uri, new vscode.Position(range.start.line, 0), comment);
        actions.push(commentFix);

        return actions;
    }

    // ========== Learn More Action ==========
    private createLearnMoreAction(diagnostic: vscode.Diagnostic, code: string): vscode.CodeAction {
        const learnMore = new vscode.CodeAction(
            `📚 Learn more about ${code}`,
            vscode.CodeActionKind.QuickFix
        );
        learnMore.diagnostics = [diagnostic];
        learnMore.command = {
            command: 'vscode.open',
            title: 'Open documentation',
            arguments: [vscode.Uri.parse(`https://github.com/santhoshravindran7/TensorClad/docs/${code}`)]
        };
        return learnMore;
    }

    // ========== Helper Methods ==========

    private getEnvVarSyntax(languageId: string, envVarName: string): string {
        switch (languageId) {
            case 'python':
                return `os.getenv("${envVarName}")`;
            case 'javascript':
            case 'typescript':
            case 'javascriptreact':
            case 'typescriptreact':
                return `process.env.${envVarName}`;
            default:
                return `process.env.${envVarName}`;
        }
    }

    private extractSecretValue(text: string): string {
        // Extract the value between quotes
        const match = text.match(/['"]([^'"]+)['"]/);
        return match ? match[1] : 'YOUR_SECRET_HERE';
    }

    private wrapWithSanitization(text: string, languageId: string): string {
        if (languageId === 'python') {
            // For Python f-strings, wrap the variable
            const match = text.match(/\{([^}]+)\}/);
            if (match) {
                return text.replace(match[0], `{sanitize_input(${match[1]})}`);
            }
        } else {
            // For JS template literals
            const match = text.match(/\$\{([^}]+)\}/);
            if (match) {
                return text.replace(match[0], `\${sanitizeInput(${match[1]})}`);
            }
        }
        return text;
    }

    private wrapWithOutputValidation(text: string, languageId: string): string {
        if (languageId === 'python') {
            return `validate_llm_output(${text})`;
        }
        return `validateLlmOutput(${text})`;
    }

    private redactPiiInLog(text: string, languageId: string): string {
        // Replace sensitive field names with redaction
        const sensitiveFields = ['email', 'password', 'ssn', 'credit_card', 'phone', 'address'];
        let result = text;

        for (const field of sensitiveFields) {
            const regex = new RegExp(field, 'gi');
            result = result.replace(regex, `[REDACTED_${field.toUpperCase()}]`);
        }

        return result;
    }
}

/**
 * Register additional commands used by code actions
 */
export function registerCodeActionCommands(context: vscode.ExtensionContext): void {
    // Command to create .env entry
    context.subscriptions.push(
        vscode.commands.registerCommand('tensorclad.createEnvEntry', async (envVarName: string, secretValue: string) => {
            const workspaceFolders = vscode.workspace.workspaceFolders;
            if (!workspaceFolders) {
                vscode.window.showErrorMessage('No workspace folder open');
                return;
            }

            const envPath = vscode.Uri.joinPath(workspaceFolders[0].uri, '.env');
            const entry = `${envVarName}=${secretValue}\n`;

            try {
                // Try to append to existing .env
                const existingContent = await vscode.workspace.fs.readFile(envPath);
                const newContent = new TextEncoder().encode(
                    new TextDecoder().decode(existingContent) + entry
                );
                await vscode.workspace.fs.writeFile(envPath, newContent);
            } catch {
                // Create new .env file
                await vscode.workspace.fs.writeFile(envPath, new TextEncoder().encode(entry));
            }

            // Open the .env file
            const doc = await vscode.workspace.openTextDocument(envPath);
            await vscode.window.showTextDocument(doc);

            vscode.window.showInformationMessage(`Added ${envVarName} to .env file. Remember to add .env to .gitignore!`);
        })
    );

    // Command to insert validation code
    context.subscriptions.push(
        vscode.commands.registerCommand('tensorclad.insertValidation', async (
            uri: vscode.Uri,
            lineNumber: number,
            validationType: string,
            languageId: string
        ) => {
            const edit = new vscode.WorkspaceEdit();
            let validationCode: string;

            if (languageId === 'python') {
                validationCode = `
# Input validation
MAX_INPUT_LENGTH = 1000
def validate_input(user_input: str) -> str:
    if len(user_input) > MAX_INPUT_LENGTH:
        raise ValueError(f"Input too long: {len(user_input)} > {MAX_INPUT_LENGTH}")
    # Add more validation as needed
    return user_input.strip()

`;
            } else {
                validationCode = `
// Input validation
const MAX_INPUT_LENGTH = 1000;
function validateInput(userInput: string): string {
    if (userInput.length > MAX_INPUT_LENGTH) {
        throw new Error(\`Input too long: \${userInput.length} > \${MAX_INPUT_LENGTH}\`);
    }
    // Add more validation as needed
    return userInput.trim();
}

`;
            }

            edit.insert(uri, new vscode.Position(0, 0), validationCode);
            await vscode.workspace.applyEdit(edit);
            vscode.window.showInformationMessage('Validation function added at the top of the file');
        })
    );

    // Command to insert sanitizer function
    context.subscriptions.push(
        vscode.commands.registerCommand('tensorclad.insertSanitizer', async (
            uri: vscode.Uri,
            lineNumber: number,
            languageId: string
        ) => {
            const edit = new vscode.WorkspaceEdit();
            let sanitizerCode: string;

            if (languageId === 'python') {
                sanitizerCode = `
import re

def sanitize_input(user_input: str) -> str:
    """Sanitize user input before passing to LLM."""
    # Remove potential injection patterns
    sanitized = re.sub(r'(?i)(ignore|forget|disregard)\\s+(previous|above|all)', '[FILTERED]', user_input)
    # Remove system prompt markers
    sanitized = re.sub(r'(?i)(system|assistant|user)\\s*:', '[FILTERED]', sanitized)
    # Limit length
    return sanitized[:2000]

`;
            } else {
                sanitizerCode = `
function sanitizeInput(userInput: string): string {
    // Sanitize user input before passing to LLM
    let sanitized = userInput;
    // Remove potential injection patterns
    sanitized = sanitized.replace(/(ignore|forget|disregard)\\s+(previous|above|all)/gi, '[FILTERED]');
    // Remove system prompt markers
    sanitized = sanitized.replace(/(system|assistant|user)\\s*:/gi, '[FILTERED]');
    // Limit length
    return sanitized.slice(0, 2000);
}

`;
            }

            edit.insert(uri, new vscode.Position(0, 0), sanitizerCode);
            await vscode.workspace.applyEdit(edit);
            vscode.window.showInformationMessage('Sanitizer function added at the top of the file');
        })
    );

    // Command to insert rate limiter
    context.subscriptions.push(
        vscode.commands.registerCommand('tensorclad.insertRateLimiter', async (
            uri: vscode.Uri,
            lineNumber: number,
            languageId: string
        ) => {
            const edit = new vscode.WorkspaceEdit();
            let rateLimiterCode: string;

            if (languageId === 'python') {
                rateLimiterCode = `
import time
from functools import wraps

def rate_limit(max_calls: int, period: float):
    """Rate limiter decorator for API calls."""
    calls = []
    
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            now = time.time()
            # Remove old calls outside the period
            while calls and calls[0] < now - period:
                calls.pop(0)
            
            if len(calls) >= max_calls:
                sleep_time = calls[0] + period - now
                time.sleep(sleep_time)
                calls.pop(0)
            
            calls.append(now)
            return func(*args, **kwargs)
        return wrapper
    return decorator

# Usage: @rate_limit(max_calls=10, period=60)  # 10 calls per minute

`;
            } else {
                rateLimiterCode = `
// Simple rate limiter for API calls
class RateLimiter {
    private calls: number[] = [];
    
    constructor(
        private maxCalls: number,
        private periodMs: number
    ) {}
    
    async throttle(): Promise<void> {
        const now = Date.now();
        this.calls = this.calls.filter(t => t > now - this.periodMs);
        
        if (this.calls.length >= this.maxCalls) {
            const waitTime = this.calls[0] + this.periodMs - now;
            await new Promise(resolve => setTimeout(resolve, waitTime));
        }
        
        this.calls.push(now);
    }
}

// Usage: const limiter = new RateLimiter(10, 60000); // 10 calls per minute
// await limiter.throttle();

`;
            }

            edit.insert(uri, new vscode.Position(0, 0), rateLimiterCode);
            await vscode.workspace.applyEdit(edit);
            vscode.window.showInformationMessage('Rate limiter added at the top of the file');
        })
    );

    // Command to insert output filter
    context.subscriptions.push(
        vscode.commands.registerCommand('tensorclad.insertOutputFilter', async (
            uri: vscode.Uri,
            lineNumber: number,
            languageId: string
        ) => {
            const edit = new vscode.WorkspaceEdit();
            let filterCode: string;

            if (languageId === 'python') {
                filterCode = `
import re

def filter_sensitive_output(llm_response: str) -> str:
    """Filter sensitive data from LLM output."""
    # Filter API keys
    filtered = re.sub(r'sk-[a-zA-Z0-9]{20,}', '[REDACTED_API_KEY]', llm_response)
    # Filter tokens
    filtered = re.sub(r'(?i)(token|key|secret|password)\\s*[:=]\\s*[\\w\\-]+', '[REDACTED]', filtered)
    # Filter email addresses
    filtered = re.sub(r'[\\w.-]+@[\\w.-]+\\.\\w+', '[REDACTED_EMAIL]', filtered)
    return filtered

`;
            } else {
                filterCode = `
function filterSensitiveOutput(llmResponse: string): string {
    // Filter sensitive data from LLM output
    let filtered = llmResponse;
    // Filter API keys
    filtered = filtered.replace(/sk-[a-zA-Z0-9]{20,}/g, '[REDACTED_API_KEY]');
    // Filter tokens
    filtered = filtered.replace(/(token|key|secret|password)\\s*[:=]\\s*[\\w\\-]+/gi, '[REDACTED]');
    // Filter email addresses
    filtered = filtered.replace(/[\\w.-]+@[\\w.-]+\\.\\w+/g, '[REDACTED_EMAIL]');
    return filtered;
}

`;
            }

            edit.insert(uri, new vscode.Position(0, 0), filterCode);
            await vscode.workspace.applyEdit(edit);
            vscode.window.showInformationMessage('Output filter function added at the top of the file');
        })
    );

    // Command to insert RAG sanitizer
    context.subscriptions.push(
        vscode.commands.registerCommand('tensorclad.insertRagSanitizer', async (
            uri: vscode.Uri,
            lineNumber: number,
            languageId: string
        ) => {
            const edit = new vscode.WorkspaceEdit();
            let sanitizerCode: string;

            if (languageId === 'python') {
                sanitizerCode = `
import re

def sanitize_rag_query(query: str) -> str:
    """Sanitize query before vector database search."""
    # Remove special characters that could affect search
    sanitized = re.sub(r'[\\[\\]{}()\\\\^$|?*+]', '', query)
    # Limit query length
    sanitized = sanitized[:500]
    # Remove potential NoSQL injection patterns
    sanitized = re.sub(r'\\$\\w+', '', sanitized)
    return sanitized.strip()

`;
            } else {
                sanitizerCode = `
function sanitizeRagQuery(query: string): string {
    // Sanitize query before vector database search
    let sanitized = query;
    // Remove special characters that could affect search
    sanitized = sanitized.replace(/[\\[\\]{}()\\\\^$|?*+]/g, '');
    // Limit query length
    sanitized = sanitized.slice(0, 500);
    // Remove potential NoSQL injection patterns
    sanitized = sanitized.replace(/\\$\\w+/g, '');
    return sanitized.trim();
}

`;
            }

            edit.insert(uri, new vscode.Position(0, 0), sanitizerCode);
            await vscode.workspace.applyEdit(edit);
            vscode.window.showInformationMessage('RAG query sanitizer added at the top of the file');
        })
    );

    // Command to extract prompt to constant
    context.subscriptions.push(
        vscode.commands.registerCommand('tensorclad.extractPromptToConstant', async (
            uri: vscode.Uri,
            range: vscode.Range,
            text: string,
            languageId: string
        ) => {
            const edit = new vscode.WorkspaceEdit();
            
            // Extract the prompt content
            const promptMatch = text.match(/content\s*[:=]\s*['"]([^'"]+)['"]/);
            const promptContent = promptMatch ? promptMatch[1] : 'YOUR_SYSTEM_PROMPT';

            let constantDef: string;
            let replacement: string;

            if (languageId === 'python') {
                constantDef = `SYSTEM_PROMPT = """${promptContent}"""\n\n`;
                replacement = text.replace(/content\s*[:=]\s*['"][^'"]+['"]/, 'content=SYSTEM_PROMPT');
            } else {
                constantDef = `const SYSTEM_PROMPT = \`${promptContent}\`;\n\n`;
                replacement = text.replace(/content\s*[:=]\s*['"][^'"]+['"]/, 'content: SYSTEM_PROMPT');
            }

            edit.insert(uri, new vscode.Position(0, 0), constantDef);
            edit.replace(uri, range, replacement);
            
            await vscode.workspace.applyEdit(edit);
            vscode.window.showInformationMessage('System prompt extracted to constant');
        })
    );

    // Command to show secure alternatives
    context.subscriptions.push(
        vscode.commands.registerCommand('tensorclad.showSecureAlternatives', async (text: string, languageId: string) => {
            const alternatives = languageId === 'python'
                ? `**Secure alternatives to eval/exec:**

• Use \`ast.literal_eval()\` for literal expressions
• Use \`json.loads()\` for JSON data
• Use a whitelist of allowed operations
• Use \`importlib\` for dynamic imports
• Consider sandboxed execution environments`
                : `**Secure alternatives to eval/Function:**

• Use \`JSON.parse()\` for JSON data
• Use a whitelist of allowed operations
• Use \`vm.runInNewContext()\` with restrictions (Node.js)
• Consider sandboxed execution environments
• Use a parser library for expression evaluation`;

            vscode.window.showInformationMessage(alternatives, { modal: true });
        })
    );
}
