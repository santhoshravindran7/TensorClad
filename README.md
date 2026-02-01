<p align="center">
  <img src="resources/icon.png" alt="TensorClad Logo" width="128" height="128">
</p>

<h1 align="center">TensorClad</h1>

<p align="center">
  <strong> AI-Native Application Security Scanner for VS Code</strong>
</p>

<p align="center">
  <a href="#installation">Installation</a> 
  <a href="#features">Features</a> 
  <a href="#demo">Demo</a> 
  <a href="#vulnerability-detection">Vulnerabilities</a> 
  <a href="#configuration">Configuration</a> 
  <a href="#contributing">Contributing</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/version-0.1.0-blue?style=flat-square" alt="Version">
  <img src="https://img.shields.io/badge/license-MIT-green?style=flat-square" alt="License">
  <img src="https://img.shields.io/badge/VS%20Code-1.85.0+-007ACC?style=flat-square&logo=visual-studio-code" alt="VS Code">
  <img src="https://img.shields.io/badge/OWASP-LLM%20Top%2010-orange?style=flat-square" alt="OWASP">
</p>

---

## Why TensorClad?

As AI applications become mainstream, a new class of security vulnerabilities has emerged. Traditional SAST tools excel at finding SQL injection and XSS, but they're blind to **prompt injection**, **API key leakage in LLM configs**, and **unvalidated model outputs**.

TensorClad fills this gap. It's a static analysis tool built specifically for developers working with OpenAI, LangChain, Anthropic, and other AI frameworks.

### The Problem

Consider this typical AI application code:

```python
# This code has 3 security issues

api_key = "sk-proj-abc123..."  # TC001: Hardcoded API key

def chat(user_input):
    prompt = f"Help the user with: {user_input}"  # TC010: Prompt injection risk
    response = openai.chat.completions.create(
        model="gpt-4",
        messages=[{"role": "user", "content": prompt}]
    )
    return response.choices[0].message.content  # TC030: Unvalidated output
```

TensorClad detects all three issues as you type, showing warnings in the Problems panel with explanations and fix suggestions.

---

## Features

### Real-Time Scanning
No need to run a separate CLI tool. TensorClad analyzes your code on every keystroke and highlights issues inline with squiggly underlines, just like TypeScript errors.

### Security Dashboard
Run `TensorClad: Show Security Report` to see a summary of all detected vulnerabilities across your workspace, organized by severity and file.

### Framework-Aware Detection
Purpose-built detection rules for popular AI/LLM frameworks:

| Framework | Support |
|-----------|---------|
| OpenAI SDK |  Full |
| LangChain |  Full |
| Anthropic Claude |  Full |
| Azure OpenAI |  Full |
| LlamaIndex |  Full |
| Google AI |  Coming Soon |

---

## Installation

### From VS Code Marketplace
1. Open VS Code
2. Press `Ctrl+Shift+X` (Windows/Linux) or `Cmd+Shift+X` (Mac)
3. Search for **"TensorClad"**
4. Click **Install**

### From VSIX (Manual)
```bash
code --install-extension tensorclad-0.1.0.vsix
```

---

## Detected Vulnerabilities

TensorClad identifies security issues specific to AI/LLM applications. Each finding includes a code (e.g., TC001), severity level, and remediation guidance.

### API Key Exposure (TC001-003)
Hardcoded API keys are the most common security issue in AI applications.

```python
# ❌ Detected: TC001 - OpenAI API key in source code
openai.api_key = "sk-proj-abc123def456..."

# ✅ Secure: Load from environment
openai.api_key = os.getenv("OPENAI_API_KEY")
```

### Prompt Injection (TC010)
Direct user input in prompts allows attackers to manipulate LLM behavior.

```python
# ❌ Detected: TC010 - User input directly in prompt
prompt = f"Summarize this text: {user_input}"

# ✅ Secure: Validate and sanitize input
prompt = f"Summarize this text: {sanitize_input(user_input)}"
```

### Hardcoded System Prompts (TC020)
System prompts in source code can leak business logic and are hard to update.

```python
# ⚠️ Warning: TC020 - Consider externalizing prompts
messages = [
    {"role": "system", "content": "You are a helpful assistant..."}
]

# ✅ Better: Load from configuration
messages = [
    {"role": "system", "content": load_prompt("assistant")}
]
```

### Unvalidated LLM Output (TC030)
LLM responses are untrusted. Never execute them directly.

```python
# ❌ Detected: TC030 - Executing unvalidated output
result = response.choices[0].message.content
exec(result)  # Remote code execution risk!

# ✅ Secure: Validate output before use
result = response.choices[0].message.content
if is_safe_output(result):
    process(result)
```

### PII Leakage (TC050)
Logging user data can violate privacy regulations.

```python
# ❌ Detected: TC050 - PII in logs
print(f"User email: {user.email}, Query: {query}")

# ✅ Secure: Redact sensitive data
print(f"User: [REDACTED], Query: {redact_pii(query)}")
```

### Insecure Tool Execution (TC060)
AI agents that execute arbitrary code need strict validation.

