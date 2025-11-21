import fs from 'fs/promises';
import path from 'path';
import pdfParse from 'pdf-parse';
import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

interface DocumentChunk {
    content: string;
    embedding: number[];
    metadata: {
        pageNumber?: number;
        section?: string;
    };
}

export class WallyballRulesRAG {
    private static instance: WallyballRulesRAG;
    private chunks: DocumentChunk[] = [];
    private isInitialized = false;

    private constructor() { }

    public static getInstance(): WallyballRulesRAG {
        if (!WallyballRulesRAG.instance) {
            WallyballRulesRAG.instance = new WallyballRulesRAG();
        }
        return WallyballRulesRAG.instance;
    }

    public async initialize() {
        if (this.isInitialized) return;

        try {
            console.log('Initializing RAG system...');

            // Try to load pre-generated embeddings first
            const embeddingsPath = path.join(process.cwd(), 'lib', 'rules-embeddings.json');
            try {
                const fileContent = await fs.readFile(embeddingsPath, 'utf-8');
                const preGeneratedData = JSON.parse(fileContent);

                if (Array.isArray(preGeneratedData) && preGeneratedData.length > 0) {
                    console.log(`Loading ${preGeneratedData.length} pre-generated embeddings...`);
                    this.chunks = preGeneratedData.map(item => ({
                        content: item.content,
                        embedding: item.embedding,
                        metadata: {}
                    }));
                    this.isInitialized = true;
                    console.log('RAG system initialized from cache successfully.');
                    return;
                }
            } catch (e) {
                console.log('Could not load pre-generated embeddings, falling back to runtime generation.', e);
            }

            // Fallback to runtime generation
            console.log('Generating embeddings at runtime (this may take a while)...');
            const pdfPath = path.join(process.cwd(), 'Wallyball_Rules_2012.pdf');
            const dataBuffer = await fs.readFile(pdfPath);
            const data = await pdfParse(dataBuffer);

            // Simple chunking strategy: split by paragraphs and group them
            // Ideally we'd use a more sophisticated chunker, but this works for a rules doc
            const text = data.text;
            const rawChunks = this.chunkText(text, 2000, 400); // ~2000 chars per chunk with overlap

            console.log(`Generated ${rawChunks.length} chunks. Generating embeddings...`);

            // Generate embeddings in batches
            const batchSize = 10;
            for (let i = 0; i < rawChunks.length; i += batchSize) {
                const batch = rawChunks.slice(i, i + batchSize);

                const embeddings = await openai.embeddings.create({
                    model: "text-embedding-3-small",
                    input: batch,
                    encoding_format: "float",
                });

                batch.forEach((chunkContent, index) => {
                    this.chunks.push({
                        content: chunkContent,
                        embedding: embeddings.data[index].embedding,
                        metadata: {} // Could parse page numbers if needed
                    });
                });
            }

            this.isInitialized = true;
            console.log('RAG system initialized successfully.');
        } catch (error) {
            console.error('Failed to initialize RAG system:', error);
            throw error;
        }
    }

    private chunkText(text: string, chunkSize: number, overlap: number): string[] {
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

    private cosineSimilarity(vecA: number[], vecB: number[]): number {
        let dotProduct = 0;
        let normA = 0;
        let normB = 0;

        for (let i = 0; i < vecA.length; i++) {
            dotProduct += vecA[i] * vecB[i];
            normA += vecA[i] * vecA[i];
            normB += vecB[i] * vecB[i];
        }

        return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
    }

    public async search(query: string, limit: number = 15): Promise<string[]> {
        if (!this.isInitialized) {
            await this.initialize();
        }

        // Generate embedding for the query
        const queryEmbeddingResponse = await openai.embeddings.create({
            model: "text-embedding-3-small",
            input: query,
            encoding_format: "float",
        });

        const queryEmbedding = queryEmbeddingResponse.data[0].embedding;

        // Calculate similarity scores
        const scoredChunks = this.chunks.map(chunk => ({
            chunk,
            score: this.cosineSimilarity(queryEmbedding, chunk.embedding)
        }));

        // Sort by score descending
        scoredChunks.sort((a, b) => b.score - a.score);

        // Return top matches
        return scoredChunks.slice(0, limit).map(item => item.chunk.content);
    }
}
