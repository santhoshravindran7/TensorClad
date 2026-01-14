# Changelog

All notable changes to the Bastion extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Planned
- Custom rule builder (YAML/JSON)
- CI/CD integration
- Team policy enforcement
- Auto-fix suggestions
- Multi-language support (Java, Go, C#)

## [0.1.0] - 2026-01-14

### Added
- Initial release of Bastion 🛡️
- Real-time security scanning for AI-native applications
- Detection rules for 12 vulnerability types:
  - API Key Exposure (OpenAI, Anthropic, Azure)
  - Prompt Injection attacks
  - Unsanitized user input
  - Hardcoded system prompts
  - Missing output validation
  - RAG security issues
  - PII leakage in logs
  - Insecure tool/function calling
  - Token exposure in responses
  - Missing rate limiting
- Support for Python, JavaScript, TypeScript, React
- Framework detection for:
  - OpenAI SDK
  - LangChain
  - Anthropic Claude
  - Azure OpenAI
  - LlamaIndex
- Automatic scanning on file open and save
- Manual scan commands
- Security report dashboard
- Status bar integration
- Configurable severity levels
- File exclusion patterns
- Context-aware scanning (skip comments, docstrings)

### Security
- All detection patterns tested against false positives
- No data sent to external services
- Privacy-first design

---

## Version History

- **0.1.0** - Initial public release

[Unreleased]: https://github.com/yourusername/bastion/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/yourusername/bastion/releases/tag/v0.1.0
