import fs from 'fs';
import path from 'path';
import pdfParse from 'pdf-parse';

export class WallyballRulesMCPServer {
  private pdfContent: string = '';

  constructor() {
    this.loadPDF();
  }

  private async loadPDF() {
    try {
      const pdfPath = path.join(process.cwd(), 'Wallyball_Rules_2012.pdf');
      const dataBuffer = fs.readFileSync(pdfPath);
      const data = await pdfParse(dataBuffer);
      this.pdfContent = data.text;
      console.log('Wallyball rules PDF loaded successfully');
    } catch (error) {
      console.error('Error loading PDF:', error);
    }
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
}