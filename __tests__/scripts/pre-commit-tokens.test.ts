import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';

describe('Pre-commit Token Limit Hook', () => {
  const repoRoot = path.resolve(__dirname, '../..');
  const hookScript = path.join(repoRoot, '.githooks/pre-commit');

  it('hook file exists and is executable', () => {
    expect(fs.existsSync(hookScript)).toBe(true);
    const stats = fs.statSync(hookScript);
    // Check executable bit for owner/group/others
    expect(stats.mode & 0o111).toBeGreaterThan(0);
  });

  it('passes when no files are staged', () => {
    const result = execSync(`${hookScript}`, {
      cwd: repoRoot,
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe']
    });
    expect(result).toBe('');
  });

  it('runs all test-token-pre-commit.sh test scenarios successfully', () => {
    const testScript = path.join(repoRoot, 'scripts/test-token-pre-commit.sh');
    const result = execSync(`bash ${testScript}`, {
      cwd: repoRoot,
      encoding: 'utf-8',
      timeout: 30000
    });
    expect(result).toContain('All 11 tests passed successfully!');
  });
});
