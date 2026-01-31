'use client';

import Image from 'next/image';
import { useSeasonChampions, Winner } from '../hooks/useSeasonChampions';

export function SeasonWinners() {
    const { data: winners = [], isLoading } = useSeasonChampions();

    if (isLoading) return <div className="text-center py-8 text-gray-500">Loading champions...</div>;
    if (winners.length === 0) return null;

    const annualSeasons = winners.filter(w => w.isAnnual);
    const quarterlySeasons = winners.filter(w => !w.isAnnual);

    // Only used for Annual Seasons now
    const renderCard = (winner: Winner) => {
        if (winner.status === 'incomplete' || !winner.player) {
            return (
                <div key={winner.seasonId} className="relative aspect-[2/3] w-full max-w-sm mx-auto bg-gray-100 rounded-lg shadow-inner flex flex-col items-center justify-center p-6 text-center border-2 border-dashed border-gray-300">
                    <span className="text-2xl font-bold text-gray-400 mb-2">{winner.seasonName}</span>
                    <span className="text-lg text-gray-400 font-medium">In Progress</span>
                    <span className="text-4xl mt-4 opacity-20">🏆</span>
                </div>
            );
        }

        if (winner.seasonName === "2025") {
            return (
                <div key={winner.seasonId} className="relative aspect-[2/3] w-full max-w-sm mx-auto overflow-hidden rounded-lg shadow-lg hover:shadow-xl transition-shadow bg-blue-900">
                    <Image
                        src="/images/champions/2025.jpg"
                        alt={`2025 Champion: ${winner.player.name}`}
                        fill
                        className="object-cover"
                    />
                </div>
            );
        }

        return (
            <div key={winner.seasonId} className="relative aspect-[2/3] w-full max-w-sm mx-auto bg-gradient-to-br from-yellow-100 to-yellow-50 rounded-lg shadow-lg flex flex-col items-center justify-center p-6 text-center border border-yellow-200">
                <div className="absolute top-4 left-0 right-0 text-center">
                    <span className="bg-yellow-500 text-white px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase">Annual Champion</span>
                </div>
                <div className="text-4xl font-extrabold text-blue-900 mb-2">{winner.seasonName}</div>
                <span className="text-6xl my-4">🏆</span>
                <h3 className="text-2xl font-bold text-gray-900">{winner.player.name}</h3>
                <div className="text-xl font-bold text-blue-600 mt-2">{winner.player.winPercentage.toFixed(1)}%</div>
            </div>
        );
    };

    return (
        <div className="space-y-10">

            {/* Quarterly Section - First and Compact */}
            {quarterlySeasons.length > 0 && (
                <div className="space-y-4">
                    <h2 className="text-2xl font-bold text-gray-900 border-b pb-2">Season Champions</h2>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        {quarterlySeasons.map((winner) => {
                            if (winner.status === 'incomplete' || !winner.player) {
                                return (
                                    <div key={winner.seasonId} className="bg-gray-50 p-3 rounded-lg border border-dashed border-gray-300 flex flex-col items-center justify-center text-center space-y-1 opacity-75 min-h-[140px]">
                                        <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{winner.seasonName}</div>
                                        <div className="text-gray-400 font-medium text-xs">In Progress</div>
                                    </div>
                                );
                            }

                            return (
                                <div key={winner.seasonId} className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow flex flex-col items-center justify-center text-center space-y-2 min-h-[140px]">
                                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{winner.seasonName}</div>
                                    <div className="py-1"><span className="text-2xl">🏆</span></div>
                                    <div className="space-y-0.5">
                                        <h3 className="text-sm font-bold text-gray-900 leading-tight">{winner.player.name}</h3>
                                        <div className="text-lg font-bold text-blue-600">{winner.player.winPercentage.toFixed(1)}%</div>
                                        <p className="text-xs text-gray-500">{winner.player.record.wins} Wins</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Annual Section - Second and Prominent */}
            {annualSeasons.length > 0 && (
                <div className="space-y-4">
                    <h2 className="text-2xl font-bold text-gray-900 border-b pb-2">Annual Champions</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
                        {annualSeasons.map(renderCard)}
                    </div>
                </div>
            )}

        </div>
    );
}
