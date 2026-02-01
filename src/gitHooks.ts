import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

const PRE_PUSH_HOOK_CONTENT = `#!/bin/sh
# TensorClad Pre-Push Security Hook
# This hook prevents pushing code with critical security vulnerabilities

# Colors for output
RED='\\033[0;31m'
YELLOW='\\033[1;33m'
GREEN='\\033[0;32m'
NC='\\033[0m' # No Color

echo ""
echo "🛡️  TensorClad Security Check"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check if we should skip (for emergency pushes)
if [ "$TENSORCLAD_SKIP" = "1" ]; then
    echo "\${YELLOW}⚠️  Security check skipped (TENSORCLAD_SKIP=1)\${NC}"
    exit 0
fi

# Create a temporary file to store scan results
RESULT_FILE=$(mktemp)
ERROR_COUNT=0
WARNING_COUNT=0

# Get list of files being pushed
FILES=$(git diff --cached --name-only --diff-filter=ACM | grep -E '\\.(py|js|ts|jsx|tsx)$')

if [ -z "$FILES" ]; then
    echo "\${GREEN}✅ No AI/ML files to scan\${NC}"
    exit 0
fi

# Scan for critical vulnerabilities
for file in $FILES; do
    if [ -f "$file" ]; then
        # TC001-003: API Key patterns
        if grep -nE "(sk-[a-zA-Z0-9]{20,}|sk-proj-[a-zA-Z0-9]+|sk-ant-api[a-zA-Z0-9-]+)" "$file" 2>/dev/null; then
            echo "\${RED}❌ TC001: API key detected in $file\${NC}"
            ERROR_COUNT=$((ERROR_COUNT + 1))
        fi
        
        # TC010: Prompt injection patterns (f-strings with user input)
        if grep -nE 'f"[^"]*\\{user|f"[^"]*\\{input|f"[^"]*\\{query|\\$\\{user|\\$\\{input|\\$\\{query' "$file" 2>/dev/null | grep -v "sanitize\\|validate\\|escape" > /dev/null; then
            echo "\${YELLOW}⚠️  TC010: Potential prompt injection in $file\${NC}"
            WARNING_COUNT=$((WARNING_COUNT + 1))
        fi
        
        # TC060: Dangerous execution patterns
        if grep -nE "eval\\(|exec\\(|Function\\(" "$file" 2>/dev/null; then
            echo "\${RED}❌ TC060: Dangerous code execution in $file\${NC}"
            ERROR_COUNT=$((ERROR_COUNT + 1))
        fi
        
        # TC050: PII in logs
        if grep -nE "print\\(.*email|console\\.log\\(.*email|print\\(.*password|console\\.log\\(.*password|print\\(.*ssn|console\\.log\\(.*ssn" "$file" 2>/dev/null; then
            echo "\${RED}❌ TC050: PII leakage detected in $file\${NC}"
            ERROR_COUNT=$((ERROR_COUNT + 1))
        fi
    fi
done

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ $ERROR_COUNT -gt 0 ]; then
    echo "\${RED}❌ Push blocked: $ERROR_COUNT critical issue(s) found\${NC}"
    echo ""
    echo "Fix the issues above or use TENSORCLAD_SKIP=1 git push to bypass."
    echo "Run 'TensorClad: Show Security Report' in VS Code for details."
    rm -f "$RESULT_FILE"
    exit 1
elif [ $WARNING_COUNT -gt 0 ]; then
    echo "\${YELLOW}⚠️  Push allowed with $WARNING_COUNT warning(s)\${NC}"
    echo "Consider reviewing the warnings above."
fi

echo "\${GREEN}✅ Security check passed\${NC}"
rm -f "$RESULT_FILE"
exit 0
`;

const PRE_COMMIT_HOOK_CONTENT = `#!/bin/sh
# TensorClad Pre-Commit Security Hook
# Quick check for critical issues before commit

RED='\\033[0;31m'
GREEN='\\033[0;32m'
NC='\\033[0m'

# Skip if disabled
if [ "$TENSORCLAD_SKIP" = "1" ]; then
    exit 0
fi

# Get staged files
FILES=$(git diff --cached --name-only --diff-filter=ACM | grep -E '\\.(py|js|ts|jsx|tsx)$')

if [ -z "$FILES" ]; then
    exit 0
fi

ERROR=0

for file in $FILES; do
    if [ -f "$file" ]; then
        # Check for hardcoded API keys (critical)
        if grep -qE "sk-[a-zA-Z0-9]{20,}|sk-proj-[a-zA-Z0-9]+|sk-ant-api[a-zA-Z0-9-]+" "$file" 2>/dev/null; then
            echo "\${RED}❌ TensorClad: API key detected in $file\${NC}"
            ERROR=1
        fi
    fi
done

if [ $ERROR -eq 1 ]; then
    echo ""
    echo "\${RED}Commit blocked: Remove API keys before committing.\${NC}"
    echo "Use TENSORCLAD_SKIP=1 git commit to bypass (not recommended)."
    exit 1
fi

exit 0
`;

export class GitHookManager {
    
    /**
     * Get the .git/hooks directory for the current workspace
     */
    private static getHooksDir(): string | null {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders || workspaceFolders.length === 0) {
            return null;
        }
        
