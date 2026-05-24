const fs = require('fs');

let content = fs.readFileSync('__tests__/api/settings.test.ts', 'utf8');

const lastBracket = content.lastIndexOf('});');

if (lastBracket !== -1) {
    const stringToRemove = '});\n\n  it(\'handles GET error';
    if (content.includes(stringToRemove)) {
        content = content.replace(stringToRemove, '\n\n  it(\'handles GET error');
        content += '});\n';
        fs.writeFileSync('__tests__/api/settings.test.ts', content);
        console.log("Fixed.");
    } else {
        const replacementStr = '});\n\n  it(\'handles GET error when DATABASE_URL is missing';
        content = content.replace(replacementStr, '\n\n  it(\'handles GET error when DATABASE_URL is missing');
        content += '});\n';
        fs.writeFileSync('__tests__/api/settings.test.ts', content);
        console.log("Fixed alternative.");
    }
}
