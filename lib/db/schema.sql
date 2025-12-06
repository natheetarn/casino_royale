-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  chip_balance INTEGER DEFAULT 1000000 NOT NULL,
  is_admin BOOLEAN DEFAULT FALSE NOT NULL,
  last_daily_bonus_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  game_type VARCHAR(50),
  amount INTEGER NOT NULL,
  balance_after INTEGER NOT NULL,
  reason TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Game history table
CREATE TABLE IF NOT EXISTS game_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  game_type VARCHAR(50) NOT NULL,
  bet_amount INTEGER NOT NULL,
  result VARCHAR(20) NOT NULL, -- 'win', 'loss', 'tie'
  winnings INTEGER NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Landmines game sessions
CREATE TABLE IF NOT EXISTS landmines_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  bet_amount INTEGER NOT NULL,
  grid_size INTEGER NOT NULL,
  mine_count INTEGER NOT NULL,
  safe_revealed INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  mines_layout TEXT NOT NULL, -- JSON-encoded array of mine indices
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_landmines_sessions_user_id ON landmines_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_landmines_sessions_active ON landmines_sessions(is_active);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_timestamp ON transactions(timestamp);
CREATE INDEX IF NOT EXISTS idx_game_history_user_id ON game_history(user_id);
CREATE INDEX IF NOT EXISTS idx_game_history_timestamp ON game_history(timestamp);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Task completions table
CREATE TABLE IF NOT EXISTS task_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  task_type VARCHAR(50) NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  reward_amount INTEGER NOT NULL,
  metadata JSONB,
  CONSTRAINT valid_task_type CHECK (task_type IN ('math', 'trivia', 'captcha', 'typing', 'waiting'))
);

-- Task configuration table (admin-configurable rewards and cooldowns)
CREATE TABLE IF NOT EXISTS task_config (
  task_type VARCHAR(50) PRIMARY KEY,
  reward_amount INTEGER NOT NULL DEFAULT 1000,
  cooldown_seconds INTEGER NOT NULL DEFAULT 3600,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT valid_task_type_config CHECK (task_type IN ('math', 'trivia', 'captcha', 'typing', 'waiting'))
);

-- Crash game rounds
CREATE TABLE IF NOT EXISTS crash_rounds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  bet_amount INTEGER NOT NULL,
  crash_multiplier NUMERIC(6, 2) NOT NULL,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  cashed_out_at NUMERIC(6, 2),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_crash_rounds_user_id ON crash_rounds(user_id);
CREATE INDEX IF NOT EXISTS idx_crash_rounds_active ON crash_rounds(is_active);

-- Indexes for task_completions
CREATE INDEX IF NOT EXISTS idx_task_completions_user_id ON task_completions(user_id);
CREATE INDEX IF NOT EXISTS idx_task_completions_task_type ON task_completions(task_type);
CREATE INDEX IF NOT EXISTS idx_task_completions_completed_at ON task_completions(completed_at);
CREATE INDEX IF NOT EXISTS idx_task_completions_user_task_time ON task_completions(user_id, task_type, completed_at);

-- Insert default task configurations
INSERT INTO task_config (task_type, reward_amount, cooldown_seconds) VALUES
  ('math', 1000, 3600),
  ('trivia', 750, 3600),
  ('captcha', 500, 3600),
  ('typing', 800, 3600),
  ('waiting', 2000, 3600)
ON CONFLICT (task_type) DO NOTHING;

-- Leaderboard table (cached rankings for performance)
CREATE TABLE IF NOT EXISTS leaderboard (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  balance INTEGER NOT NULL,
  rank INTEGER NOT NULL,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  UNIQUE(user_id)
);

-- Achievements table
CREATE TABLE IF NOT EXISTS achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  achievement_type VARCHAR(50) NOT NULL,
  achievement_data JSONB,
  unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  CONSTRAINT valid_achievement_type CHECK (achievement_type IN ('win_streak', 'total_winnings', 'biggest_win', 'games_played', 'challenge_win', 'daily_winner', 'weekly_champion'))
);

-- Daily challenges table
CREATE TABLE IF NOT EXISTS daily_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE UNIQUE NOT NULL,
  game_type VARCHAR(50) NOT NULL,
  starting_balance INTEGER NOT NULL DEFAULT 10000,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  prize_pool INTEGER NOT NULL DEFAULT 50000,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  CONSTRAINT valid_game_type CHECK (game_type IN ('slots', 'landmines', 'crash', 'roulette', 'baccarat'))
);

-- Challenge entries table
CREATE TABLE IF NOT EXISTS challenge_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id UUID NOT NULL REFERENCES daily_challenges(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  final_balance INTEGER NOT NULL DEFAULT 0,
  entries_count INTEGER NOT NULL DEFAULT 1,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  UNIQUE(challenge_id, user_id)
);

