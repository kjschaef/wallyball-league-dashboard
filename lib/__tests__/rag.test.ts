import fs from 'fs/promises';
import pdfParse from 'pdf-parse';

// Mock the modules
jest.mock('fs/promises');
jest.mock('pdf-parse');

// Define the mock outside of jest.mock and use a name starting with 'mock'
const mockCreate = jest.fn();

jest.mock('openai', () => {
    return {
        __esModule: true,
        default: jest.fn().mockImplementation(() => {
            return {
                embeddings: {
                    create: (input: any) => mockCreate(input)
                }
            };
        })
    };
});

// Import after mocking
import { WallyballRulesRAG } from '../rag';

describe('WallyballRulesRAG', () => {
    let rag: WallyballRulesRAG;

    beforeEach(() => {
        jest.clearAllMocks();

        // Reset singleton instance
        // @ts-expect-error - accessing private member for testing
        WallyballRulesRAG.instance = undefined;

        rag = WallyballRulesRAG.getInstance();
    });

    it('should be a singleton', () => {
        const instance1 = WallyballRulesRAG.getInstance();
        const instance2 = WallyballRulesRAG.getInstance();
        expect(instance1).toBe(instance2);
    });

    describe('initialize', () => {
        it('should load from cache if rules-embeddings.json exists', async () => {
            const mockEmbeddings = [
                { content: 'rule 1', embedding: [0.1, 0.2] },
                { content: 'rule 2', embedding: [0.3, 0.4] }
            ];
            (fs.readFile as jest.Mock).mockResolvedValueOnce(JSON.stringify(mockEmbeddings));

            await rag.initialize();

            expect(fs.readFile).toHaveBeenCalledWith(expect.stringContaining('rules-embeddings.json'), 'utf-8');
            // @ts-expect-error - accessing private member for testing
            expect(rag.isInitialized).toBe(true);
            // @ts-expect-error - accessing private member for testing
            expect(rag.chunks).toHaveLength(2);
        });

        it('should fallback to PDF parsing if cache is missing', async () => {
            // Mock cache file not found
            (fs.readFile as jest.Mock).mockRejectedValueOnce(new Error('ENOENT'));
            // Mock PDF file reading
            (fs.readFile as jest.Mock).mockResolvedValueOnce(Buffer.from('mock pdf data'));
            // Mock PDF parsing
            (pdfParse as jest.Mock).mockResolvedValueOnce({ text: 'This is a rule chunk that is long enough to be included in the results.' });

            // Mock OpenAI embedding response
            mockCreate.mockResolvedValue({
                data: [{ embedding: [0.1, 0.2, 0.3] }]
            });

            await rag.initialize();

            expect(pdfParse).toHaveBeenCalled();
            expect(mockCreate).toHaveBeenCalled();
            // @ts-expect-error - accessing private member for testing
            expect(rag.isInitialized).toBe(true);
        });

        it('should not re-initialize if already initialized', async () => {
            const mockEmbeddings = [{ content: 'rule 1', embedding: [0.1, 0.2] }];
            (fs.readFile as jest.Mock).mockResolvedValueOnce(JSON.stringify(mockEmbeddings));

            await rag.initialize();
            await rag.initialize();

            expect(fs.readFile).toHaveBeenCalledTimes(1);
        });

        it('should throw error if both cache and PDF fallback fail', async () => {
            (fs.readFile as jest.Mock).mockRejectedValue(new Error('Fatal read error'));

            await expect(rag.initialize()).rejects.toThrow('Fatal read error');
        });
    });

    describe('search', () => {
        beforeEach(async () => {
            // Pre-initialize with some data
            const mockEmbeddings = [
                { content: 'exact match', embedding: [1, 0, 0] },
                { content: 'no match', embedding: [0, 0, 1] }
            ];
            (fs.readFile as jest.Mock).mockResolvedValueOnce(JSON.stringify(mockEmbeddings));
            await rag.initialize();

            // Clear mocks after initialization
            jest.clearAllMocks();
        });

        it('should return sorted results based on cosine similarity', async () => {
            // Mock query embedding to be close to 'exact match'
            mockCreate.mockResolvedValue({
                data: [{ embedding: [0.9, 0.1, 0] }]
            });

            const results = await rag.search('test query');

            expect(results).toHaveLength(2);
            expect(results[0]).toBe('exact match');
            expect(results[1]).toBe('no match');
            expect(mockCreate).toHaveBeenCalledWith(expect.objectContaining({
                input: 'test query'
            }));
        });

        it('should limit the number of results', async () => {
            mockCreate.mockResolvedValue({
                data: [{ embedding: [0.5, 0.5, 0.5] }]
            });

            const results = await rag.search('test query', 1);
            expect(results).toHaveLength(1);
        });

        it('should initialize if not already initialized', async () => {
            // Reset state
            // @ts-expect-error - accessing private member for testing
            WallyballRulesRAG.instance = undefined;
            rag = WallyballRulesRAG.getInstance();

            const mockEmbeddings = [{ content: 'rule 1', embedding: [0.1, 0.2] }];
            (fs.readFile as jest.Mock).mockResolvedValueOnce(JSON.stringify(mockEmbeddings));

            mockCreate.mockResolvedValue({
                data: [{ embedding: [0.1, 0.2] }]
            });

            await rag.search('test');

            expect(fs.readFile).toHaveBeenCalledWith(expect.stringContaining('rules-embeddings.json'), 'utf-8');
        });
    });
});
