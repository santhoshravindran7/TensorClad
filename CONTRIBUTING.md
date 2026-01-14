# Contributing to Bastion

Thank you for your interest in contributing to Bastion! This document provides guidelines and instructions for contributing.

## 🤝 Code of Conduct

We are committed to providing a welcoming and inclusive environment. Please be respectful and professional in all interactions.

## 🐛 Reporting Bugs

Before submitting a bug report:
1. Check existing issues to avoid duplicates
2. Update to the latest version to see if the issue persists
3. Collect relevant information (VS Code version, OS, error messages)

**Bug Report Template:**
```markdown
## Description
Clear description of the bug

## Steps to Reproduce
1. Step one
2. Step two
3. ...

## Expected Behavior
What should happen

## Actual Behavior
What actually happens

## Environment
- OS: [e.g., Windows 11, macOS 14]
- VS Code Version: [e.g., 1.85.0]
- Bastion Version: [e.g., 0.1.0]
- Language: [e.g., Python 3.11]
```

## 💡 Suggesting Features

We welcome feature suggestions! Please:
1. Check if the feature already exists or is planned
2. Clearly describe the problem it solves
3. Provide examples of how it would work

## 🔧 Development Setup

### Prerequisites
- Node.js 20+
- VS Code 1.85.0+
- Git

### Setup Steps

```bash
# Fork and clone the repository
git clone https://github.com/yourusername/bastion.git
cd bastion

# Install dependencies
npm install

# Compile TypeScript
npm run compile

# Watch mode (auto-recompile on changes)
npm run watch
```

### Running the Extension

1. Open the project in VS Code
2. Press `F5` to launch Extension Development Host
3. Test your changes in the new VS Code window

## 📝 Coding Standards

### TypeScript Guidelines
- Use strict TypeScript configuration
- Add type annotations for all public APIs
- Avoid `any` types - use proper typing
- Use modern ES2022 features
- Follow existing code style

### Code Style
```typescript
// ✅ Good
export function scanDocument(document: vscode.TextDocument): Promise<void> {
    const config = vscode.workspace.getConfiguration('bastion');
    // ...
}

// ❌ Bad
export function scanDocument(document: any) {
    let config = vscode.workspace.getConfiguration('bastion');
    // ...
}
```

### Naming Conventions
- Files: `camelCase.ts`
- Classes: `PascalCase`
- Functions: `camelCase`
- Constants: `UPPER_SNAKE_CASE`
- Interfaces: `PascalCase` (no `I` prefix)

## 🧪 Testing

### Running Tests
```bash
npm run test
```

### Writing Tests
- Place tests in `src/test/`
- Follow naming: `*.test.ts`
- Test both success and failure cases
- Mock VS Code APIs appropriately

## 📦 Adding New Detection Rules

### Rule Structure
```typescript
{
    id: 'unique-rule-id',
    type: VulnerabilityType.YourType,
    severity: vscode.DiagnosticSeverity.Error,
    message: 'Clear, actionable message for developers',
    code: 'BST###', // Get next available code
    patterns: [
        /your-regex-pattern/g,
        /alternative-pattern/g
    ],
    languageIds: ['python', 'javascript', 'typescript'],
    documentation: 'Detailed explanation with examples and fixes'
}
```

### Rule Guidelines
1. **Be Specific**: Target actual vulnerabilities, not false positives
2. **Be Helpful**: Include fix suggestions in documentation
3. **Be Performant**: Optimize regex patterns
4. **Be Tested**: Include test cases for your rule

### Example Rule PR
```typescript
// Add to src/rules/ruleEngine.ts
{
    id: 'langchain-memory-leak',
    type: VulnerabilityType.PiiLeakage,
    severity: vscode.DiagnosticSeverity.Warning,
    message: 'LangChain memory may persist sensitive data. Use ephemeral memory.',
    code: 'BST090',
    patterns: [
        /ConversationBufferMemory\([^)]*(?!ephemeral)/g
    ],
    languageIds: ['python', 'javascript', 'typescript'],
    documentation: 'Use ConversationBufferMemory(ephemeral=True) to prevent data persistence'
}
```

## 🎨 UI/UX Contributions

- Follow VS Code design guidelines
- Use VS Code theme variables for colors
- Ensure accessibility (screen readers, keyboard navigation)
- Test with both light and dark themes

## 📚 Documentation

- Update README.md for user-facing changes
- Add JSDoc comments for public APIs
- Update CHANGELOG.md following [Keep a Changelog](https://keepachangelog.com/)

## 🔀 Pull Request Process

### Before Submitting
1. ✅ Run `npm run lint` - no errors
2. ✅ Run `npm run test` - all tests pass
3. ✅ Test manually in Extension Development Host
4. ✅ Update documentation if needed
5. ✅ Add entry to CHANGELOG.md

### PR Template
```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Tested manually
- [ ] Added/updated tests
- [ ] All tests pass

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] No new warnings
```

### Review Process
1. Maintainers will review within 3-5 business days
2. Address feedback and update PR
3. Once approved, maintainers will merge

## 🏆 Recognition

Contributors will be:
- Listed in README.md
- Credited in release notes
- Mentioned in social media announcements

## 📞 Questions?

- Open a [Discussion](https://github.com/yourusername/bastion/discussions)
- Join our [Discord](https://discord.gg/bastion) (coming soon)
- Email: contributors@bastion-security.dev

## 📄 License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

**Thank you for helping make AI applications more secure! 🛡️**
