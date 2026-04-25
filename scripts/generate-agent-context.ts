import fs from 'node:fs';
import path from 'node:path';

type OverrideEntry = {
  match: string;
  taskTags: string[];
  notes: string[];
  priority: number;
  relatedFiles: string[];
};

type TaskDefinition = {
  taskId: string;
  title: string;
  triggers: string[];
  matchers: string[];
  startHints: string[];
  testCandidates: string[];
  riskAreas: string[];
};

type RouteEntry = {
  kind: 'page' | 'api';
  route: string;
  file: string;
  params: string[];
  likelySourceFiles: string[];
};

type GraphNode = {
  file: string;
  type: string;
  tags: string[];
  imports: string[];
  importedBy: string[];
  related: string[];
  overrideNotes: string[];
};

const GENERATED_DIR = 'agent-context';
const GENERATED_FILES = [
  'index.json',
  'routes.json',
  'data-model.json',
  'tasks.json',
  'tests.json',
  'graph.json',
] as const;

const TASK_DEFINITIONS: TaskDefinition[] = [
  {
    taskId: 'player-crud',
    title: 'Player CRUD',
    triggers: ['player', 'players', 'add player', 'edit player', 'delete player'],
    matchers: [
      'app/api/players/**',
      'app/players/page.tsx',
      'app/components/Player*.tsx',
      'app/page.tsx',
    ],
    startHints: [
      'app/api/players/route.ts',
      'app/api/players/[id]/route.ts',
      'app/players/page.tsx',
      'app/page.tsx',
      'db/schema.ts',
    ],
    testCandidates: [],
    riskAreas: [
      'API responses are enriched and consumed directly by UI components.',
      'Deleting players is blocked when match history exists.',
    ],
  },
  {
    taskId: 'match-recording',
    title: 'Match Recording',
    triggers: ['match', 'record match', 'games', 'score entry', 'record result'],
    matchers: [
      'app/api/matches/**',
      'app/api/games/**',
      'app/components/RecordMatchModal.tsx',
      'app/components/RecentMatches.tsx',
      'app/components/GameHistory.tsx',
      'app/page.tsx',
    ],
    startHints: [
      'app/components/RecordMatchModal.tsx',
      'app/api/matches/route.ts',
      'app/api/games/route.ts',
      'app/page.tsx',
      'db/schema.ts',
    ],
    testCandidates: ['__tests__/api/matches.test.ts'],
    riskAreas: [
      'Team slots are positional and support up to three players per side.',
      'POST /api/matches accepts both direct form payloads and image-analysis payloads.',
    ],
  },
  {
    taskId: 'stats-rankings',
    title: 'Stats and Rankings',
    triggers: ['stats', 'rankings', 'trend', 'win percentage', 'performance'],
    matchers: [
      'app/api/player-stats/**',
      'app/api/player-trends/**',
      'app/api/team-performance/**',
      'app/api/trends/**',
      'app/lib/stats.ts',
      'app/components/Performance*.tsx',
      'app/components/WinPercentageRankings.tsx',
      'app/components/TopTeams.tsx',
      'app/components/SeasonWinners.tsx',
      'app/results/page.tsx',
    ],
    startHints: [
      'app/api/player-stats/route.ts',
      'app/lib/stats.ts',
      'app/components/WinPercentageRankings.tsx',
      'app/components/PerformanceTrend.tsx',
      'app/api/team-performance/route.ts',
    ],
    testCandidates: [
      '__tests__/api/player-stats.test.ts',
      '__tests__/api/player-trends.test.ts',
      '__tests__/api/seasonal-player-stats.test.ts',
      '__tests__/api/team-performance.test.ts',
    ],
    riskAreas: [
      'The repo mixes match-level and game-level statistics; verify semantics before editing.',
      'Several ranking surfaces depend on season filtering and shared player stat shapes.',
    ],
  },
  {
    taskId: 'season-logic',
    title: 'Season Logic',
    triggers: ['season', 'quarter', 'current season', 'historical season'],
    matchers: [
      'lib/seasons.ts',
      'app/api/seasons/**',
      'app/hooks/useSeasonChampions.ts',
      'app/hooks/useTopTeams.ts',
      'app/components/Season*.tsx',
      'app/page.tsx',
    ],
    startHints: [
      'lib/seasons.ts',
      'app/api/seasons/route.ts',
      'app/api/seasons/current/route.ts',
      'app/components/SeasonSelector.tsx',
      'app/hooks/useTopTeams.ts',
    ],
    testCandidates: [
      '__tests__/api/seasons.test.ts',
      '__tests__/components/SeasonSelector.test.tsx',
      '__tests__/api/seasonal-player-stats.test.ts',
    ],
    riskAreas: [
      'Season IDs are computed, not stored as an actively managed table.',
      'Quarterly, annual, current, and lifetime season modes share the same APIs.',
    ],
  },
  {
    taskId: 'ai-chatbot',
    title: 'AI and Chatbot',
    triggers: ['ai', 'chatbot', 'summary', 'prompt', 'image analysis', 'team suggestion'],
    matchers: [
      'app/api/chatbot/**',
      'app/api/daily-summary/**',
      'app/components/ChatBot.tsx',
      'app/components/AISummaryPanel.tsx',
      'app/components/TeamSuggestionModal.tsx',
      'app/lib/openai.ts',
      'app/lib/prompts.ts',
      'app/lib/modelClient.ts',
      'lib/rag.ts',
      'app/page.tsx',
    ],
    startHints: [
      'app/api/chatbot/route.ts',
      'app/components/ChatBot.tsx',
      'app/lib/openai.ts',
      'app/lib/prompts.ts',
      'lib/rag.ts',
    ],
    testCandidates: [],
    riskAreas: [
      'Prompt behavior depends on season-aware stat payloads and RAG content.',
      'The dashboard root page launches AI flows and team suggestion workflows.',
    ],
  },
  {
    taskId: 'achievements',
    title: 'Achievements',
    triggers: ['achievement', 'badge', 'milestone'],
    matchers: [
      'app/api/achievements/**',
      'app/components/PlayerAchievements.tsx',
      'db/schema.ts',
    ],
    startHints: [
      'app/api/achievements/player/[playerId]/route.ts',
      'app/api/achievements/check/[playerId]/route.ts',
      'app/components/PlayerAchievements.tsx',
      'db/schema.ts',
    ],
    testCandidates: [],
    riskAreas: [
      'Achievement state spans both definitions and player-achievement joins.',
      'UI and APIs assume achievement metadata and unlock timestamps are present together.',
    ],
  },
];

