
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from "@modelcontextprotocol/sdk/types.js";
import fs from "fs/promises";
import path from "path";

// Placeholder function for PDF parsing - will be implemented when pdf-parse is available
function pdfParse(_buffer: Buffer): Promise<{ text: string }> {
  return Promise.resolve({ text: "PDF parsing temporarily disabled due to compatibility issues." });
}

// Simple path resolver
function resolvePath(filePath: string): string {
  return path.resolve(filePath);
}

export class WallyballRulesMCPServer {
  private server: Server;
  private pdfContent: string = "";

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
      },
    );

    this.setupHandlers();
    this.loadPDF();
  }

  private async loadPDF() {
    try {
      const pdfPath = path.join(process.cwd(), "Wallyball_Rules_2012.pdf");
      const safePath = resolvePath(pdfPath);
      const pdfDataSource = await fs.readFile(safePath);
      const pdfContent = await pdfParse(pdfDataSource);
      this.pdfContent = pdfContent.text;

      console.log("Basic Wallyball rules loaded");
    } catch (error) {
      console.error("Error in loadPDF fallback:", error);
      this.pdfContent = "Wallyball rules document not available.";
    }
  }

  private setupHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: "search_wallyball_rules",
            description:
              "Search through the official Wallyball Rules 2012 document for specific information",
            inputSchema: {
              type: "object",
              properties: {
                query: {
                  type: "string",
                  description:
                    "The search term or question about wallyball rules",
                },
              },
              required: ["query"],
            },
          },
          {
            name: "get_full_rules",
            description:
              "Get the complete text of the Wallyball Rules 2012 document",
            inputSchema: {
              type: "object",
              properties: {},
            },
          },
          {
            name: "analyze_player_performance",
            description:
              "Analyze performance data for selected players to optimize team matchups",
            inputSchema: {
              type: "object",
              properties: {
                playerIds: {
                  type: "array",
                  items: { type: "number" },
                  description: "Array of player IDs to analyze",
                },
                analysisType: {
                  type: "string",
                  enum: [
                    "team_balance",
                    "matchup_optimization",
                    "player_comparison",
                  ],
                  description: "Type of performance analysis to conduct",
                },
              },
              required: ["playerIds", "analysisType"],
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
        case "analyze_player_performance":
          return this.analyzePlayerPerformance(
            args?.playerIds as number[],
            args?.analysisType as string,
          );
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

    const lines = this.pdfContent.split("\n");
    const relevantLines: string[] = [];
    const searchTerms = query.toLowerCase().split(" ");

    // Find lines that contain any of the search terms
    lines.forEach((line, index) => {
      const lowerLine = line.toLowerCase();
      if (searchTerms.some((term) => lowerLine.includes(term))) {
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

    const result =
      relevantLines.length > 0
        ? relevantLines.join("\n")
        : "No specific rules found for that query. Try a different search term.";

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

  public async analyzePlayerPerformance(
    playerIds: number[],
    analysisType: string,
  ) {
    try {
      // Fetch player stats from the API
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:5000"}/api/player-stats`,
      );
      const allPlayers = await response.json();

      // Filter to selected players
      const selectedPlayers = allPlayers.filter((p: { id: number }) =>
        playerIds.includes(p.id),
      );

      let analysisResult = "";

      switch (analysisType) {
        case "team_balance":
          analysisResult = this.analyzeTeamBalance(selectedPlayers);
          break;
        case "matchup_optimization":
          analysisResult = this.analyzeMatchupOptimization(selectedPlayers);
          break;
        case "player_comparison":
          analysisResult = this.analyzePlayerComparison(selectedPlayers);
          break;
        default:
          analysisResult = "Unknown analysis type";
      }

      return {
        content: [
          {
            type: "text",
            text: `Performance Analysis (${analysisType}):\n\n${analysisResult}`,
          },
        ],
      };
    } catch (error) {
      console.error("Error analyzing player performance:", error);
      return {
        content: [
          {
            type: "text",
            text: "Error fetching player performance data",
          },
        ],
      };
    }
  }

  private analyzeTeamBalance(players: Array<{
    name: string;
    winPercentage: number;
    record: { totalGames: number };
    streak: { count: number; type: string };
    inactivityPenalty?: number;
  }>): string {
    const analysis = players.map((p) => ({
      name: p.name,
      winPercentage: p.winPercentage,
      totalGames: p.record.totalGames,
      streak: p.streak,
      inactivityPenalty: p.inactivityPenalty || 0,
    }));

    const avgWinRate =
      analysis.reduce((sum, p) => sum + p.winPercentage, 0) / analysis.length;
    const experienceSpread =
      Math.max(...analysis.map((p) => p.totalGames)) -
      Math.min(...analysis.map((p) => p.totalGames));

    return `Selected Players Analysis:
${analysis.map((p) => `• ${p.name}: ${p.winPercentage}% win rate, ${p.totalGames} games, ${p.streak.count} ${p.streak.type} streak`).join("\n")}

Group Statistics:
• Average Win Rate: ${avgWinRate.toFixed(1)}%
• Experience Spread: ${experienceSpread} games
• Players with Penalties: ${analysis.filter((p) => p.inactivityPenalty > 0).length}

Balance Factors:
• High performers: ${
      analysis
        .filter((p) => p.winPercentage > avgWinRate + 10)
        .map((p) => p.name)
        .join(", ") || "None"
    }
• Developing players: ${
      analysis
        .filter((p) => p.winPercentage < avgWinRate - 10)
        .map((p) => p.name)
        .join(", ") || "None"
    }`;
  }

  private analyzeMatchupOptimization(players: Array<{
    name: string;
    winPercentage: number;
  }>): string {
    const sortedByWinRate = [...players].sort(
      (a, b) => b.winPercentage - a.winPercentage,
    );

    return `Matchup Optimization for ${players.length} players:

Performance Tiers:
• Tier 1 (Top): ${sortedByWinRate
      .slice(0, Math.ceil(players.length * 0.3))
      .map((p) => `${p.name} (${p.winPercentage}%)`)
      .join(", ")}
• Tier 2 (Mid): ${sortedByWinRate
      .slice(Math.ceil(players.length * 0.3), Math.ceil(players.length * 0.7))
      .map((p) => `${p.name} (${p.winPercentage}%)`)
      .join(", ")}
• Tier 3 (Dev): ${sortedByWinRate
      .slice(Math.ceil(players.length * 0.7))
      .map((p) => `${p.name} (${p.winPercentage}%)`)
      .join(", ")}

Optimal Pairing Strategy:
• Mix tiers for balanced teams
• Consider current streaks for momentum
• Account for inactivity penalties
• Rotate partnerships for variety`;
  }

  private analyzePlayerComparison(players: Array<{
    name: string;
    winPercentage: number;
    record: { totalGames: number; wins: number; losses: number };
    streak: { count: number; type: string };
    inactivityPenalty?: number;
  }>): string {
    return `Player Comparison (${players.length} players):

${players
  .map(
    (p) => `${p.name}:
  Win Rate: ${p.winPercentage}% (${p.record.wins}W-${p.record.losses}L)
  Experience: ${p.record.totalGames} games
  Current Form: ${p.streak.count} ${p.streak.type} streak
  Penalty: ${p.inactivityPenalty || 0}%`,
  )
  .join("\n\n")}

Key Insights:
• Most experienced: ${players.reduce((prev, curr) => (prev.record.totalGames > curr.record.totalGames ? prev : curr)).name}
• Highest win rate: ${players.reduce((prev, curr) => (prev.winPercentage > curr.winPercentage ? prev : curr)).name}
• Best form: ${(() => {
    const winningStreakPlayers = players.filter((p) => p.streak.type === "wins");
    if (winningStreakPlayers.length === 0) return "None on winning streak";
    const bestFormPlayer = winningStreakPlayers.reduce((prev, curr) => (prev.streak.count > curr.streak.count ? prev : curr));
    return bestFormPlayer.name;
  })()}`;
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
