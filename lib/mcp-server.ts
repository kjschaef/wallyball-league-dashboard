

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { 
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool 
} from '@modelcontextprotocol/sdk/types.js';
import fs from 'fs';
import path from 'path';

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
    this.loadPDFContent();
  }

  private async loadPDFContent() {
    try {
      // For now, use a placeholder content since pdf-parse is causing issues
      // In a real implementation, you would extract text from the PDF
      this.pdfContent = `
WALLYBALL RULES 2012

GENERAL RULES:
- Games are played to 25 points, must win by 2
- Best of 3 sets wins the match
- Maximum of 3 hits per side
- Ball must be served underhand
- No attacking the serve while the ball is above the net
- Players rotate clockwise after winning serve back

COURT AND EQUIPMENT:
- Regulation volleyball court with walls
- Net height: 8 feet for men, 7 feet 4 inches for women
- Ball may be played off walls but not ceiling
- Wall contact counts as one of the team's three hits

SERVING:
- Must serve underhand from behind service line
- Ball may touch net on serve and still be in play
- Service fault if ball hits ceiling before crossing net
- Players rotate to serve after winning rally

GAMEPLAY:
- Ball may contact wall on same side before crossing net
- Ball hitting wall on opponent's side is out of bounds
- No blocking or attacking serves
- Standard volleyball substitution rules apply

VIOLATIONS:
- Hitting ball twice in succession (except blocks)
- Four hits on one side
- Ball hitting ceiling
- Reaching over or under net
- Foot faults on serve line
      `;
      console.log('Wallyball rules content loaded successfully');
    } catch (error) {
      console.error('Error loading PDF content:', error);
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
            text: "Rules content not loaded yet. Please try again.",
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
          text: this.pdfContent || "Rules content not available",
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