const CONTEXT_LIMITS: Record<string, number> = {
  'AGENTS.md': 6_000,
  'agent-context/index.json': 18_000,
  'agent-context/routes.json': 18_000,
  'agent-context/data-model.json': 18_000,
  'agent-context/tasks.json': 20_000,
  'agent-context/tests.json': 18_000,
  'agent-context/graph.json': 28_000,
  'agent-context/notes.md': 12_000,
};

const ROOT_DIR = path.resolve(__dirname, '..');

function normalizePath(filePath: string): string {
  return filePath.split(path.sep).join('/');
}

function stableUnique(values: string[]): string[] {
  return Array.from(new Set(values)).sort();
}

function listFiles(rootDir: string, startDir: string): string[] {
  const absolute = path.join(rootDir, startDir);
  if (!fs.existsSync(absolute)) {
    return [];
  }

  const entries = fs.readdirSync(absolute, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const absoluteEntry = path.join(absolute, entry.name);
    if (entry.isDirectory()) {
      files.push(...listFiles(rootDir, normalizePath(path.join(startDir, entry.name))));
      continue;
    }
    files.push(normalizePath(path.relative(rootDir, absoluteEntry)));
  }

  return files.sort();
}

async function readText(rootDir: string, relativePath: string): Promise<string> {
  return fs.promises.readFile(path.join(rootDir, relativePath), 'utf8');
}

function matchesGlob(filePath: string, pattern: string): boolean {
  const segments = normalizePath(pattern).split('/');
  let regex = '^';

  for (let index = 0; index < segments.length; index += 1) {
    const segment = segments[index];
    if (segment === '**') {
      regex += '(?:[^/]+/)*';
      continue;
    }

    const escapedSegment = segment
      .replace(/[.+^${}()|[\]\\]/g, '\\$&')
      .replace(/\*/g, '[^/]*');

    regex += escapedSegment;

    if (index < segments.length - 1 && segments[index + 1] !== '**') {
      regex += '/';
    }
  }

  regex += '$';
  return new RegExp(regex).test(normalizePath(filePath));
}

