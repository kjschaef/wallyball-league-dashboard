-- Database Setup Script for Volleyball League Management Platform
-- This script creates all tables from scratch

-- Drop existing tables if they exist (in reverse order of creation to handle foreign key constraints)
DROP TABLE IF EXISTS player_achievements;
DROP TABLE IF EXISTS achievements;
DROP TABLE IF EXISTS matches;
DROP TABLE IF EXISTS players;

-- Create players table
CREATE TABLE players (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  start_year INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create matches table
CREATE TABLE matches (
  id SERIAL PRIMARY KEY,
  -- Team One Players
  team_one_player_one_id INTEGER REFERENCES players(id),
  team_one_player_two_id INTEGER REFERENCES players(id),
  team_one_player_three_id INTEGER REFERENCES players(id),
  -- Team Two Players
  team_two_player_one_id INTEGER REFERENCES players(id),
  team_two_player_two_id INTEGER REFERENCES players(id),
  team_two_player_three_id INTEGER REFERENCES players(id),
  -- Scores
  team_one_games_won INTEGER NOT NULL,
  team_two_games_won INTEGER NOT NULL,
  date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for matches table
CREATE INDEX team_one_player_one_idx ON matches(team_one_player_one_id);
CREATE INDEX team_one_player_two_idx ON matches(team_one_player_two_id);
CREATE INDEX team_one_player_three_idx ON matches(team_one_player_three_id);
CREATE INDEX team_two_player_one_idx ON matches(team_two_player_one_id);
CREATE INDEX team_two_player_two_idx ON matches(team_two_player_two_id);
CREATE INDEX team_two_player_three_idx ON matches(team_two_player_three_id);

-- Create achievements table
CREATE TABLE achievements (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL, -- Achievement type (e.g., "games_played", "games_won")
  condition TEXT NOT NULL -- Achievement condition (e.g., "wins >= 10")
);

-- Create player_achievements junction table
CREATE TABLE player_achievements (
  id SERIAL PRIMARY KEY,
  player_id INTEGER REFERENCES players(id) NOT NULL,
  achievement_id INTEGER REFERENCES achievements(id) NOT NULL,
  unlocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Create index for player_achievements
CREATE INDEX player_achievement_idx ON player_achievements(player_id, achievement_id);

-- Insert initial achievement records
INSERT INTO achievements (name, description, icon, condition) VALUES
('Rookie', 'Play your first game', 'award', 'matches_played >= 1'),
('Veteran', 'Play 10 or more games', 'trophy', 'matches_played >= 10'),
('Champion', 'Win 5 or more games', 'medal', 'matches_won >= 5'),
('MVP', 'Win 10 or more games', 'star', 'matches_won >= 10'),
('Perfect Game', 'Win a match without losing a game', 'circle-check', 'perfect_games >= 1'),
('Team Player', 'Play with 5 different teammates', 'users', 'unique_teammates >= 5');

-- Insert sample data (optional, uncomment if needed)
/*
-- Sample players
INSERT INTO players (name, start_year) VALUES 
('John Smith', 2020),
('Emma Johnson', 2021),
('Michael Brown', 2019),
('Olivia Davis', 2022),
('William Wilson', 2020),
('Sophia Miller', 2021);

-- Sample matches
INSERT INTO matches (
  team_one_player_one_id, team_one_player_two_id,
  team_two_player_one_id, team_two_player_two_id,
  team_one_games_won, team_two_games_won, date
) VALUES
(1, 2, 3, 4, 2, 1, CURRENT_TIMESTAMP - INTERVAL '7 days'),
(5, 6, 1, 2, 0, 2, CURRENT_TIMESTAMP - INTERVAL '3 days'),
(3, 4, 5, 6, 2, 0, CURRENT_TIMESTAMP - INTERVAL '1 day');
*/

-- Print completion message
SELECT 'Database setup completed successfully.' AS message;