'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from './ui/dialog';

interface PowerRankingsExplainerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PowerRankingsExplainerModal({ isOpen, onClose }: PowerRankingsExplainerModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-6 bg-white rounded-2xl shadow-xl">
        <DialogHeader className="space-y-1.5 pb-3 border-b border-gray-100">
          <DialogTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <span>⚡ How League Power Rankings Work</span>
          </DialogTitle>
          <DialogDescription className="text-xs text-gray-500">
            A transparent guide to player ratings, match calculations, and skill tiers in the Wallyball League.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2 text-gray-800">
          {/* Card 1: Season Race vs Power Rankings */}
          <div className="bg-gradient-to-br from-indigo-50/70 to-blue-50/40 p-4 rounded-xl border border-indigo-100 space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-lg">🏆</span>
              <h3 className="text-sm font-bold text-indigo-950">
                Season Race vs. League Power Rankings
              </h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1 text-xs">
              <div className="bg-white/90 p-3 rounded-lg border border-indigo-100 shadow-xs">
                <span className="font-bold text-indigo-900 block mb-1">🏆 Season Race (Standings)</span>
                <p className="text-gray-600 leading-relaxed">
                  Evaluates performance <strong className="text-gray-800">this quarter only</strong> based on win percentage, games won, and point differential. Resets to 0 every 3 months.
                </p>
              </div>
              <div className="bg-white/90 p-3 rounded-lg border border-indigo-100 shadow-xs">
                <span className="font-bold text-indigo-900 block mb-1">⚡ League Power Rankings</span>
                <p className="text-gray-600 leading-relaxed">
                  Your <strong className="text-gray-800">permanent career skill rating</strong> (starts at 1500). Persists across seasons and adjusts based on opponent strength and score margins.
                </p>
              </div>
            </div>
          </div>

          {/* Card 2: Scored vs Unscored Games */}
          <div className="bg-gradient-to-br from-amber-50/80 to-orange-50/40 p-4 rounded-xl border border-amber-200/80 space-y-2.5">
            <div className="flex items-center gap-2">
              <span className="text-lg">📊</span>
              <h3 className="text-sm font-bold text-amber-950">
                Scored Games vs. Unscored Games (Why Exact Scores Matter)
              </h3>
            </div>
            <p className="text-xs text-amber-900 leading-relaxed">
              The Power Ranking system rewards dominant victories through a dynamic <strong>Margin of Victory (MOV)</strong> multiplier:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
              <div className="bg-white/90 p-3 rounded-lg border border-amber-200 shadow-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-amber-900">Scored Games (Point Totals)</span>
                  <span className="text-[10px] font-extrabold bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded">
                    Up to 2.0x Multiplier
                  </span>
                </div>
                <p className="text-gray-600 leading-relaxed">
                  When exact scores are recorded (e.g. 21–11), wide point spreads scale the rating delta up to <strong className="text-amber-800">2.0x</strong>. Decisive blowouts move rankings significantly faster than narrow 21–20 sets.
                </p>
              </div>
              <div className="bg-white/90 p-3 rounded-lg border border-amber-200 shadow-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-gray-800">Unscored Games (Wins Only)</span>
                  <span className="text-[10px] font-extrabold bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded">
                    1.0x Baseline
                  </span>
                </div>
                <p className="text-gray-600 leading-relaxed">
                  If only game wins are entered without point totals, games are evaluated at the <strong className="text-gray-700">1.0x minimum baseline</strong>. Unscored games have <em>substantially less effect</em> on Power Rankings.
                </p>
              </div>
            </div>
            <div className="bg-amber-100/60 rounded-lg p-2 text-[11px] text-amber-900 font-medium flex items-center gap-1.5">
              <span>💡</span>
              <span>Always enter exact point scores when recording matches to ensure full rating impact from commanding wins!</span>
            </div>
          </div>

          {/* Card 3: Opponent Strength & Upsets */}
          <div className="bg-gradient-to-br from-emerald-50/70 to-teal-50/40 p-4 rounded-xl border border-emerald-100 space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-lg">🎯</span>
              <h3 className="text-sm font-bold text-emerald-950">
                Opponent Strength & Upset Bonuses
              </h3>
            </div>
            <div className="space-y-1.5 text-xs text-gray-600 leading-relaxed">
              <p>
                • <strong>Team Average Ratings</strong>: Before each match, each side&apos;s team average Power Ranking determines the expected probability of winning.
              </p>
              <p>
                • <strong>Expected vs. Unexpected</strong>: Defeating a higher-ranked team yields a much larger rating increase than beating beginners. Conversely, losing to top players causes minimal point loss.
              </p>
              <p>
                • <strong>🔥 Upset Bonus</strong>: When an underdog team defeats a significantly higher-ranked opponent, players receive high-impact bonus swings highlighted with an <span className="inline-block bg-rose-100 text-rose-700 font-bold px-1.5 py-0.2 rounded text-[10px]">UPSET</span> badge in match history.
              </p>
            </div>
          </div>

          {/* Card 4: Provisional Status & Skill Tiers */}
          <div className="bg-gradient-to-br from-slate-50 to-gray-50 p-4 rounded-xl border border-gray-200 space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-lg">🔰</span>
              <h3 className="text-sm font-bold text-gray-900">
                Provisional Calibration & Skill Tiers
              </h3>
            </div>

            <div className="text-xs text-gray-600 space-y-1.5">
              <p>
                • <strong>Provisional Rating <span className="inline-block bg-amber-100 text-amber-800 font-bold px-1.5 py-0.2 rounded text-[10px]">PROV (X/10)</span></strong>: A player&apos;s first 10 career games are provisional. Ratings have higher sensitivity during calibration to quickly settle players into their true skill tier.
              </p>
              <p>
                • <strong>Established Ratings</strong>: After 10 games, the provisional tag is removed and rating changes stabilize into veteran rates.
              </p>
            </div>

            <div className="pt-2 border-t border-gray-200/80">
              <span className="text-xs font-bold text-gray-800 block mb-2">Skill Tier Benchmarks</span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div className="bg-white p-2 rounded-lg border border-blue-100 text-center shadow-2xs">
                  <span className="text-base block mb-0.5">💎</span>
                  <span className="font-bold text-blue-900 block">Diamond</span>
                  <span className="text-[10px] text-gray-500">1650+ Power Ranking</span>
                </div>
                <div className="bg-white p-2 rounded-lg border border-amber-100 text-center shadow-2xs">
                  <span className="text-base block mb-0.5">🥇</span>
                  <span className="font-bold text-amber-900 block">Gold</span>
                  <span className="text-[10px] text-gray-500">1525–1649</span>
                </div>
                <div className="bg-white p-2 rounded-lg border border-slate-200 text-center shadow-2xs">
                  <span className="text-base block mb-0.5">🥈</span>
                  <span className="font-bold text-slate-800 block">Silver</span>
                  <span className="text-[10px] text-gray-500">1400–1524</span>
                </div>
                <div className="bg-white p-2 rounded-lg border border-orange-100 text-center shadow-2xs">
                  <span className="text-base block mb-0.5">🥉</span>
                  <span className="font-bold text-amber-950 block">Bronze</span>
                  <span className="text-[10px] text-gray-500">&lt; 1400</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-gray-100 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-lg transition-colors cursor-pointer"
          >
            Got it, close
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