function parseInlineList(rawValue: string): string[] {
  const trimmed = rawValue.trim();
  const withoutBrackets = trimmed.startsWith('[') && trimmed.endsWith(']')
    ? trimmed.slice(1, -1)
    : trimmed;
  return withoutBrackets
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
}

function parseYamlOverrides(content: string): OverrideEntry[] {
  const lines = content.split(/\r?\n/);
  const overrides: OverrideEntry[] = [];
  let current: OverrideEntry | null = null;
  let activeList: 'notes' | 'relatedFiles' | null = null;

  const pushCurrent = () => {
    if (!current) {
      return;
    }
    if (!current.match) {
      throw new Error('Every override entry must include a match value.');
    }
    current.taskTags = stableUnique(current.taskTags);
    current.relatedFiles = stableUnique(current.relatedFiles);
    current.notes = current.notes.filter(Boolean);
    overrides.push(current);
  };

  for (const rawLine of lines) {
    const line = rawLine.replace(/\t/g, '  ');
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }

    if (trimmed === 'overrides:') {
      continue;
    }

    if (/^\s{4,}- /.test(line)) {
      if (!activeList || !current) {
        throw new Error(`Unexpected YAML list item without an active field: ${line}`);
      }
      const value = trimmed.slice(2).trim();
      current[activeList].push(value);
      continue;
    }

    if (/^\s{2}- /.test(line) || trimmed.startsWith('- ')) {
      pushCurrent();
      current = {
        match: '',
        taskTags: [],
        notes: [],
        priority: 50,
        relatedFiles: [],
      };
      activeList = null;
      const pair = trimmed.slice(2);
      if (pair) {
        assignYamlField(current, pair);
      }
      continue;
    }

    if (!current) {
      throw new Error(`Invalid override line before first entry: ${line}`);
    }

    if (line.startsWith('  ')) {
      activeList = assignYamlField(current, trimmed);
      continue;
    }

    throw new Error(`Unsupported overrides YAML structure: ${line}`);
  }

  pushCurrent();
  return overrides.sort((a, b) => {
    if (b.priority !== a.priority) {
      return b.priority - a.priority;
    }
    return a.match.localeCompare(b.match);
  });
}

function assignYamlField(
  current: OverrideEntry,
  pair: string,
): 'notes' | 'relatedFiles' | null {
  const separatorIndex = pair.indexOf(':');
  if (separatorIndex === -1) {
    throw new Error(`Invalid YAML field: ${pair}`);
  }

  const key = pair.slice(0, separatorIndex).trim();
  const value = pair.slice(separatorIndex + 1).trim();

  if (key === 'match') {
    current.match = value;
    return null;
  }

  if (key === 'priority') {
    current.priority = Number(value || 0);
    return null;
  }

  if (key === 'taskTags') {
    current.taskTags = stableUnique([...current.taskTags, ...parseInlineList(value)]);
    return null;
  }

  if (key === 'notes') {
    if (value) {
      current.notes.push(value);
      return null;
    }
    return 'notes';
  }

  if (key === 'relatedFiles') {
    if (value) {
      current.relatedFiles = stableUnique([...current.relatedFiles, ...parseInlineList(value)]);
      return null;
    }
    return 'relatedFiles';
  }

  throw new Error(`Unsupported override field: ${key}`);
}

export async function loadOverrides(rootDir: string): Promise<OverrideEntry[]> {
  const overridesPath = path.join(rootDir, GENERATED_DIR, 'overrides.yaml');
  return parseYamlOverrides(await fs.promises.readFile(overridesPath, 'utf8'));
}

function getRouteParams(routePath: string): string[] {
  return routePath.match(/\[[^/]+\]/g)?.map((segment) => segment.slice(1, -1)) ?? [];
}

function pageRouteFromFile(filePath: string): string {
  const withoutPrefix = filePath.replace(/^app/, '');
  const route = withoutPrefix.replace(/\/page\.tsx$/, '').replace(/\/index$/, '');
  return route === '' ? '/' : route;
}

function apiRouteFromFile(filePath: string): string {
  const withoutPrefix = filePath.replace(/^app\/api/, '/api');
  return withoutPrefix.replace(/\/route\.ts$/, '');
}

function fileType(filePath: string): string {
  if (filePath.startsWith('app/api/')) return 'api-route';
  if (filePath.endsWith('/page.tsx')) return 'page';
  if (filePath.startsWith('app/components/ui/')) return 'ui-component';
  if (filePath.startsWith('app/components/')) return 'component';
  if (filePath.startsWith('app/hooks/')) return 'hook';
  if (filePath.startsWith('app/lib/')) return 'app-lib';
  if (filePath.startsWith('lib/')) return 'lib';
  if (filePath.startsWith('db/')) return 'db';
  if (filePath.startsWith('__tests__/') || filePath.includes('/__tests__/')) return 'test';
  return 'file';
}

