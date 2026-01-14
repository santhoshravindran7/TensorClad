# Security Policy

## Reporting a Vulnerability

We take the security of Bastion seriously. If you discover a security vulnerability, please follow these steps:

### How to Report

**Please DO NOT report security vulnerabilities through public GitHub issues.**

Instead, please report them via:
- **Email**: security@bastion-security.dev
- **Subject**: `[SECURITY] Brief description of the issue`

### What to Include

Please include as much information as possible:
- Type of vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if available)
- Your contact information

### Response Timeline

- **Initial Response**: Within 48 hours
- **Status Update**: Within 7 days
- **Fix Timeline**: Depends on severity
  - Critical: 1-7 days
  - High: 7-14 days
  - Medium: 14-30 days
  - Low: 30-90 days

### Disclosure Policy

- We will acknowledge receipt of your vulnerability report
- We will confirm the vulnerability and determine its severity
- We will work on a fix and release it as soon as possible
- We will notify you when the fix is released
- We will credit you in the release notes (unless you prefer to remain anonymous)

### Bug Bounty

We do not currently have a bug bounty program, but we deeply appreciate security researchers' efforts in keeping our users safe.

### Security Best Practices for Users

1. **Keep Updated**: Always use the latest version of Bastion
2. **Verify Source**: Only install Bastion from the official VS Code Marketplace
3. **Report Issues**: Report any suspicious behavior immediately
4. **Check Permissions**: Review extension permissions before installation

### Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 0.1.x   | :white_check_mark: |
| < 0.1   | :x:                |

### Security Features

Bastion is designed with security in mind:
- **Local Processing**: All scanning happens locally, no data sent to external servers
- **No Telemetry**: We don't collect usage data or analytics
- **Open Source**: Source code is available for audit
- **Minimal Permissions**: Only requires file system access for scanning
- **Privacy First**: No API keys or credentials are stored by the extension

### Contact

For general security questions: security@bastion-security.dev

---

**Thank you for helping keep Bastion and its users safe! 🛡️**
