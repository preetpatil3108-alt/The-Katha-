-- ==========================================================
-- THE KATHA - Supabase Database Schema & RLS Policies
-- Target Table: public.players
-- ==========================================================

-- 1. Create public.players table
CREATE TABLE IF NOT EXISTS public.players (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  player_name TEXT NOT NULL,
  college_name TEXT,
  total_laddus INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  score_updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. Indexes for deterministic high-performance leaderboard sorting:
--    1. total_laddus DESC
--    2. score_updated_at ASC
--    3. id ASC
CREATE INDEX IF NOT EXISTS idx_players_leaderboard_rank 
ON public.players (total_laddus DESC, score_updated_at ASC, id ASC);

CREATE INDEX IF NOT EXISTS idx_players_id 
ON public.players (id);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policy: Anyone can view the leaderboard (authenticated and anon)
DROP POLICY IF EXISTS "Anyone can view leaderboard" ON public.players;
CREATE POLICY "Anyone can view leaderboard" 
ON public.players 
FOR SELECT 
USING (true);

-- 5. RLS Policy: Authenticated users can insert their own player record
DROP POLICY IF EXISTS "Users can insert their own player profile" ON public.players;
CREATE POLICY "Users can insert their own player profile" 
ON public.players 
FOR INSERT 
WITH CHECK (auth.uid() = id);

-- 6. RLS Policy: Users can only update their own record
DROP POLICY IF EXISTS "Users can update their own player profile" ON public.players;
CREATE POLICY "Users can update their own player profile" 
ON public.players 
FOR UPDATE 
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- 7. Add public.players to Supabase Realtime publication
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
      AND schemaname = 'public' 
      AND tablename = 'players'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.players;
  END IF;
END $$;