function fileTags(filePath: string): string[] {
  const tags = new Set<string>();
  const lower = filePath.toLowerCase();
  if (lower.includes('player')) tags.add('players');
  if (lower.includes('match') || lower.includes('/games')) tags.add('matches');
  if (lower.includes('season')) tags.add('seasons');
  if (lower.includes('stat') || lower.includes('trend') || lower.includes('performance')) tags.add('stats');
  if (lower.includes('chatbot') || lower.includes('openai') || lower.includes('summary') || lower.includes('prompt')) tags.add('ai');
  if (lower.includes('achievement')) tags.add('achievements');
  if (lower.includes('db/') || lower.includes('migration')) tags.add('database');
  return Array.from(tags).sort();
}

function isTestFile(filePath: string): boolean {
  return filePath.endsWith('.test.ts') || filePath.endsWith('.test.tsx') || filePath.endsWith('.test.js');
}

function isKeyGraphFile(filePath: string): boolean {
  if (filePath.startsWith('app/api/') && filePath.endsWith('/route.ts')) {
    return true;
  }
  if (filePath === 'app/page.tsx' || filePath.endsWith('/page.tsx')) {
    return true;
  }
  if (
    filePath.startsWith('app/components/')
    && filePath.endsWith('.tsx')
    && !filePath.startsWith('app/components/ui/')
    && !filePath.includes('/__tests__/')
  ) {
    return true;
  }
  if (filePath.startsWith('app/hooks/') && filePath.endsWith('.ts')) {
    return true;
  }
  if (filePath.startsWith('app/lib/') && filePath.endsWith('.ts')) {
    return true;
  }
  if (filePath.startsWith('lib/') && filePath.endsWith('.ts')) {
    return true;
  }
  if (filePath.startsWith('db/') && filePath.endsWith('.ts')) {
    return true;
  }
  return false;
}

function resolveImport(rootDir: string, importer: string, source: string): string | null {
  if (!source.startsWith('.') && !source.startsWith('@/') && !source.startsWith('@db')) {
    return null;
  }

  let basePath: string;
  if (source.startsWith('./') || source.startsWith('../')) {
    basePath = path.resolve(rootDir, path.dirname(importer), source);
  } else if (source.startsWith('@/')) {
    basePath = path.resolve(rootDir, source.slice(2));
  } else if (source === '@db') {
    basePath = path.resolve(rootDir, 'db/index');
  } else {
    basePath = path.resolve(rootDir, `db/${source.slice('@db/'.length)}`);
  }

  const candidates = [
    basePath,
    `${basePath}.ts`,
    `${basePath}.tsx`,
    `${basePath}.js`,
    `${basePath}.jsx`,
    path.join(basePath, 'index.ts'),
    path.join(basePath, 'index.tsx'),
    path.join(basePath, 'index.js'),
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
      return normalizePath(path.relative(rootDir, candidate));
    }
  }

  return null;
}

async function extractImports(rootDir: string, filePath: string): Promise<string[]> {
  const content = await readText(rootDir, filePath);
  const matches = [
    ...content.matchAll(/from\s+['"]([^'"]+)['"]/g),
    ...content.matchAll(/import\(\s*['"]([^'"]+)['"]\s*\)/g),
  ];

  const resolved = matches
    .map((match) => resolveImport(rootDir, filePath, match[1]))
    .filter((value): value is string => Boolean(value));

  return stableUnique(resolved);
}

async function collectLocalImports(rootDir: string, files: string[]): Promise<Map<string, string[]>> {
  const imports = new Map<string, string[]>();
  const results = await Promise.all(
    files.map(async (filePath) => {
      const extracted = await extractImports(rootDir, filePath);
      return { filePath, extracted };
    })
  );
  for (const { filePath, extracted } of results) {
    imports.set(filePath, extracted);
  }
  return imports;
}

