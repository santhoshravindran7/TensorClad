<p align="center">
  <img src="resources/icon.png" alt="Bastion Logo" width="128" height="128">
</p>

<h1 align="center">Bastion</h1>

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

##  Why Bastion?

Traditional security tools focus on Web 2.0 vulnerabilities (SQL injection, XSS, CSRF), but **AI-native applications face entirely new threats**. Bastion is purpose-built to detect security issues specific to LLMs, AI agents, and modern AI frameworks.

<!-- Screenshot: Main view showing detected vulnerabilities -->
<!-- ![Bastion in Action](docs/images/bastion-overview.png) -->

### The Problem

When building AI applications with OpenAI, LangChain, or other LLM frameworks, developers often introduce vulnerabilities like:

```python
#  This code has 3 security issues. Can you spot them?

api_key = "sk-proj-abc123..."  # Hardcoded API key

def chat(user_input):
    prompt = f"Help the user with: {user_input}"  # Prompt injection
    response = openai.chat.completions.create(
        model="gpt-4",
        messages=[{"role": "user", "content": prompt}]
    )
    return response.choices[0].message.content  # Unvalidated output
```

**Bastion catches all of these in real-time, right in your editor.**

---

##  Features

###  Real-Time Scanning
Bastion scans your code as you type, highlighting vulnerabilities instantly with detailed fix suggestions.

<!-- Screenshot: Real-time detection with highlighting -->
<!-- ![Real-time Detection](docs/images/realtime-detection.png) -->

###  Security Dashboard
Get a comprehensive view of all security issues across your workspace with the built-in security report.

<!-- Screenshot: Security Report Dashboard -->
<!-- ![Security Dashboard](docs/images/security-report.png) -->

###  AI Framework Support
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

##  Installation

### From VS Code Marketplace
1. Open VS Code
2. Press `Ctrl+Shift+X` (Windows/Linux) or `Cmd+Shift+X` (Mac)
3. Search for **"Bastion"**
4. Click **Install**

### From VSIX (Manual)
```bash
code --install-extension bastion-0.1.0.vsix
```

---

##  Demo

