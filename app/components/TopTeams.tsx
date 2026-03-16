'use client';

import { useTopTeams } from '../hooks/useTopTeams';
import { MINIMUM_TEAM_GAMES_THRESHOLD } from '../lib/constants';

const formatTeamName = (players: string[]): string => {
    if (players.length <= 2) {
        return players.join(' & ');
    }
    const lastPlayer = players[players.length - 1];
    const otherPlayers = players.slice(0, -1);
    return `${otherPlayers.join(', ')} & ${lastPlayer}`;
};

const getWinPercentageColor = (percentage: number): string => {
    if (percentage > 53) return 'text-green-600';
    if (percentage >= 45) return 'text-yellow-600';
    return 'text-red-600';
};

const RANK_LABELS = ['🥇', '🥈', '🥉'];

export function TopTeams() {
    const { data: seasonTeams = [], isLoading, isError } = useTopTeams();

    if (isLoading) return <div className="text-center py-8 text-gray-500">Loading top teams...</div>;
    if (isError) return <div className="text-center py-8 text-red-500">Failed to load top teams. Please try again later.</div>;
    if (seasonTeams.length === 0) return null;

    return (
        <div className="space-y-4">
            <div className="border-b pb-2">
                <h2 className="text-2xl font-bold text-gray-900">Top Teams by Season</h2>
                <p className="text-xs text-gray-500 mt-1">Min. {MINIMUM_TEAM_GAMES_THRESHOLD} games played</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {seasonTeams.map((season) => {
                    if (season.status === 'incomplete') {
                        return (
                            <div
                                key={season.seasonId}
                                className="bg-gray-50 p-4 rounded-lg border border-dashed border-gray-300 flex flex-col items-center justify-center text-center space-y-1 opacity-75 min-h-[180px]"
                            >
                                <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{season.seasonName}</div>
                                <div className="text-gray-400 font-medium text-xs">In Progress</div>
                            </div>
                        );
                    }

                    if (season.teams.length === 0) {
                        return (
                            <div
                                key={season.seasonId}
                                className="bg-gray-50 p-4 rounded-lg border border-dashed border-gray-300 flex flex-col items-center justify-center text-center space-y-1 opacity-75 min-h-[180px]"
                            >
                                <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{season.seasonName}</div>
                                <div className="text-gray-400 font-medium text-xs">No qualifying teams</div>
                            </div>
                        );
                    }

                    return (
                        <div
                            key={season.seasonId}
                            className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow min-h-[180px]"
                        >
                            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider text-center mb-3">
                                {season.seasonName}
                            </div>
                            <div className="space-y-2">
                                {season.teams.map((team, index) => (
                                    <div key={team.id} className="flex items-start gap-2">
                                        <span className="text-base leading-tight mt-0.5">{RANK_LABELS[index]}</span>
                                        <div className="flex-1 min-w-0">
                                            <div className="text-sm font-medium text-gray-900 leading-tight truncate" title={formatTeamName(team.players)}>
                                                {formatTeamName(team.players)}
                                            </div>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <span className={`text-sm font-semibold ${getWinPercentageColor(team.gameWinPercentage)}`}>
                                                    {Math.round(team.gameWinPercentage)}%
                                                </span>
                                                <span className="text-xs text-gray-400">
                                                    {team.totalIndividualGames} games
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