function collectReverseImports(importMap: Map<string, string[]>): Map<string, string[]> {
  const reverse = new Map<string, string[]>();
  for (const [filePath, imports] of importMap.entries()) {
    for (const imported of imports) {
      const dependents = reverse.get(imported) ?? [];
      dependents.push(filePath);
      reverse.set(imported, dependents);
    }
  }
  for (const [filePath, importedBy] of reverse.entries()) {
    reverse.set(filePath, stableUnique(importedBy));
  }
  return reverse;
}

function buildCoverageByFile(importMap: Map<string, string[]>): Map<string, string[]> {
  const coverage = new Map<string, string[]>();
  for (const [filePath, imports] of importMap.entries()) {
    if (!isTestFile(filePath)) {
      continue;
    }
    for (const imported of imports) {
      const tests = coverage.get(imported) ?? [];
      tests.push(filePath);
      coverage.set(imported, stableUnique(tests));
    }
  }
  return coverage;
}

function matchingOverrides(filePath: string, overrides: OverrideEntry[]): OverrideEntry[] {
  return overrides.filter((entry) => matchesGlob(filePath, entry.match));
}

function buildRoutes(
  rootDir: string,
  importMap: Map<string, string[]>,
): { schemaVersion: number; routes: RouteEntry[] } {
  const routeFiles = [
    ...listFiles(rootDir, 'app').filter((filePath) => filePath.endsWith('/page.tsx')),
    ...listFiles(rootDir, 'app/api').filter((filePath) => filePath.endsWith('/route.ts')),
  ];

  const routes = routeFiles.map((filePath): RouteEntry => {
    const route = filePath.startsWith('app/api/')
      ? apiRouteFromFile(filePath)
      : pageRouteFromFile(filePath);
    const likelySourceFiles = (importMap.get(filePath) ?? []).filter((imported) => !isTestFile(imported)).slice(0, 8);
    return {
      kind: filePath.startsWith('app/api/') ? 'api' : 'page',
      route,
      file: filePath,
      params: getRouteParams(route),
      likelySourceFiles,
    };
  });

  routes.sort((a, b) => a.route.localeCompare(b.route) || a.file.localeCompare(b.file));
  return { schemaVersion: 1, routes };
}

function extractBlock(content: string, startIndex: number): string {
  const startBrace = content.indexOf('{', startIndex);
  if (startBrace === -1) {
    return '';
  }
  let depth = 0;
  for (let index = startBrace; index < content.length; index += 1) {
    const char = content[index];
    if (char === '{') depth += 1;
    if (char === '}') depth -= 1;
    if (depth === 0) {
      return content.slice(startBrace + 1, index);
    }
  }
  return '';
}

async function buildDataModel(rootDir: string): Promise<{
  schemaVersion: number;
  schemaFile: string;
  tables: Array<{
    symbol: string;
    table: string;
    columns: Array<{ field: string; column: string; kind: string; references: string | null }>;
    selectType: string | null;
    insertType: string | null;
    migrationTouchpoints: string[];
  }>;
}> {
  const schemaFile = 'db/schema.ts';
  const content = await readText(rootDir, schemaFile);
  const migrationFiles = listFiles(rootDir, 'migrations').filter((filePath) => !filePath.includes('/meta/'));
  const tableMatches = [...content.matchAll(/export const (\w+) = pgTable\("([^"]+)"/g)];
  const typeMatches = [...content.matchAll(/export type (\w+) = typeof (\w+)\.\$infer(Select|Insert)/g)];

  const selectTypeBySymbol = new Map<string, string>();
  const insertTypeBySymbol = new Map<string, string>();
  for (const [, typeName, symbol, flavor] of typeMatches) {
    if (flavor === 'Select') {
      selectTypeBySymbol.set(symbol, typeName);
    } else {
      insertTypeBySymbol.set(symbol, typeName);
    }
  }

  const migrationFileContents = await Promise.all(
    migrationFiles.map(async (filePath) => {
      const migrationContent = await readText(rootDir, filePath);
      return { filePath, migrationContent };
    })
  );

  const tables = tableMatches.map((match) => {
    const symbol = match[1];
    const table = match[2];
    const block = extractBlock(content, match.index ?? 0);
    const columns = block
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => line.replace(/,$/, ''))
      .map((line) => {
        const columnMatch = line.match(/^(\w+):\s*([a-zA-Z]+)\("([^"]+)"\)(.*)$/);
        if (!columnMatch) {
          return null;
        }
        const referencesMatch = columnMatch[4].match(/references\(\(\)\s*=>\s*(\w+)\.id\)/);
        return {
          field: columnMatch[1],
          kind: columnMatch[2],
          column: columnMatch[3],
          references: referencesMatch?.[1] ?? null,
        };
      })
      .filter((value): value is { field: string; column: string; kind: string; references: string | null } => Boolean(value));

    const migrationTouchpoints = migrationFileContents
      .filter(({ migrationContent }) => new RegExp(`\\b${table}\\b`, 'i').test(migrationContent))
      .map(({ filePath }) => filePath);

    return {
      symbol,
      table,
      columns,
      selectType: selectTypeBySymbol.get(symbol) ?? null,
      insertType: insertTypeBySymbol.get(symbol) ?? null,
      migrationTouchpoints,
    };
  });

  tables.sort((a, b) => a.table.localeCompare(b.table));
  return {
    schemaVersion: 1,
    schemaFile,
    tables,
  };
}

