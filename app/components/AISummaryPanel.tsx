'use client';

import { useState, useEffect } from 'react';
import { SparklesIcon } from '@heroicons/react/24/solid';

interface AISummaryPanelProps {
    onAskAI?: () => void;
}

export function AISummaryPanel({ onAskAI }: AISummaryPanelProps) {
    const [summary, setSummary] = useState<string>('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let ignore = false;

        const fetchSummary = async () => {
            try {
                const response = await fetch('/api/daily-summary');
                if (response.ok) {
                    const data = await response.json();
                    if (!ignore) {
                        setSummary(data.summary);
                    }
                }
            } catch (error) {
                console.error('Failed to fetch AI summary:', error);
            } finally {
                if (!ignore) {
                    setLoading(false);
                }
            }
        };

        fetchSummary();

        return () => {
            ignore = true;
        };
    }, []);

    if (loading) {
        return (
            <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 p-0.5 rounded-lg shadow-md animate-pulse">
                <div className="bg-white rounded-md p-4 h-32 flex items-center justify-center">
                    <span className="text-gray-400 text-sm">Generating daily summary...</span>
                </div>
            </div>
        );
    }

    if (!summary) return null;

    return (
        <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 p-0.5 rounded-lg shadow-md">
            <div className="bg-white rounded-md p-4">
                <div className="flex items-center gap-2 mb-2">
                    <SparklesIcon className="h-5 w-5 text-purple-600" />
                    <h2 className="text-sm font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-pink-600 uppercase tracking-wide">
                        AI League Report
                    </h2>
                </div>
                <div className="prose prose-sm max-w-none text-gray-700 mb-3">
                    <p className="whitespace-pre-line">{summary}</p>
                </div>
                {onAskAI && (
                    <button
                        onClick={onAskAI}
                        className="text-xs font-medium text-indigo-600 hover:text-indigo-800 flex items-center gap-1 transition-colors"
                    >
                        Read full report <span aria-hidden="true">&rarr;</span>
                    </button>
                )}
            </div>
        </div>
    );
}
