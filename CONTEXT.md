# Wallyball League Context

Context for managing wallyball league matches, player rosters, schedules, and performance statistics.

## Language

**Match**:
A multi-game contest played between two teams on a specific date.
_Avoid_: Series, fixture, meet

**Game**:
An individual round of play within a match where teams compete up to a point threshold (typically 11 points in this league).
_Avoid_: Set, round, period

**Game Score**:
The point tally recorded for each team in an individual game.
_Avoid_: Result, line score

**Match Score**:
The count of games won by each team across a single match.
_Avoid_: Match points, series score

**Team**:
A side comprising one to three players participating together in a match.
_Avoid_: Squad, roster

**Point Differential**:
The cumulative difference between points scored and points allowed across all scored games for a player or team.
_Avoid_: Plus minus, margin total

**Points Scored**:
The total number of points earned by a player's team during scored games.
_Avoid_: Offensive points

**Points Allowed**:
The total number of points scored by the opposing team during scored games.
_Avoid_: Defensive points conceded

**Weekly Signups**:
The weekly process where league players opt in to play on specific days of the upcoming week.
_Avoid_: Registrations, RSVPs

**Unavailable**:
A status indicating a player has explicitly marked themselves out of playing for the entire week.
_Avoid_: Absent, inactive, off

**No Response**:
Players on the active roster who have neither signed up for any playing day nor marked themselves unavailable for a given week.
_Avoid_: Missing, MIA, unknown

## Ratings & Leaderboards

**Player Rating (Power Ranking)**:
A numerical skill rating assigned to an individual player calculated via the Team-Average Power Ranking algorithm.
_Avoid_: Elo, Rank points, MMR, skill index

**Team Rating**:
The arithmetic mean of all active player ratings on a team for a given match.
_Avoid_: Squad rating, team score

**Career Rating**:
A player's all-time Power Ranking that persists across seasons without quarterly resets.
_Avoid_: Lifetime score, total ranking

**Margin-Weighted Rating**:
A Power Ranking delta calculation scaled by the point differential of each individual game, with a 1.0x baseline fallback for legacy unscored games.
_Avoid_: Margin bonus, handicap multiplier

**Game-Level Rating Update**:
Applying rating adjustments sequentially per individual game played in a match rather than once per multi-game match.
_Avoid_: Match update, series adjustment

**Starting Rating**:
The baseline Power Ranking score (1500) assigned to every player prior to logging their first game.
_Avoid_: Default score, zero-point

**Provisional Rating**:
The calibration phase during a player's first 10 career games where an elevated K-factor accelerates rating convergence.
_Avoid_: Placement matches, unranked phase

**Season Race**:
The quarterly competition tracking player games, win percentages, and point differentials within an active season window.
_Avoid_: Season ladder, quarter tournament

**League Power Rankings**:
The global, rolling skill hierarchy ranking all active players by career Power Ranking, tiers, and recent movement.
_Avoid_: Global leaderboard, all-time standing

**Weekly Movers**:
Players who experienced the largest net Power Ranking increases or decreases over the preceding 7-day period.
_Avoid_: Hot streak, weekly delta list

**Skill Tier**:
The competitive badge classification (Diamond: 1650+, Gold: 1525-1649, Silver: 1400-1524, Bronze: <1400) assigned based on a player's career Power Ranking.
_Avoid_: League division, skill bracket