function testsForFiles(
  files: string[],
  coverageByFile: Map<string, string[]>,
  explicitTests: string[],
): string[] {
  const discovered = files.flatMap((filePath) => coverageByFile.get(filePath) ?? []);
  return stableUnique([...explicitTests, ...discovered]);
}

function sortByPreferredOrder(values: string[], preferred: string[]): string[] {
  const preferenceIndex = new Map(preferred.map((value, index) => [value, index]));
  return stableUnique(values).sort((a, b) => {
    const aIndex = preferenceIndex.get(a);
    const bIndex = preferenceIndex.get(b);
    if (aIndex !== undefined || bIndex !== undefined) {
      return (aIndex ?? Number.MAX_SAFE_INTEGER) - (bIndex ?? Number.MAX_SAFE_INTEGER);
    }
    return a.localeCompare(b);
  });
}

function buildTasks(
  allFiles: string[],
  coverageByFile: Map<string, string[]>,
  graphNodes: GraphNode[],
  overrides: OverrideEntry[],
): { schemaVersion: number; tasks: Array<Record<string, unknown>> } {
  const graphByFile = new Map(graphNodes.map((node) => [node.file, node]));

  const tasks = TASK_DEFINITIONS.map((definition) => {
    const matchedFiles = allFiles.filter((filePath) =>
      definition.matchers.some((pattern) => matchesGlob(filePath, pattern)),
    );

    const matchingNotes = overrides
      .filter((entry) => entry.taskTags.includes(definition.taskId))
      .flatMap((entry) => entry.notes);

    const startFiles = sortByPreferredOrder(
      definition.startHints.filter((filePath) => allFiles.includes(filePath)),
      definition.startHints,
    ).slice(0, 6);

    const secondarySeed = matchedFiles.flatMap((filePath) => graphByFile.get(filePath)?.related ?? []);
    const overrideRelated = overrides
      .filter((entry) => entry.taskTags.includes(definition.taskId))
      .flatMap((entry) => entry.relatedFiles);

    const secondaryFiles = stableUnique([
      ...matchedFiles,
      ...secondarySeed,
      ...overrideRelated,
    ])
      .filter((filePath) => !startFiles.includes(filePath))
      .slice(0, 12);

    const tests = testsForFiles(matchedFiles, coverageByFile, definition.testCandidates);

    return {
      taskId: definition.taskId,
      title: definition.title,
      triggers: definition.triggers,
      startFiles,
      secondaryFiles,
      testCommands: tests.length > 0 ? [`pnpm test -- ${tests.join(' ')}`] : ['pnpm test'],
      mappedTests: tests,
      riskAreas: definition.riskAreas,
      notes: stableUnique(matchingNotes),
    };
  });

  return { schemaVersion: 1, tasks };
}

function buildTestsArtifact(
  importMap: Map<string, string[]>,
  coverageByFileMap: Map<string, string[]>,
  tasksArtifact: { schemaVersion: number; tasks: Array<Record<string, unknown>> },
): {
  schemaVersion: number;
  tests: Array<{ path: string; kind: string; covers: string[] }>;
  coverageByFile: Record<string, string[]>;
  coverageByArea: Array<{ taskId: string; tests: string[]; gaps: string[] }>;
} {
  const testFiles = Array.from(importMap.keys()).filter(isTestFile).sort();
  const tests = testFiles.map((filePath) => ({
    path: filePath,
    kind: fileType(filePath),
    covers: importMap.get(filePath) ?? [],
  }));

  const coverageByFile = Object.fromEntries(
    Array.from(coverageByFileMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([filePath, testPaths]) => [filePath, testPaths]),
  );

  const coverageByArea = tasksArtifact.tasks.map((task) => {
    const taskId = String(task.taskId);
    const startFiles = (task.startFiles as string[]) ?? [];
    const taskTests = (task.mappedTests as string[]) ?? [];
    const gaps = startFiles.filter((filePath) => !(coverageByFileMap.get(filePath)?.length));
    return {
      taskId,
      tests: taskTests,
      gaps,
    };
  });

  return {
    schemaVersion: 1,
    tests,
    coverageByFile,
    coverageByArea,
  };
}

