
import fs from 'fs/promises';
import path from 'path';
import pdfParse from 'pdf-parse';

async function main() {
    try {
        const pdfPath = path.join(process.cwd(), 'Wallyball_Rules_2012.pdf');
        const dataBuffer = await fs.readFile(pdfPath);
        const data = await pdfParse(dataBuffer);
        const text = data.text;

        console.log(`Total text length: ${text.length}`);

        const keyword = 'ceiling';
        let index = text.toLowerCase().indexOf(keyword);

        if (index === -1) {
            console.log(`Keyword '${keyword}' not found in text.`);
        }

        while (index !== -1) {
            const start = Math.max(0, index - 200);
            const end = Math.min(text.length, index + 200);
            console.log(`\n--- Match at index ${index} ---`);
            console.log(text.slice(start, end).replace(/\n/g, ' '));

            index = text.toLowerCase().indexOf(keyword, index + 1);
        }

    } catch (error) {
        console.error('Error:', error);
    }
}

main();