```python
# ❌ Detected: TC060 - Dynamic code execution
eval(llm_response)

# ✅ Secure: Whitelist allowed operations
if operation in ALLOWED_OPERATIONS:
    execute_sandboxed(operation)
```

### Complete Rule Reference

| Code | Category | Severity | What It Detects |
|------|----------|:--------:|----------------|
| TC001 | API Keys | Error | OpenAI API keys in source |
| TC002 | API Keys | Error | Anthropic API keys in source |
| TC003 | API Keys | Error | Azure/other API keys in source |
| TC010 | Prompt Injection | Error | User input concatenated into prompts |
| TC011 | Input Validation | Warning | Unsanitized input passed to LLM |
| TC020 | Configuration | Warning | Hardcoded system prompts |
| TC030 | Output Validation | Warning | LLM output used without validation |
| TC040 | RAG Security | Warning | Unsanitized vector DB queries |
| TC050 | Data Privacy | Error | PII in logs or LLM context |
| TC060 | Code Execution | Error | eval/exec with LLM output |
| TC070 | Token Security | Error | Credentials exposed in responses |
| TC080 | Rate Limiting | Warning | API calls without rate limits |

---

## Commands

Open the Command Palette (`Ctrl+Shift+P`) and type "TensorClad":

| Command | Description |
|---------|-------------|
| `TensorClad: Scan Current File` | Manually trigger a scan of the active file |
| `TensorClad: Scan Entire Workspace` | Scan all Python/JS/TS files in the workspace |
| `TensorClad: Show Security Report` | Open the security dashboard in a new tab |
| `TensorClad: Clear Diagnostics` | Remove all TensorClad warnings |

---

## Configuration

Customize TensorClad in your VS Code settings (`settings.json`):

```json
{
  "tensorclad.enabled": true,
  "tensorclad.scanOnSave": true,
  "tensorclad.scanOnOpen": true,
  "tensorclad.excludePatterns": [
    "**/node_modules/**",
    "**/dist/**",
    "**/.venv/**"
  ]
}
```

### Configuration Options

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `tensorclad.enabled` | boolean | `true` | Enable/disable scanning |
| `tensorclad.scanOnSave` | boolean | `true` | Scan when files are saved |
| `tensorclad.scanOnOpen` | boolean | `true` | Scan when files are opened |
| `tensorclad.excludePatterns` | array | `[...]` | Glob patterns to exclude |

---

## Supported Languages

| Language | Extensions | Status |
|----------|------------|:------:|
| Python | `.py` | ✅ Full support |
| JavaScript | `.js`, `.jsx` | ✅ Full support |
| TypeScript | `.ts`, `.tsx` | ✅ Full support |
| Java | `.java` | 🔜 Planned |
| Go | `.go` | 🔜 Planned |
| C# | `.cs` | 🔜 Planned |

---

## Contributing

Contributions are welcome! Whether it's adding new detection rules, improving documentation, or fixing bugs.

### Quick Start

```bash
# Clone the repository
git clone https://github.com/santhoshravindran7/TensorClad.git
cd TensorClad

# Install dependencies
npm install

# Compile
npm run compile

# Watch mode (auto-recompile)
npm run watch

# Launch extension in debug mode
# Press F5 in VS Code
```

### Adding Custom Rules

Add detection rules in `src/rules/ruleEngine.ts`:

```typescript
{
    id: 'custom-rule',
    type: VulnerabilityType.CustomType,
    severity: vscode.DiagnosticSeverity.Warning,
    message: 'Description of the security issue',
    code: 'TC100',
    patterns: [/your-regex-pattern/g],
    languageIds: ['python', 'javascript', 'typescript'],
    documentation: 'How to fix this issue'
}
```

---

## Roadmap

Planned for upcoming releases:

- [ ] Custom rule builder (YAML/JSON configuration)
- [ ] Quick-fix code actions for common issues
- [ ] CI/CD integration (GitHub Actions, GitLab CI)
- [ ] Compliance reporting (OWASP LLM Top 10, NIST AI RMF)
- [ ] Team policy enforcement
- [ ] Additional language support (Java, Go, C#, Rust)

Have a feature request? [Open an issue](https://github.com/santhoshravindran7/TensorClad/issues).

---

## Resources

- [OWASP Top 10 for LLM Applications](https://owasp.org/www-project-top-10-for-large-language-model-applications/)
- [NIST AI Risk Management Framework](https://www.nist.gov/itl/ai-risk-management-framework)
- [OpenAI Security Best Practices](https://platform.openai.com/docs/guides/safety-best-practices)

---

## License

MIT License - see [LICENSE](LICENSE) for details.

---

## Support

- [Report a Bug](https://github.com/santhoshravindran7/TensorClad/issues/new?template=bug_report.md)
- [Request a Feature](https://github.com/santhoshravindran7/TensorClad/issues/new?template=feature_request.md)
- [Read the Docs](https://github.com/santhoshravindran7/TensorClad/wiki)

---

<p align="center">
  <sub>Built for developers building the next generation of AI applications</sub>
</p>

<p align="center">
  <a href="https://github.com/santhoshravindran7/TensorClad">⭐ Star on GitHub</a>
</p>