function buildGraph(
  keyFiles: string[],
  importMap: Map<string, string[]>,
  reverseImports: Map<string, string[]>,
  overrides: OverrideEntry[],
): { schemaVersion: number; nodes: GraphNode[] } {
  const nodes = keyFiles.map((filePath) => {
    const imports = (importMap.get(filePath) ?? []).filter((candidate) => keyFiles.includes(candidate));
    const importedBy = (reverseImports.get(filePath) ?? []).filter((candidate) => !isTestFile(candidate));
    const overrideNotes = matchingOverrides(filePath, overrides).flatMap((entry) => entry.notes);
    const overrideRelated = matchingOverrides(filePath, overrides).flatMap((entry) => entry.relatedFiles);
    const related = stableUnique([...imports, ...importedBy, ...overrideRelated]).filter((value) => value !== filePath);

    return {
      file: filePath,
      type: fileType(filePath),
      tags: fileTags(filePath),
      imports,
      importedBy,
      related: related.slice(0, 12),
      overrideNotes: stableUnique(overrideNotes),
    };
  });

  nodes.sort((a, b) => a.file.localeCompare(b.file));
  return { schemaVersion: 1, nodes };
}

async function buildIndex(
  rootDir: string,
  routesArtifact: { schemaVersion: number; routes: RouteEntry[] },
  tasksArtifact: { schemaVersion: number; tasks: Array<Record<string, unknown>> },
): Promise<Record<string, unknown>> {
  const packageJson = JSON.parse(await readText(rootDir, 'package.json')) as {
    name: string;
    scripts?: Record<string, string>;
  };

  const commands = [
    { name: 'dev', command: 'pnpm dev' },
    { name: 'build', command: 'pnpm build' },
    { name: 'test', command: 'pnpm test' },
    { name: 'lint', command: 'pnpm lint' },
    { name: 'context:generate', command: 'pnpm run context:generate' },
    { name: 'context:check', command: 'pnpm run context:check' },
  ];

  const entrypoints = [
    {
      id: 'dashboard-root',
      file: 'app/page.tsx',
      reason: 'Primary client-side orchestration surface.',
    },
    {
      id: 'routes-index',
      file: 'agent-context/routes.json',
      reason: 'Fast lookup for app pages and API handlers.',
    },
    {
      id: 'data-model',
      file: 'db/schema.ts',
      reason: 'Primary schema and type source of truth.',
    },
    {
      id: 'tasks-index',
      file: 'agent-context/tasks.json',
      reason: 'Task-to-entrypoint routing for common changes.',
    },
  ];

  const subsystems = [
    {
      id: 'dashboard',
      files: ['app/page.tsx', 'app/components/RecordMatchModal.tsx', 'app/components/WinPercentageRankings.tsx'],
    },
    {
      id: 'api',
      files: routesArtifact.routes
        .filter((route) => route.kind === 'api')
        .map((route) => route.file)
        .slice(0, 8),
    },
    {
      id: 'stats',
      files: ['app/api/player-stats/route.ts', 'app/lib/stats.ts', 'app/api/team-performance/route.ts'],
    },
    {
      id: 'seasons',
      files: ['lib/seasons.ts', 'app/api/seasons/route.ts', 'app/components/SeasonSelector.tsx'],
    },
    {
      id: 'ai',
      files: ['app/api/chatbot/route.ts', 'app/components/ChatBot.tsx', 'app/lib/openai.ts'],
    },
  ];

  const artifacts = GENERATED_FILES.map((fileName) => ({
    path: `${GENERATED_DIR}/${fileName}`,
    generated: true,
  })).concat([
    { path: `${GENERATED_DIR}/overrides.yaml`, generated: false },
    { path: `${GENERATED_DIR}/notes.md`, generated: false },
  ]);

  return {
    schemaVersion: 1,
    repo: {
      name: packageJson.name,
      contextGoal: 'Minimize lookup tokens for agents making changes in this repo.',
      defaultReadOrder: ['AGENTS.md', 'agent-context/index.json', 'agent-context/tasks.json'],
      routeCount: routesArtifact.routes.length,
      taskCount: tasksArtifact.tasks.length,
    },
    commands,
    subsystems,
    entrypoints,
    artifacts,
  };
}