<!-- Add your demo video here -->
<!-- [![Bastion Demo](docs/images/demo-thumbnail.png)](https://youtube.com/your-demo-video) -->

**See Bastion in action:** [Watch Demo Video](#) *(coming soon)*

---

##  Vulnerability Detection

Bastion detects these AI-specific security vulnerabilities:

### BST001-003: API Key Exposure

```python
#  VULNERABLE - Detected by Bastion
openai.api_key = "sk-proj-abc123def456..."

#  SECURE - Use environment variables
openai.api_key = os.getenv("OPENAI_API_KEY")
```

### BST010: Prompt Injection

```python
#  VULNERABLE - User input directly in prompt
prompt = f"Summarize this text: {user_input}"

#  SECURE - Sanitize and validate input
prompt = f"Summarize this text: {sanitize_input(user_input)}"
```

### BST020: Hardcoded System Prompts

```python
#  WARNING - Externalize for security
messages = [
    {"role": "system", "content": "You are a helpful assistant..."}
]

#  BETTER - Load from secure config
messages = [
    {"role": "system", "content": load_prompt("assistant")}
]
```

### BST030: Unvalidated LLM Output

```python
#  VULNERABLE - Raw output used without validation
result = response.choices[0].message.content
exec(result)  # Dangerous!

#  SECURE - Validate before use
result = response.choices[0].message.content
if is_safe_output(result):
    process(result)
```

### BST050: PII Leakage

```python
#  VULNERABLE - Logging sensitive data
print(f"User email: {user.email}, Query: {query}")

#  SECURE - Redact PII from logs
print(f"User: [REDACTED], Query: {redact_pii(query)}")
```

### BST060: Insecure Tool Execution

```python
#  VULNERABLE - Dynamic execution without validation
eval(llm_response)
exec(user_provided_code)

#  SECURE - Whitelist allowed operations
if operation in ALLOWED_OPERATIONS:
    safe_execute(operation)
```

### Full Vulnerability Reference

| Code | Type | Severity | Description |
|------|------|:--------:|-------------|
| BST001 | API Key Exposure |  Error | OpenAI API key in source code |
| BST002 | API Key Exposure |  Error | Anthropic API key in source code |
| BST003 | API Key Exposure |  Error | Azure API key in source code |
| BST010 | Prompt Injection |  Error | Direct user input concatenation |
| BST011 | Unsanitized Input |  Warning | Input passed without validation |
| BST020 | Hardcoded Prompt |  Warning | System prompts in source code |
| BST030 | Unvalidated Output |  Warning | LLM output used without checks |
| BST040 | Insecure RAG |  Warning | Unsafe vector DB queries |
| BST050 | PII Leakage |  Error | Sensitive data in logs/output |
| BST060 | Insecure Tool Call |  Error | Dynamic code execution |
| BST070 | Token Exposure |  Error | Credentials in responses |
| BST080 | Missing Rate Limit |  Warning | No rate limiting on API calls |

---

##  Commands

Access via Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`):

| Command | Description |
|---------|-------------|
| `Bastion: Scan Current File` | Scan the active file for vulnerabilities |
| `Bastion: Scan Entire Workspace` | Scan all supported files in workspace |
| `Bastion: Show Security Report` | Open the security dashboard |
| `Bastion: Clear Diagnostics` | Clear all Bastion warnings |

---

##  Configuration

Customize Bastion in your VS Code settings (`settings.json`):

```json
{
  "bastion.enabled": true,
  "bastion.scanOnSave": true,
  "bastion.scanOnOpen": true,
  "bastion.excludePatterns": [
    "**/node_modules/**",
    "**/dist/**",
    "**/.venv/**"
  ]
}
```

### Configuration Options

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `bastion.enabled` | boolean | `true` | Enable/disable scanning |
| `bastion.scanOnSave` | boolean | `true` | Scan when files are saved |
| `bastion.scanOnOpen` | boolean | `true` | Scan when files are opened |
| `bastion.excludePatterns` | array | `[...]` | Glob patterns to exclude |

---

##  Supported Languages

| Language | Extensions | Status |
|----------|------------|:------:|
| Python | `.py` |  |
| JavaScript | `.js`, `.jsx` |  |
| TypeScript | `.ts`, `.tsx` |  |
| Java | `.java` |  Planned |
| Go | `.go` |  Planned |
| C# | `.cs` |  Planned |

---

##  Contributing

We welcome contributions! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

### Development Setup

```bash
# Clone the repository
git clone https://github.com/santhoshravindran7/bastion.git
cd bastion

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
    code: 'BST100',
    patterns: [/your-regex-pattern/g],
    languageIds: ['python', 'javascript', 'typescript'],
    documentation: 'How to fix this issue'
}
```

---

##  Resources

- [OWASP Top 10 for LLM Applications](https://owasp.org/www-project-top-10-for-large-language-model-applications/)
- [NIST AI Risk Management Framework](https://www.nist.gov/itl/ai-risk-management-framework)
- [OpenAI Security Best Practices](https://platform.openai.com/docs/guides/safety-best-practices)

---

##  Roadmap

- [ ] Custom rule builder (YAML/JSON config)
- [ ] CI/CD integration (GitHub Actions, GitLab CI)
- [ ] Quick-fix code actions
- [ ] Compliance reporting (OWASP LLM, NIST AI RMF)
- [ ] Team policy enforcement
- [ ] Multi-language support (Java, Go, C#)
- [ ] AI-powered fix suggestions

---

##  License

MIT License - see [LICENSE](LICENSE) for details.

---

##  Support

-  [Report a Bug](https://github.com/santhoshravindran7/bastion/issues/new?template=bug_report.md)
-  [Request a Feature](https://github.com/santhoshravindran7/bastion/issues/new?template=feature_request.md)
-  [Documentation](https://github.com/santhoshravindran7/bastion/wiki)

---

<p align="center">
  <strong>Built with  for the AI security community</strong>
</p>

<p align="center">
  <a href="https://github.com/santhoshravindran7/bastion"> Star us on GitHub!</a>
</p>
