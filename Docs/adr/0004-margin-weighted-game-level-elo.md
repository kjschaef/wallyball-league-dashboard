# Margin-Weighted Game-Level Elo Updates

To capture competitive dominance and align with the league's game-level scoring semantics, Elo adjustments are computed on an individual game-by-game basis within each match, rather than a single binary match outcome. When individual point scores are recorded in `match_games`, rating deltas are scaled by a logarithmic point-margin multiplier to reward decisive victories and mitigate losses in tight contests. Legacy matches lacking granular point tallies fall back to a neutral 1.0x baseline multiplier.