function stringifyJson(value: unknown): string {
  return `${JSON.stringify(value, null, 2)}\n`;
}

export async function buildAgentContext(rootDir: string): Promise<Record<string, string>> {
  const allRelevantFiles = stableUnique([
    ...listFiles(rootDir, 'app'),
    ...listFiles(rootDir, 'lib'),
    ...listFiles(rootDir, 'db'),
    ...listFiles(rootDir, 'migrations'),
    ...listFiles(rootDir, '__tests__'),
  ]).filter((filePath) => !filePath.endsWith('.DS_Store'));

  const importSourceFiles = stableUnique([
    ...allRelevantFiles.filter((filePath) => filePath.endsWith('.ts') || filePath.endsWith('.tsx') || isTestFile(filePath)),
    ...listFiles(rootDir, 'app/components/__tests__'),
    ...listFiles(rootDir, 'app/lib/__tests__'),
  ]).filter((filePath) => !filePath.endsWith('.json'));

  const overrides = await loadOverrides(rootDir);
  const importMap = await collectLocalImports(rootDir, importSourceFiles);
  const reverseImports = collectReverseImports(importMap);
  const coverageByFile = buildCoverageByFile(importMap);
  const keyFiles = stableUnique(allRelevantFiles.filter(isKeyGraphFile));
  const graphArtifact = buildGraph(keyFiles, importMap, reverseImports, overrides);
  const tasksArtifact = buildTasks(keyFiles, coverageByFile, graphArtifact.nodes, overrides);
  const testsArtifact = buildTestsArtifact(importMap, coverageByFile, tasksArtifact);
  const routesArtifact = buildRoutes(rootDir, importMap);
  const dataModelArtifact = await buildDataModel(rootDir);
  const indexArtifact = await buildIndex(rootDir, routesArtifact, tasksArtifact);

  return {
    [`${GENERATED_DIR}/index.json`]: stringifyJson(indexArtifact),
    [`${GENERATED_DIR}/routes.json`]: stringifyJson(routesArtifact),
    [`${GENERATED_DIR}/data-model.json`]: stringifyJson(dataModelArtifact),
    [`${GENERATED_DIR}/tasks.json`]: stringifyJson(tasksArtifact),
    [`${GENERATED_DIR}/tests.json`]: stringifyJson(testsArtifact),
    [`${GENERATED_DIR}/graph.json`]: stringifyJson(graphArtifact),
  };
}

export async function validateContextFiles(rootDir: string): Promise<Array<{ file: string; bytes: number; limit: number }>> {
  const filesToCheck = Object.entries(CONTEXT_LIMITS)
    .filter(([relativePath]) => fs.existsSync(path.join(rootDir, relativePath)));

  const results = await Promise.all(
    filesToCheck.map(async ([relativePath, limit]) => {
      const content = await fs.promises.readFile(path.join(rootDir, relativePath), 'utf8');
      return {
        file: relativePath,
        bytes: Buffer.byteLength(content),
        limit,
      };
    })
  );

  return results.filter(({ bytes, limit }) => bytes > limit);
}

function writeGeneratedFiles(rootDir: string, outputs: Record<string, string>): void {
  for (const [relativePath, content] of Object.entries(outputs)) {
    const absolutePath = path.join(rootDir, relativePath);
    fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
    fs.writeFileSync(absolutePath, content);
  }
}

if (require.main === module) {
  (async () => {
    try {
      const outputs = await buildAgentContext(ROOT_DIR);
      writeGeneratedFiles(ROOT_DIR, outputs);
      const oversized = await validateContextFiles(ROOT_DIR);
      if (oversized.length > 0) {
        console.warn('Generated context exceeded configured size limits:');
        for (const item of oversized) {
          console.warn(`- ${item.file}: ${item.bytes} bytes (limit ${item.limit})`);
        }
      } else {
        console.log(`Generated ${Object.keys(outputs).length} agent-context artifacts.`);
      }
    } catch (error) {
      console.error('Failed to generate agent context:', error);
      process.exit(1);
    }
  })();
}
