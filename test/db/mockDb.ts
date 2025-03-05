import { Player, NewPlayer } from '../../db/schema';

/**
 * Simple in-memory database for testing purposes
 */
export class MockDatabase {
  private players: Player[] = [];
  private nextPlayerId = 1;

  // Reset the mock database to initial state
  reset() {
    this.players = [];
    this.nextPlayerId = 1;
  }

  // Player operations
  async createPlayer(player: NewPlayer): Promise<Player> {
    const now = new Date();
    // Create a new player with all required fields and safe defaults
    const newPlayer: Player = {
      id: this.nextPlayerId++,
      name: player.name || '',  // Default empty string if name is undefined
      startYear: player.startYear === undefined ? null : player.startYear, // Accept null for optional fields
      createdAt: now,
    };
    this.players.push(newPlayer);
    return newPlayer;
  }

  async getPlayerById(id: number): Promise<Player | undefined> {
    return this.players.find(p => p.id === id);
  }

  async getAllPlayers(): Promise<Player[]> {
    return [...this.players];
  }

  async updatePlayer(id: number, data: Partial<Player>): Promise<Player | undefined> {
    const playerIndex = this.players.findIndex(p => p.id === id);
    if (playerIndex === -1) return undefined;
    
    this.players[playerIndex] = {
      ...this.players[playerIndex],
      ...data,
    };
    return this.players[playerIndex];
  }

  async deletePlayer(id: number): Promise<boolean> {
    const initialLength = this.players.length;
    this.players = this.players.filter(p => p.id !== id);
    return initialLength > this.players.length;
  }
}