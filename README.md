# Bastion 🛡️

**AI-Native Application Security Scanner for VS Code**

Bastion is a powerful Visual Studio Code extension that helps developers build secure AI applications by detecting vulnerabilities specific to Large Language Models (LLMs), AI agents, and modern AI frameworks.

![Version](https://img.shields.io/badge/version-0.1.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![VS Code](https://img.shields.io/badge/VS%20Code-1.85.0+-007ACC)

## 🎯 Why Bastion?

Traditional security tools focus on Web 2.0 vulnerabilities (SQL injection, XSS, CSRF), but **AI-native applications face entirely new threats**:

- **Prompt Injection Attacks** - Malicious inputs that manipulate LLM behavior
- **API Key Exposure** - Hardcoded credentials in source code
- **Unsanitized User Input** - Direct concatenation into prompts
- **RAG Security Issues** - Vector database injection vulnerabilities
- **PII Leakage** - Sensitive data in logs or model outputs
- **Insecure Tool Calling** - Unvalidated function execution
- **Missing Output Validation** - Raw LLM outputs used without checks

Bastion detects these issues **in real-time** as you code, helping you build secure AI applications from the start.

## ✨ Features

### 🔍 Real-Time Security Scanning
- Automatically scans files on open and save
- Inline diagnostics with actionable fix suggestions
- Support for Python, JavaScript, TypeScript, and React

### 🧠 AI Framework Awareness
Detects vulnerabilities in popular AI frameworks:
- OpenAI SDK (Python & JavaScript/TypeScript)
- LangChain
- Anthropic Claude
- Azure OpenAI
- LlamaIndex

### 🛡️ Comprehensive Vulnerability Detection

#### API Key Exposure (BST001-003)
```python
# ❌ Detected by Bastion
api_key = "sk-proj-abc123..."

# ✅ Secure alternative
api_key = os.getenv("OPENAI_API_KEY")
```

#### Prompt Injection (BST010-011)
```python
# ❌ Vulnerable to prompt injection
prompt = f"Summarize: {user_input}"

# ✅ Sanitized input
prompt = f"Summarize: {sanitize(user_input)}"
```

#### Hardcoded Prompts (BST020)
```python
# ⚠️ Bastion suggests externalizing
system_prompt = "You are a helpful assistant..."

# ✅ Better approach - external config
system_prompt = load_prompt_from_config()
```

#### Output Validation (BST030)
```python
# ⚠️ Unvalidated LLM output
result = response.choices[0].message.content

# ✅ Validated output
result = validate_and_sanitize(response.choices[0].message.content)
```

### 📊 Security Dashboard
View comprehensive security reports with:
- Total issues by severity
- Vulnerability type breakdown
- Files scanned
- Trend analysis

## 🚀 Quick Start

### Installation

1. Open VS Code
2. Go to Extensions (`Ctrl+Shift+X` / `Cmd+Shift+X`)
3. Search for "Bastion"
4. Click Install

### Usage

Bastion works automatically once installed:

1. **Automatic Scanning** - Opens and saved files are scanned automatically
2. **Manual Scan** - Right-click in editor → "Bastion: Scan Current File"
3. **Workspace Scan** - Command Palette → "Bastion: Scan Entire Workspace"
4. **View Report** - Click Bastion icon in status bar

### Commands

| Command | Description |
|---------|-------------|
| `Bastion: Scan Current File` | Scan the active file |
| `Bastion: Scan Entire Workspace` | Scan all supported files |
| `Bastion: Show Security Report` | Open security dashboard |
| `Bastion: Clear Diagnostics` | Clear all warnings |

## ⚙️ Configuration

Customize Bastion in VS Code settings:

```json
{
  "bastion.enabled": true,
  "bastion.scanOnSave": true,
  "bastion.scanOnOpen": true,
  "bastion.severity": {
    "promptInjection": "error",
    "apiKeyExposure": "error",
    "unsanitizedInput": "warning",
    "missingValidation": "warning",
    "insecureRag": "warning",
    "piiLeakage": "error"
  },
  "bastion.excludePatterns": [
    "**/node_modules/**",
    "**/dist/**",
    "**/.venv/**"
  ],
  "bastion.frameworks": [
    "openai",
    "langchain",
    "anthropic",
    "azure-openai"
  ]
}
```

## 🏗️ Supported Languages & Frameworks

### Languages
- ✅ Python
- ✅ JavaScript
- ✅ TypeScript
- ✅ React (JSX/TSX)

### AI Frameworks
- ✅ OpenAI SDK
- ✅ LangChain
- ✅ Anthropic Claude
- ✅ Azure OpenAI
- ✅ LlamaIndex
- 🔄 More coming soon...

## 📋 Vulnerability Codes

| Code | Type | Severity | Description |
|------|------|----------|-------------|
| BST001 | API Key Exposure | Error | OpenAI API key detected |
| BST002 | API Key Exposure | Error | Anthropic API key detected |
| BST003 | API Key Exposure | Error | Azure API key detected |
| BST010 | Prompt Injection | Error | Direct user input in prompt |
| BST011 | Unsanitized Input | Warning | Unsanitized user input |
| BST020 | Hardcoded Prompt | Warning | System prompt in code |
| BST030 | Unvalidated Output | Warning | Missing output validation |
| BST040 | Insecure RAG | Warning | Unsafe vector DB query |
| BST050 | PII Leakage | Error | PII in logs |
| BST060 | Insecure Tool Call | Error | Unsafe function execution |
| BST070 | Token Exposure | Error | Credentials in response |
| BST080 | Missing Validation | Warning | No rate limiting |

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for details.

### Development Setup

```bash
# Clone the repository
git clone https://github.com/yourusername/bastion.git
cd bastion

# Install dependencies
npm install

# Compile TypeScript
npm run compile

# Watch mode for development
npm run watch

# Run extension in debug mode
# Press F5 in VS Code
```

### Adding New Rules

Create detection rules in `src/rules/ruleEngine.ts`:

```typescript
{
  id: 'my-custom-rule',
  type: VulnerabilityType.CustomType,
  severity: vscode.DiagnosticSeverity.Warning,
  message: 'Your custom security message',
  code: 'BST100',
  patterns: [/your-regex-pattern/g],
  languageIds: ['python', 'javascript'],
  documentation: 'Detailed explanation and fix'
}
```

## 📖 Resources

- [OWASP Top 10 for LLM Applications](https://owasp.org/www-project-top-10-for-large-language-model-applications/)
- [NIST AI Risk Management Framework](https://www.nist.gov/itl/ai-risk-management-framework)
- [Azure OpenAI Security Best Practices](https://learn.microsoft.com/azure/ai-services/openai/how-to/security)

## 🗺️ Roadmap

- [ ] Custom rule builder (YAML/JSON)
- [ ] CI/CD integration
- [ ] Team policy enforcement
- [ ] Compliance reporting (OWASP LLM, NIST AI)
- [ ] Model provenance tracking
- [ ] SBOM for AI dependencies
- [ ] Multi-language support (Java, Go, C#)
- [ ] Auto-fix suggestions

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details

## 💬 Support

- 🐛 [Report Issues](https://github.com/yourusername/bastion/issues)
- 💡 [Request Features](https://github.com/yourusername/bastion/issues/new)
- 📧 Email: support@bastion-security.dev

## 🌟 Star Us!

If Bastion helps secure your AI applications, please star the repository!

---

**Built with ❤️ for the AI security community**
