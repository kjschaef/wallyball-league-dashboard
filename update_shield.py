import re

with open('__tests__/api/players.test.ts', 'r') as f:
    content = f.read()

# Remove unused imports
content = content.replace("import { GET, POST, PUT, DELETE } from '@/app/api/players/route';", "import { GET, POST } from '@/app/api/players/route';")

with open('__tests__/api/players.test.ts', 'w') as f:
    f.write(content)
