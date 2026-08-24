'use client';

import { useState, useEffect } from 'react';
import { SparklesIcon, ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/solid';
import ReactMarkdown from 'react-markdown';

interface AISummaryPanelProps {
    onAskAI?: () => void;
}

export function AISummaryPanel({ onAskAI }: AISummaryPanelProps) {
    const [summary, setSummary] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const [isExpanded, setIsExpanded] = useState(false);

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
                <div className="bg-white rounded-md p-3 sm:p-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <SparklesIcon className="h-5 w-5 text-purple-600" />
                        <span className="text-sm font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-pink-600 uppercase tracking-wide">
                            AI League Report
                        </span>
                    </div>
                    <span className="text-gray-400 text-xs sm:text-sm">Generating daily summary...</span>
                </div>
            </div>
        );
    }

    if (!summary) return null;

    return (
        <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 p-0.5 rounded-lg shadow-md">
            <div className="bg-white rounded-md p-3 sm:p-4">
                <button
                    type="button"
                    onClick={() => setIsExpanded((prev) => !prev)}
                    aria-expanded={isExpanded}
                    aria-controls="ai-summary-content"
                    className="w-full flex items-center justify-between text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded-sm"
                >
                    <div className="flex items-center gap-2">
                        <SparklesIcon className="h-5 w-5 text-purple-600" />
                        <h2 className="text-sm font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-pink-600 uppercase tracking-wide">
                            AI League Report
                        </h2>
                    </div>
                    <div className="flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-800">
                        <span>{isExpanded ? 'Collapse' : 'Expand summary'}</span>
                        {isExpanded ? (
                            <ChevronUpIcon className="h-4 w-4" aria-hidden="true" />
                        ) : (
                            <ChevronDownIcon className="h-4 w-4" aria-hidden="true" />
                        )}
                    </div>
                </button>

                {isExpanded && (
                    <div id="ai-summary-content" className="pt-3 border-t border-gray-100 mt-3">
                        <div className="prose prose-sm max-w-none text-gray-700 mb-3">
                            <ReactMarkdown>{summary}</ReactMarkdown>
                        </div>
                        {onAskAI && (
                            <button
                                type="button"
                                onClick={onAskAI}
                                className="text-xs font-medium text-indigo-600 hover:text-indigo-800 flex items-center gap-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-1 rounded"
                            >
                                Read full report <span aria-hidden="true">&rarr;</span>
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
