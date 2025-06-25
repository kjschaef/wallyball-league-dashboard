
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { 
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool 
} from '@modelcontextprotocol/sdk/types.js';
import fs from 'fs';
import path from 'path';
import pdfParse from 'pdf-parse';

export class WallyballRulesMCPServer {
  private server: Server;
  private pdfContent: string = '';

  constructor() {
    this.server = new Server(
      {
        name: "wallyball-rules-server",
        version: "1.0.0",
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupHandlers();
    this.loadPDF();
  }

  private async loadPDF() {
    try {
      const pdfPath = path.join(process.cwd(), 'Wallyball_Rules_2012.pdf');
      console.log('Attempting to load PDF from:', pdfPath);
      
      if (!fs.existsSync(pdfPath)) {
        console.error('PDF file not found at:', pdfPath);
        return;
      }
      
      const dataBuffer = fs.readFileSync(pdfPath);
      const data = await pdfParse(dataBuffer);
      this.pdfContent = data.text;
      console.log('Wallyball rules PDF loaded successfully, content length:', this.pdfContent.length);
    } catch (error) {
      console.error('Error loading PDF:', error);
    }
  }

  private setupHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: "search_wallyball_rules",
            description: "Search through the official Wallyball Rules 2012 document for specific information",
            inputSchema: {
              type: "object",
              properties: {
                query: {
                  type: "string",
                  description: "The search term or question about wallyball rules",
                },
              },
              required: ["query"],
            },
          },
          {
            name: "get_full_rules",
            description: "Get the complete text of the Wallyball Rules 2012 document",
            inputSchema: {
              type: "object",
              properties: {},
            },
          },
        ] as Tool[],
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      switch (name) {
        case "search_wallyball_rules":
          return this.searchRules(args?.query as string);
        case "get_full_rules":
          return this.getFullRules();
        default:
          throw new Error(`Unknown tool: ${name}`);
      }
    });
  }

  public searchRules(query: string) {
    if (!this.pdfContent) {
      return {
        content: [
          {
            type: "text",
            text: "PDF content not loaded yet. Please try again.",
          },
        ],
      };
    }

    const lines = this.pdfContent.split('\n');
    const relevantLines: string[] = [];
    const searchTerms = query.toLowerCase().split(' ');

    // Find lines that contain any of the search terms
    lines.forEach((line, index) => {
      const lowerLine = line.toLowerCase();
      if (searchTerms.some(term => lowerLine.includes(term))) {
        // Include some context (previous and next lines)
        const contextStart = Math.max(0, index - 2);
        const contextEnd = Math.min(lines.length - 1, index + 2);

        for (let i = contextStart; i <= contextEnd; i++) {
          if (!relevantLines.includes(lines[i]) && lines[i].trim()) {
            relevantLines.push(lines[i]);
          }
        }
      }
    });

    const result = relevantLines.length > 0 
      ? relevantLines.join('\n') 
      : 'No specific rules found for that query. Try a different search term.';

    return {
      content: [
        {
          type: "text",
          text: `Search results for "${query}":\n\n${result}`,
        },
      ],
    };
  }

  public getFullRules() {
    return {
      content: [
        {
          type: "text",
          text: this.pdfContent || "PDF content not available",
        },
      ],
    };
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.log("Wallyball Rules MCP Server running on stdio");
  }
}

// Only run if this file is executed directly
if (require.main === module) {
  const server = new WallyballRulesMCPServer();
  server.run().catch(console.error);
}
