/**
 * Supabase Database Schema Types
 * Table: public.players
 */

export interface SupabasePlayerRow {
  id: string; // UUID of authenticated user
  player_name: string;
  college_name: string | null;
  total_laddus: number;
  created_at: string; // ISO 8601 string
  updated_at: string; // ISO 8601 string
  score_updated_at: string | null; // ISO 8601 string
}

export interface SupabaseLeaderboardItem extends SupabasePlayerRow {
  rank: number;
}

export interface LeaderboardPageResult {
  entries: SupabaseLeaderboardItem[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  currentPlayerRank: number | null;
  currentPlayerEntry: SupabaseLeaderboardItem | null;
}
