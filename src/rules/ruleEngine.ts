import * as vscode from 'vscode';
import { VulnerabilityType } from '../diagnostics';

export interface DetectionRule {
    id: string;
    type: VulnerabilityType;
    severity: vscode.DiagnosticSeverity;
    message: string;
    code: string;
    patterns: RegExp[];
    languageIds: string[];
    documentation?: string;
}

export function createDetectionRules(): DetectionRule[] {
    return [
        // API Key Exposure Rules
        {
            id: 'api-key-openai',
            type: VulnerabilityType.ApiKeyExposure,
            severity: vscode.DiagnosticSeverity.Error,
            message: 'Potential OpenAI API key exposure. Use environment variables instead.',
            code: 'BST001',
            patterns: [
                /['"]sk-[a-zA-Z0-9]{20,}['"]/g,
                /['"]sk-proj-[a-zA-Z0-9_-]{20,}['"]/g,
                /OPENAI_API_KEY\s*=\s*['"][^'"]+['"]/g
            ],
            languageIds: ['python', 'javascript', 'typescript', 'javascriptreact', 'typescriptreact'],
            documentation: 'Store API keys in environment variables or secure vaults. Use os.getenv() or process.env'
        },
        {
            id: 'api-key-anthropic',
            type: VulnerabilityType.ApiKeyExposure,
            severity: vscode.DiagnosticSeverity.Error,
            message: 'Potential Anthropic API key exposure. Use environment variables instead.',
            code: 'BST002',
            patterns: [
                /['"]sk-ant-[a-zA-Z0-9_-]{20,}['"]/g,
                /ANTHROPIC_API_KEY\s*=\s*['"][^'"]+['"]/g
            ],
            languageIds: ['python', 'javascript', 'typescript', 'javascriptreact', 'typescriptreact'],
            documentation: 'Store Anthropic API keys securely in environment variables'
        },
        {
            id: 'api-key-azure',
            type: VulnerabilityType.ApiKeyExposure,
            severity: vscode.DiagnosticSeverity.Error,
            message: 'Potential Azure API key exposure. Use Azure Key Vault or environment variables.',
            code: 'BST003',
            patterns: [
                /AZURE_OPENAI_API_KEY\s*=\s*['"][^'"]+['"]/g,
                /api[_-]?key\s*=\s*['"][a-zA-Z0-9]{32,}['"]/gi
            ],
            languageIds: ['python', 'javascript', 'typescript', 'javascriptreact', 'typescriptreact'],
            documentation: 'Use Azure Key Vault or environment variables for Azure OpenAI keys'
        },

        // Prompt Injection Rules
        {
            id: 'prompt-injection-direct-concat',
            type: VulnerabilityType.PromptInjection,
            severity: vscode.DiagnosticSeverity.Error,
            message: 'Direct user input concatenation in prompt. This can lead to prompt injection attacks.',
            code: 'BST010',
            patterns: [
                /f['"].*\{[^}]*user[^}]*\}.*['"]/g,  // Python f-strings
                /`.*\$\{[^}]*user[^}]*\}.*`/g,       // JS template literals
                /['"].*['"]\s*\+\s*user/g,           // String concatenation
                /user.*\+\s*['"]/g
            ],
            languageIds: ['python', 'javascript', 'typescript', 'javascriptreact', 'typescriptreact'],
            documentation: 'Sanitize and validate user input before including in prompts. Use input validation and output encoding.'
        },
        {
            id: 'prompt-injection-unsanitized',
            type: VulnerabilityType.UnsanitizedInput,
            severity: vscode.DiagnosticSeverity.Warning,
            message: 'Unsanitized user input passed to LLM. Consider input validation and sanitization.',
            code: 'BST011',
            patterns: [
                /\.create\([^)]*content\s*=\s*[^)]*input\(/g,
                /\.chat\([^)]*messages.*input\(/g,
                /ChatCompletion\.create\([^)]*user[_\s]input/g
            ],
            languageIds: ['python', 'javascript', 'typescript', 'javascriptreact', 'typescriptreact'],
            documentation: 'Always validate and sanitize user input before passing to LLM APIs'
        },

        // Hardcoded System Prompts
        {
            id: 'hardcoded-system-prompt',
            type: VulnerabilityType.HardcodedPrompt,
            severity: vscode.DiagnosticSeverity.Warning,
            message: 'Hardcoded system prompt detected. Consider externalizing prompts for better security and maintainability.',
            code: 'BST020',
            patterns: [
                /role\s*[:=]\s*['"]system['"].*content\s*[:=]\s*['"][^'"]{50,}['"]/g,
                /SystemMessage\([^)]{50,}\)/g
            ],
            languageIds: ['python', 'javascript', 'typescript', 'javascriptreact', 'typescriptreact'],
            documentation: 'Store system prompts in configuration files or databases to prevent exposure and enable updates'
        },

        // Missing Output Validation
        {
            id: 'missing-output-validation',
            type: VulnerabilityType.UnvalidatedOutput,
            severity: vscode.DiagnosticSeverity.Warning,
            message: 'LLM output used without validation. Validate and sanitize model responses before use.',
            code: 'BST030',
            patterns: [
                /response\.choices\[0\]\.message\.content(?!\s*\)\s*(?:if|and|or|\?))/g,
                /\.content(?!\s*\)\s*(?:if|and|or|in|not|\?))/g
            ],
            languageIds: ['python', 'javascript', 'typescript', 'javascriptreact', 'typescriptreact'],
            documentation: 'Always validate LLM outputs before executing or displaying them'
        },

        // RAG Security Issues
        {
            id: 'rag-unsecured-query',
            type: VulnerabilityType.InsecureRag,
            severity: vscode.DiagnosticSeverity.Warning,
            message: 'RAG query without input sanitization. Vector DB queries can be exploited.',
            code: 'BST040',
            patterns: [
                /\.similarity_search\([^)]*user[_\s]?(?:input|query)[^)]*\)/g,
                /\.query\([^)]*user[_\s]?(?:input|query)[^)]*\)/g,
                /vectorstore\.(?:search|query)\([^)]*input\(/g
            ],
            languageIds: ['python', 'javascript', 'typescript', 'javascriptreact', 'typescriptreact'],
            documentation: 'Sanitize queries before vector database searches to prevent injection attacks'
        },

        // PII Leakage
        {
            id: 'pii-in-logging',
            type: VulnerabilityType.PiiLeakage,
            severity: vscode.DiagnosticSeverity.Error,
            message: 'Potential PII leakage in logs. Avoid logging sensitive user data.',
            code: 'BST050',
            patterns: [
                /(?:console\.log|print|logger)\([^)]*(?:email|password|ssn|credit_card|phone|address)[^)]*\)/gi,
                /(?:console\.log|print|logger)\([^)]*user[_\s]?(?:data|info|details)[^)]*\)/gi
            ],
            languageIds: ['python', 'javascript', 'typescript', 'javascriptreact', 'typescriptreact'],
            documentation: 'Never log PII or sensitive user data. Use redaction or hashing for debugging'
        },

        // Insecure Tool/Function Calling
        {
            id: 'insecure-tool-call',
            type: VulnerabilityType.InsecureToolCall,
            severity: vscode.DiagnosticSeverity.Error,
            message: 'Tool/function call without validation. Validate function names and parameters before execution.',
            code: 'BST060',
            patterns: [
                /eval\s*\(/g,
                /exec\s*\(/g,
                /Function\s*\(/g,
                /tools\s*=\s*\[.*\].*(?:dangerous|execute|system|shell)/gi
            ],
            languageIds: ['python', 'javascript', 'typescript', 'javascriptreact', 'typescriptreact'],
            documentation: 'Whitelist allowed functions and validate all parameters before execution'
        },

        // Token/Credential Exposure in Responses
        {
            id: 'token-in-response',
            type: VulnerabilityType.TokenExposure,
            severity: vscode.DiagnosticSeverity.Error,
            message: 'Potential token or credential in LLM response. Implement output filtering.',
            code: 'BST070',
            patterns: [
                /response.*(?:token|api[_-]?key|password|secret)/gi
            ],
            languageIds: ['python', 'javascript', 'typescript', 'javascriptreact', 'typescriptreact'],
            documentation: 'Filter LLM outputs for tokens, keys, and credentials before returning to users'
        },

        // Missing Rate Limiting
        {
            id: 'missing-rate-limit',
            type: VulnerabilityType.MissingValidation,
            severity: vscode.DiagnosticSeverity.Warning,
            message: 'LLM API call without rate limiting. Implement rate limiting to prevent abuse.',
            code: 'BST080',
            patterns: [
                /(?:openai|anthropic|ChatCompletion)\.(?:create|chat|complete)\(/g
            ],
            languageIds: ['python', 'javascript', 'typescript', 'javascriptreact', 'typescriptreact'],
            documentation: 'Implement rate limiting for LLM API calls to prevent abuse and cost overruns'
        }
    ];
}
