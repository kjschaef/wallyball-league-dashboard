const fs = require('fs');
let content = fs.readFileSync('__tests__/api/settings.test.ts', 'utf8');

content = content.replace(
    /delete process\.env\.DATABASE_URL;\n    const response = await GET\(\);\n    expect\(response\.status\)\.toBe\(500\);\n    await expect\(response\.json\(\)\)\.resolves\.toEqual\(\{ error: 'Failed to fetch settings' \}\);\n    process\.env\.DATABASE_URL = orig;/g,
    `delete process.env.DATABASE_URL;
    try {
      const response = await GET();
      expect(response.status).toBe(500);
      await expect(response.json()).resolves.toEqual({ error: 'Failed to fetch settings' });
    } finally {
      process.env.DATABASE_URL = orig;
    }`
);

content = content.replace(
    /delete process\.env\.DATABASE_URL;\n    mockCookieStore\.get\.mockReturnValue\(\{ value: 'true' \}\);\n    const response = await PUT\(\{\n      json: async \(\) => \(\{\}\),\n    \} as Request\);\n    expect\(response\.status\)\.toBe\(500\);\n    await expect\(response\.json\(\)\)\.resolves\.toEqual\(\{ error: 'Failed to update settings' \}\);\n    process\.env\.DATABASE_URL = orig;/g,
    `delete process.env.DATABASE_URL;
    try {
      mockCookieStore.get.mockReturnValue({ value: 'true' });
      const response = await PUT({
        json: async () => ({}),
      } as Request);
      expect(response.status).toBe(500);
      await expect(response.json()).resolves.toEqual({ error: 'Failed to update settings' });
    } finally {
      process.env.DATABASE_URL = orig;
    }`
);

fs.writeFileSync('__tests__/api/settings.test.ts', content);
