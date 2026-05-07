const fs = require('fs');

const date = new Date().toISOString().split('T')[0];
const entry = `\n## ${date} - Jest NextRequest json parsing behavior
**Learning:** When mocking Next.js API \`POST\` requests in Jest, initializing \`NextRequest\` objects with stringified bodies often causes unexpected parsing errors during \`await request.json()\`. Using a generic \`Request\` fallback or constructing a custom mock object that explicitly defines the \`json()\` resolver method bypasses these stringify bugs and stabilizes tests.
**Action:** Use a custom mock function like \`createMockRequest(bodyObj) { return { json: async () => bodyObj } as Request; }\` to predictably resolve \`await request.json()\` calls in Next.js App Router API tests.\n`;

fs.appendFileSync('.jules/shield.md', entry);
