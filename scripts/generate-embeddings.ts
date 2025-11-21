
import fs from 'fs/promises';
import path from 'path';
import pdfParse from 'pdf-parse';
import OpenAI from 'openai';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

function chunkText(text: string, chunkSize: number, overlap: number): string[] {
    const chunks: string[] = [];
    let startIndex = 0;

    while (startIndex < text.length) {
        let endIndex = startIndex + chunkSize;

        // Try to find a natural break point (newline or period)
        if (endIndex < text.length) {
            const nextNewline = text.indexOf('\n', endIndex);
            const nextPeriod = text.indexOf('.', endIndex);

            if (nextNewline !== -1 && nextNewline - endIndex < 100) {
                endIndex = nextNewline + 1;
            } else if (nextPeriod !== -1 && nextPeriod - endIndex < 100) {
                endIndex = nextPeriod + 1;
            }
        }

        const chunk = text.slice(startIndex, endIndex).trim();
        if (chunk.length > 50) { // Ignore very small chunks
            chunks.push(chunk);
        }

        startIndex = endIndex - overlap;
    }

    return chunks;
}

async function main() {
    try {
        console.log('Starting embedding generation...');

        const pdfPath = path.join(process.cwd(), 'Wallyball_Rules_2012.pdf');
        const dataBuffer = await fs.readFile(pdfPath);
        const data = await pdfParse(dataBuffer);

        const text = data.text;
        console.log(`PDF loaded. Total text length: ${text.length}`);

        // Use the new settings: 2000 chars, 400 overlap
        const chunks = chunkText(text, 2000, 400);
        console.log(`Generated ${chunks.length} chunks.`);

        const outputData: { content: string; embedding: number[] }[] = [];

        // Generate embeddings in batches
        const batchSize = 10;
        for (let i = 0; i < chunks.length; i += batchSize) {
            const batch = chunks.slice(i, i + batchSize);
            console.log(`Processing batch ${i / batchSize + 1}/${Math.ceil(chunks.length / batchSize)}...`);

            const response = await openai.embeddings.create({
                model: "text-embedding-3-small",
                input: batch,
                encoding_format: "float",
            });

            batch.forEach((chunkContent, index) => {
                outputData.push({
                    content: chunkContent,
                    embedding: response.data[index].embedding
                });
            });
        }

        const outputPath = path.join(process.cwd(), 'lib', 'rules-embeddings.json');
        await fs.writeFile(outputPath, JSON.stringify(outputData, null, 2));

        console.log(`Successfully saved ${outputData.length} embeddings to ${outputPath}`);

    } catch (error) {
        console.error('Error generating embeddings:', error);
        process.exit(1);
    }
}

main();