        const gitDir = path.join(workspaceFolders[0].uri.fsPath, '.git');
        if (!fs.existsSync(gitDir)) {
            return null;
        }
        
        const hooksDir = path.join(gitDir, 'hooks');
        if (!fs.existsSync(hooksDir)) {
            fs.mkdirSync(hooksDir, { recursive: true });
        }
        
        return hooksDir;
    }
    
    /**
     * Install the pre-push hook
     */
    static async installPrePushHook(): Promise<boolean> {
        const hooksDir = this.getHooksDir();
        if (!hooksDir) {
            vscode.window.showErrorMessage('TensorClad: No git repository found in workspace');
            return false;
        }
        
        const hookPath = path.join(hooksDir, 'pre-push');
        
        // Check if hook already exists
        if (fs.existsSync(hookPath)) {
            const content = fs.readFileSync(hookPath, 'utf8');
            if (content.includes('TensorClad')) {
                vscode.window.showInformationMessage('TensorClad: Pre-push hook is already installed');
                return true;
            }
            
            // Ask to overwrite
            const choice = await vscode.window.showWarningMessage(
                'A pre-push hook already exists. Overwrite with TensorClad hook?',
                'Overwrite',
                'Cancel'
            );
            
            if (choice !== 'Overwrite') {
                return false;
            }
            
            // Backup existing hook
            fs.copyFileSync(hookPath, hookPath + '.backup');
        }
        
        try {
            fs.writeFileSync(hookPath, PRE_PUSH_HOOK_CONTENT, { mode: 0o755 });
            vscode.window.showInformationMessage('TensorClad: Pre-push security hook installed! 🛡️');
            return true;
        } catch (error) {
            vscode.window.showErrorMessage(`TensorClad: Failed to install hook: ${error}`);
            return false;
        }
    }
    
    /**
     * Install the pre-commit hook
     */
    static async installPreCommitHook(): Promise<boolean> {
        const hooksDir = this.getHooksDir();
        if (!hooksDir) {
            vscode.window.showErrorMessage('TensorClad: No git repository found in workspace');
            return false;
        }
        
        const hookPath = path.join(hooksDir, 'pre-commit');
        
        if (fs.existsSync(hookPath)) {
            const content = fs.readFileSync(hookPath, 'utf8');
            if (content.includes('TensorClad')) {
                vscode.window.showInformationMessage('TensorClad: Pre-commit hook is already installed');
                return true;
            }
            
            const choice = await vscode.window.showWarningMessage(
                'A pre-commit hook already exists. Overwrite with TensorClad hook?',
                'Overwrite',
                'Cancel'
            );
            
            if (choice !== 'Overwrite') {
                return false;
            }
            
            fs.copyFileSync(hookPath, hookPath + '.backup');
        }
        
        try {
            fs.writeFileSync(hookPath, PRE_COMMIT_HOOK_CONTENT, { mode: 0o755 });
            vscode.window.showInformationMessage('TensorClad: Pre-commit security hook installed! 🛡️');
            return true;
        } catch (error) {
            vscode.window.showErrorMessage(`TensorClad: Failed to install hook: ${error}`);
            return false;
        }
    }
    
    /**
     * Install both hooks
     */
    static async installAllHooks(): Promise<void> {
        const prePush = await this.installPrePushHook();
        const preCommit = await this.installPreCommitHook();
        
        if (prePush && preCommit) {
            vscode.window.showInformationMessage(
                'TensorClad: Git hooks installed! Commits and pushes will be checked for security issues. 🛡️'
            );
        }
    }
    
    /**
     * Uninstall TensorClad hooks
     */
    static async uninstallHooks(): Promise<void> {
        const hooksDir = this.getHooksDir();
        if (!hooksDir) {
            vscode.window.showErrorMessage('TensorClad: No git repository found');
            return;
        }
        
        const hooks = ['pre-push', 'pre-commit'];
        let removed = 0;
        
        for (const hook of hooks) {
            const hookPath = path.join(hooksDir, hook);
            if (fs.existsSync(hookPath)) {
                const content = fs.readFileSync(hookPath, 'utf8');
                if (content.includes('TensorClad')) {
                    fs.unlinkSync(hookPath);
                    
                    // Restore backup if exists
                    const backupPath = hookPath + '.backup';
                    if (fs.existsSync(backupPath)) {
                        fs.renameSync(backupPath, hookPath);
                    }
                    
                    removed++;
                }
            }
        }
        
        if (removed > 0) {
            vscode.window.showInformationMessage(`TensorClad: Removed ${removed} git hook(s)`);
        } else {
            vscode.window.showInformationMessage('TensorClad: No hooks to remove');
        }
    }
    
    /**
     * Check if hooks are installed
     */
    static checkHooksStatus(): { prePush: boolean; preCommit: boolean } {
        const hooksDir = this.getHooksDir();
        if (!hooksDir) {
            return { prePush: false, preCommit: false };
        }
        
        const checkHook = (name: string): boolean => {
            const hookPath = path.join(hooksDir, name);
            if (fs.existsSync(hookPath)) {
                const content = fs.readFileSync(hookPath, 'utf8');
                return content.includes('TensorClad');
            }
            return false;
        };
        
        return {
            prePush: checkHook('pre-push'),
            preCommit: checkHook('pre-commit')
        };
    }
}
