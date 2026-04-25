import fs from 'node:fs';
import path from 'node:path';

import { buildAgentContext, loadOverrides, validateContextFiles } from './generate-agent-context';

const ROOT_DIR = path.resolve(__dirname, '..');

function normalizePath(filePath: string): string {
  return filePath.split(path.sep).join('/');
}

function validateAgentRouter(rootDir: string): string[] {
  const agentsPath = path.join(rootDir, 'AGENTS.md');
  const content = fs.readFileSync(agentsPath, 'utf8');
  const referenced = content.match(/agent-context\/[A-Za-z0-9._/-]+/g) ?? [];
  const missing: string[] = [];

  for (const reference of new Set(referenced)) {
    if (!fs.existsSync(path.join(rootDir, reference))) {
      missing.push(reference);
    }
  }

  return missing.sort();
}

async function validateOverrides(rootDir: string): Promise<string[]> {
  const overrides = await loadOverrides(rootDir);
  const missing: string[] = [];

  for (const entry of overrides) {
    for (const related of [entry.match, ...entry.relatedFiles]) {
      if (related.includes('*')) {
        continue;
      }
      if (!fs.existsSync(path.join(rootDir, related))) {
        missing.push(related);
      }
    }
  }

  return Array.from(new Set(missing)).sort();
}

function validateNotesLength(rootDir: string): string[] {
  const notesPath = path.join(rootDir, 'agent-context/notes.md');
  const lineCount = fs.readFileSync(notesPath, 'utf8').split(/\r?\n/).length;
  return lineCount > 250 ? [`agent-context/notes.md exceeds 250 lines (${lineCount}).`] : [];
}

async function compareGeneratedOutputs(rootDir: string): Promise<string[]> {
  const expected = await buildAgentContext(rootDir);
  const errors: string[] = [];

  for (const [relativePath, expectedContent] of Object.entries(expected)) {
    const absolutePath = path.join(rootDir, relativePath);
    if (!fs.existsSync(absolutePath)) {
      errors.push(`Missing generated artifact: ${relativePath}`);
      continue;
    }
    const currentContent = fs.readFileSync(absolutePath, 'utf8');
    if (currentContent !== expectedContent) {
      errors.push(`Stale generated artifact: ${relativePath}. Run pnpm run context:generate.`);
    }
  }

  return errors;
}

async function main(): Promise<void> {
  const issues: string[] = [];

  const comparedOutputs = await compareGeneratedOutputs(ROOT_DIR);
  issues.push(...comparedOutputs);

  const missingRouterRefs = validateAgentRouter(ROOT_DIR);
  if (missingRouterRefs.length > 0) {
    issues.push(`AGENTS.md references missing context files: ${missingRouterRefs.join(', ')}`);
  }

  const missingOverridePaths = await validateOverrides(ROOT_DIR);
  if (missingOverridePaths.length > 0) {
    issues.push(`agent-context/overrides.yaml references missing files: ${missingOverridePaths.join(', ')}`);
  }

  issues.push(...validateNotesLength(ROOT_DIR));

  const oversized = await validateContextFiles(ROOT_DIR);
  if (oversized.length > 0) {
    issues.push(
      `Context files exceed size limits: ${oversized
        .map((item) => `${normalizePath(item.file)} (${item.bytes}/${item.limit})`)
        .join(', ')}`,
    );
  }

  if (issues.length > 0) {
    console.error('Agent context check failed:');
    for (const issue of issues) {
      console.error(`- ${issue}`);
    }
    process.exit(1);
  }

  console.log('Agent context is up to date.');
}

main().catch((error) => {
  console.error('Agent context check failed with an error:', error);
  process.exit(1);
});
