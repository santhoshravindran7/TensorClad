# TensorClad - Quick Start Guide

## 🚀 For Users

### Installation
1. Open VS Code
2. Press `Ctrl+Shift+X` (Windows/Linux) or `Cmd+Shift+X` (Mac)
3. Search for "TensorClad"
4. Click "Install"

### First Steps
1. Open any Python or JavaScript/TypeScript file
2. TensorClad automatically scans for AI security issues
3. Check the **Problems** panel (`Ctrl+Shift+M`) for issues
4. Click on any issue to see details and fixes

### Commands
- `TensorClad: Scan Current File` - Manual scan
- `TensorClad: Scan Entire Workspace` - Scan all files
- `TensorClad: Show Security Report` - View dashboard
- Click the 🛡️ shield icon in status bar for quick access

---

## 🛠️ For Developers

### Development Setup

```bash
# Clone the repository
git clone <your-repo-url>
cd TensorClad

# Install dependencies
npm install

# Compile TypeScript
npm run compile

# Start watch mode
npm run watch
```

### Running the Extension

1. Open project in VS Code
2. Press **F5** to launch Extension Development Host
3. A new VS Code window opens with the extension loaded
4. Open `examples/test_vulnerable.py` to see detections
5. Check the Problems panel for detected vulnerabilities

### Testing

```bash
# Run linter
npm run lint

# Run tests (when available)
npm test

# Build for production
npm run compile
```

### Project Structure

```
TensorClad/
├── src/
│   ├── extension.ts          # Main extension entry point
│   ├── scanner.ts             # Code scanning engine
│   ├── diagnostics.ts         # VS Code diagnostics manager
│   └── rules/
│       └── ruleEngine.ts      # Detection rules
├── examples/
│   ├── test_vulnerable.py     # Python test cases
│   └── vulnerable-code.md     # Documentation examples
├── .vscode/
│   ├── launch.json            # Debug configuration
│   ├── tasks.json             # Build tasks
│   └── settings.json          # Workspace settings
├── dist/                      # Compiled output
├── package.json               # Extension manifest
├── tsconfig.json              # TypeScript config
├── esbuild.js                 # Build configuration
├── README.md                  # User documentation
├── CONTRIBUTING.md            # Contributor guide
├── SECURITY.md                # Security policy
└── CHANGELOG.md               # Version history
```

### Adding New Detection Rules

Edit `src/rules/ruleEngine.ts`:

```typescript
{
    id: 'my-new-rule',
    type: VulnerabilityType.YourType,
    severity: vscode.DiagnosticSeverity.Error,
    message: 'Clear description of the issue',
    code: 'TC100', // Get next available number
    patterns: [
        /your-regex-pattern/g,
        /alternative-pattern/g
    ],
    languageIds: ['python', 'javascript', 'typescript'],
    documentation: 'Explanation and fix suggestions'
}
```

### Key Files to Know

- **extension.ts**: Main activation, commands, event handlers
- **scanner.ts**: Core scanning logic, pattern matching
- **diagnostics.ts**: VS Code diagnostics integration
- **ruleEngine.ts**: All detection rules and patterns

### Debugging

1. Set breakpoints in TypeScript files
2. Press F5 to start debugging
3. Extension Development Host opens
4. Your breakpoints will be hit when code executes
5. Use Debug Console for inspection

### Common Tasks

**Add a new vulnerability type:**
1. Add enum to `VulnerabilityType` in `diagnostics.ts`
2. Create detection rule in `ruleEngine.ts`
3. Test with example file
4. Update documentation

**Modify severity:**
Edit the `severity` property in the rule definition

**Support new language:**
1. Add language ID to supported list
2. Add comment patterns to `scanner.ts`
3. Create test file in `examples/`

---

## 📦 Publishing

### Prerequisites
```bash
npm install -g @vscode/vsce
```

### Build Package
```bash
# Create .vsix package
vsce package

# Test the package locally
code --install-extension tensorclad-0.1.0.vsix
```

### Publish to Marketplace
```bash
# Login to Visual Studio Marketplace
vsce login <your-publisher-name>

# Publish
vsce publish
```

---

## 🧪 Testing the Extension

### Test with Example Files

```bash
# Open the example vulnerable file
code examples/test_vulnerable.py
```

Expected detections:
- ✅ API key exposure (TC001-003)
- ✅ Prompt injection (TC010)
- ✅ Unsanitized input (TC011)
- ✅ Hardcoded prompts (TC020)
- ✅ Unvalidated output (TC030)
- ✅ RAG issues (TC040)
- ✅ PII leakage (TC050)
- ✅ Insecure tool calls (TC060)

### Manual Testing Checklist

- [ ] Extension activates without errors
- [ ] Status bar shows TensorClad shield icon
- [ ] Scan current file command works
- [ ] Scan workspace command works
- [ ] Problems panel shows diagnostics
- [ ] Security report opens
- [ ] Configuration changes take effect
- [ ] Exclude patterns work correctly

---

## 🤝 Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines.

Quick checklist:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run `npm run lint` and fix issues
5. Test thoroughly
6. Submit a pull request

---

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/santhoshravindran7/TensorClad/issues)
- **Discussions**: [GitHub Discussions](https://github.com/santhoshravindran7/TensorClad/discussions)
- **Email**: support@tensorclad-security.dev

---

**Happy secure coding! 🛡️**