-- Challenge winners table
CREATE TABLE IF NOT EXISTS challenge_winners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id UUID NOT NULL REFERENCES daily_challenges(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rank INTEGER NOT NULL,
  prize_awarded INTEGER NOT NULL,
  awarded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  UNIQUE(challenge_id, user_id)
);

-- User statistics table (for tracking various metrics)
CREATE TABLE IF NOT EXISTS user_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  total_winnings INTEGER NOT NULL DEFAULT 0,
  total_losses INTEGER NOT NULL DEFAULT 0,
  games_played INTEGER NOT NULL DEFAULT 0,
  biggest_win INTEGER NOT NULL DEFAULT 0,
  longest_win_streak INTEGER NOT NULL DEFAULT 0,
  current_win_streak INTEGER NOT NULL DEFAULT 0,
  time_played_minutes INTEGER NOT NULL DEFAULT 0,
  last_active_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  UNIQUE(user_id)
);

-- Indexes for leaderboard and challenges
CREATE INDEX IF NOT EXISTS idx_leaderboard_balance ON leaderboard(balance DESC);
CREATE INDEX IF NOT EXISTS idx_leaderboard_rank ON leaderboard(rank);
CREATE INDEX IF NOT EXISTS idx_leaderboard_updated ON leaderboard(last_updated);

CREATE INDEX IF NOT EXISTS idx_achievements_user_id ON achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_achievements_type ON achievements(achievement_type);
CREATE INDEX IF NOT EXISTS idx_achievements_unlocked ON achievements(unlocked_at);

CREATE INDEX IF NOT EXISTS idx_daily_challenges_date ON daily_challenges(date);
CREATE INDEX IF NOT EXISTS idx_daily_challenges_active ON daily_challenges(is_active);
CREATE INDEX IF NOT EXISTS idx_daily_challenges_game_type ON daily_challenges(game_type);

CREATE INDEX IF NOT EXISTS idx_challenge_entries_challenge_user ON challenge_entries(challenge_id, user_id);
CREATE INDEX IF NOT EXISTS idx_challenge_entries_balance ON challenge_entries(final_balance DESC);
CREATE INDEX IF NOT EXISTS idx_challenge_entries_completed ON challenge_entries(completed_at);

CREATE INDEX IF NOT EXISTS idx_challenge_winners_challenge ON challenge_winners(challenge_id);
CREATE INDEX IF NOT EXISTS idx_challenge_winners_rank ON challenge_winners(rank);

CREATE INDEX IF NOT EXISTS idx_user_stats_user_id ON user_stats(user_id);
CREATE INDEX IF NOT EXISTS idx_user_stats_winnings ON user_stats(total_winnings DESC);
CREATE INDEX IF NOT EXISTS idx_user_stats_games_played ON user_stats(games_played DESC);

-- Trigger to update user_stats when game_history changes
CREATE OR REPLACE FUNCTION update_user_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO user_stats (user_id, total_winnings, total_losses, games_played, biggest_win)
    VALUES (
      NEW.user_id,
      CASE WHEN NEW.result = 'win' THEN NEW.winnings ELSE 0 END,
      CASE WHEN NEW.result = 'loss' THEN NEW.bet_amount ELSE 0 END,
      1,
      CASE WHEN NEW.result = 'win' THEN NEW.winnings ELSE 0 END
    )
    ON CONFLICT (user_id)
    DO UPDATE SET
      total_winnings = user_stats.total_winnings +
        CASE WHEN NEW.result = 'win' THEN NEW.winnings ELSE 0 END,
      total_losses = user_stats.total_losses +
        CASE WHEN NEW.result = 'loss' THEN NEW.bet_amount ELSE 0 END,
      games_played = user_stats.games_played + 1,
      biggest_win = GREATEST(user_stats.biggest_win,
        CASE WHEN NEW.result = 'win' THEN NEW.winnings ELSE 0 END),
      current_win_streak = CASE WHEN NEW.result = 'win' THEN user_stats.current_win_streak + 1 ELSE 0 END,
      longest_win_streak = GREATEST(user_stats.longest_win_streak,
        CASE WHEN NEW.result = 'win' THEN user_stats.current_win_streak + 1 ELSE 0 END),
      last_active_at = NOW(),
      updated_at = NOW();
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic user stats updates
DROP TRIGGER IF EXISTS trigger_update_user_stats ON game_history;
CREATE TRIGGER trigger_update_user_stats
  AFTER INSERT ON game_history
  FOR EACH ROW EXECUTE FUNCTION update_user_stats();

-- Function to refresh leaderboard rankings
CREATE OR REPLACE FUNCTION refresh_leaderboard()
RETURNS INTEGER AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  -- Clear existing leaderboard
  DELETE FROM leaderboard;

  -- Insert fresh rankings based on current chip balances
  INSERT INTO leaderboard (user_id, balance, rank)
  SELECT
    id,
    chip_balance,
    ROW_NUMBER() OVER (ORDER BY chip_balance DESC)
  FROM users
  WHERE chip_balance > 0;

  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$ LANGUAGE plpgsql;

