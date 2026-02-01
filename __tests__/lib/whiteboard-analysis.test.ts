/**
 * @jest-environment node
 */
import { describe, test, expect, beforeAll } from '@jest/globals';
import { readFileSync } from 'fs';
import { join } from 'path';
import {
    findPlayersInImage,
    analyzeMatchResultsImage,
    analyzeMatchesWithConfirmedPlayers
} from '../../app/lib/openai';

describe('Whiteboard Image Analysis', () => {
    let fullNamesImageBuffer: Buffer;
    let initialsImageBuffer: Buffer;

    beforeAll(() => {
        // Load test images
        fullNamesImageBuffer = readFileSync(
            join(__dirname, '../fixtures/whiteboard-images/full-names.jpg')
        );
        initialsImageBuffer = readFileSync(
            join(__dirname, '../fixtures/whiteboard-images/initials.jpg')
        );
    });

    describe('Full Names Image Analysis', () => {
        test('should extract matches from full names whiteboard', async () => {
            const playerNames = [
                'Mark',
                'Keith',
                'Vamsi',
                'Hod',
                'Nate',
                'Lance',
                'Hodnett'
            ];

            const result = await analyzeMatchResultsImage(fullNamesImageBuffer, playerNames);

            console.log('Full names analysis result:', JSON.stringify(result, null, 2));

            // Validate structure
            expect(result).toBeDefined();
            expect(result.error).toBeUndefined();
            expect(result.matches).toBeDefined();
            expect(Array.isArray(result.matches)).toBe(true);

            // Should find multiple matches
            expect(result.matches.length).toBeGreaterThan(0);

            // Validate match structure
            const firstMatch = result.matches[0];
            expect(firstMatch).toHaveProperty('matchNumber');
            expect(firstMatch).toHaveProperty('teamOne');
            expect(firstMatch).toHaveProperty('teamTwo');

            // Validate team structure
            expect(firstMatch.teamOne).toHaveProperty('players');
            expect(firstMatch.teamOne).toHaveProperty('letters');
            expect(firstMatch.teamOne).toHaveProperty('wins');
            expect(Array.isArray(firstMatch.teamOne.players)).toBe(true);

            expect(firstMatch.teamTwo).toHaveProperty('players');
            expect(firstMatch.teamTwo).toHaveProperty('letters');
            expect(firstMatch.teamTwo).toHaveProperty('wins');
            expect(Array.isArray(firstMatch.teamTwo.players)).toBe(true);
        }, 30000); // 30 second timeout for API call

        test('should correctly identify player names from handwriting', async () => {
            const playerNames = [
                'Mark',
                'Keith',
                'Vamsi',
                'Hod',
                'Nate',
                'Lance',
                'Hodnett'
            ];

            const result = await analyzeMatchResultsImage(fullNamesImageBuffer, playerNames);

            // Verify that identified players are from the valid list
            result.matches?.forEach((match: any) => {
                match.teamOne.players.forEach((player: string) => {
                    if (!player.startsWith('?')) {
                        expect(playerNames).toContain(player);
                    }
                });
                match.teamTwo.players.forEach((player: string) => {
                    if (!player.startsWith('?')) {
                        expect(playerNames).toContain(player);
                    }
                });
            });
        }, 30000);
    });

    describe('Initials Image Analysis', () => {
        test('should find player initials in whiteboard', async () => {
            const playerNames = [
                'Mark',
                'Keith',
                'Ambree',
                'Nate',
                'Parker'
            ];

            const result = await findPlayersInImage(initialsImageBuffer, playerNames);

            console.log('Initials analysis result:', JSON.stringify(result, null, 2));

            // Validate structure
            expect(result).toBeDefined();
            expect(result.error).toBeUndefined();
            expect(result.lettersFound).toBeDefined();
            expect(Array.isArray(result.lettersFound)).toBe(true);

            // Should find letters
            expect(result.lettersFound.length).toBeGreaterThan(0);

            // Validate player assignments
            expect(result.playerAssignments).toBeDefined();
            expect(typeof result.playerAssignments).toBe('object');

            // All found letters should have assignments
            result.lettersFound.forEach((letter: string) => {
                expect(result.playerAssignments).toHaveProperty(letter);
            });
        }, 30000);

        test('should correctly map initials to player names', async () => {
            const playerNames = [
                'Mark',
                'Keith',
                'Ambree',
                'Nate',
                'Parker'
            ];

            const result = await findPlayersInImage(initialsImageBuffer, playerNames);

            // Verify mappings
            if (result.playerAssignments) {
                Object.entries(result.playerAssignments).forEach(([letter, player]: [string, any]) => {
                    // Check if it's a direct assignment (not ambiguous)
                    if (!player.startsWith('?') && player !== 'UNKNOWN') {
                        // The player should start with the letter
                        expect(player.charAt(0).toUpperCase()).toBe(letter.toUpperCase());
                        // The player should be in our list
                        expect(playerNames).toContain(player);
                    }
                });
            }
        }, 30000);

        test('should identify ambiguous letters when multiple players have same initial', async () => {
            const playerNames = [
                'Mark',
                'Keith',
                'Alice',
                'Nate',
                'Parker',
                'Paul', // Multiple P's should create ambiguity
                'Molly'
            ];

            const result = await findPlayersInImage(initialsImageBuffer, playerNames);

            // If P is found, it should be marked as ambiguous
            if (result.lettersFound?.includes('P')) {
                expect(result.ambiguousLetters).toBeDefined();
                const pAmbiguity = result.ambiguousLetters.find((amb: any) => amb.letter === 'P');

                if (pAmbiguity) {
                    expect(pAmbiguity.possiblePlayers).toContain('Parker');
                    expect(pAmbiguity.possiblePlayers).toContain('Paul');
                    expect(result.playerAssignments['P']).toBe('?P');
                }
            }
        }, 30000);

        test('should analyze matches with confirmed players from initials', async () => {
            // First, find the players
            const playerNames = [
                'Mark',
                'Keith',
                'Alice',
                'Nate',
                'Parker',
                'Molly'
            ];

            const playerResult = await findPlayersInImage(initialsImageBuffer, playerNames);

            // Get confirmed player names
            const confirmedPlayers = Object.values(playerResult.playerAssignments || {})
                .filter((name: any) => !name.startsWith('?') && name !== 'UNKNOWN') as string[];

            if (confirmedPlayers.length > 0) {
                // Analyze matches with confirmed players
                const matchResult = await analyzeMatchesWithConfirmedPlayers(
                    initialsImageBuffer,
                    confirmedPlayers
                );

                console.log('Matches from initials:', JSON.stringify(matchResult, null, 2));

                // Validate structure
                expect(matchResult).toBeDefined();
                expect(matchResult.error).toBeUndefined();
                expect(matchResult.matches).toBeDefined();
                expect(Array.isArray(matchResult.matches)).toBe(true);

                if (matchResult.matches.length > 0) {
                    const firstMatch = matchResult.matches[0];
                    expect(firstMatch).toHaveProperty('matchNumber');
                    expect(firstMatch).toHaveProperty('teamOne');
                    expect(firstMatch).toHaveProperty('teamTwo');

                    // All players should be from the full player list or confirmed list
                    // (GPT-4o may infer full names from context even with initials)
                    firstMatch.teamOne.players.forEach((player: string) => {
                        expect(playerNames.concat(confirmedPlayers)).toContain(player);
                    });
                    firstMatch.teamTwo.players.forEach((player: string) => {
                        expect(playerNames.concat(confirmedPlayers)).toContain(player);
                    });
                }
            }
        }, 30000);
    });

    describe('Tally Mark Counting', () => {
        test('should count tally marks or set to 0 when unclear', async () => {
            const playerNames = [
                'Mark',
                'Keith',
                'Vamsi',
                'Hod',
                'Nate',
                'Lance',
                'Hodnett'
            ];

            const result = await analyzeMatchResultsImage(fullNamesImageBuffer, playerNames);

            // Validate that wins are non-negative numbers
            result.matches?.forEach((match: any) => {
                expect(typeof match.teamOne.wins).toBe('number');
                expect(match.teamOne.wins).toBeGreaterThanOrEqual(0);
                expect(typeof match.teamTwo.wins).toBe('number');
                expect(match.teamTwo.wins).toBeGreaterThanOrEqual(0);
            });
        }, 30000);
    });
});
