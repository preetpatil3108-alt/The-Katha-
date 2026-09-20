/**
 * THE KATHA - Global Leaderboard Service
 * 
 * Requirements:
 * - Direct integration with Supabase public.players table
 * - Realtime updates using Supabase Realtime channels
 * - Sorting:
 *     1. total_laddus DESC
 *     2. score_updated_at ASC
 *     3. id ASC
 * - Real registered players only (NO demo/fake players like Chintu, Bhavani, Varun, Deepa, Suresh)
 * - Automatic score synchronization (no manual button)
 * - Identifies current player using authenticated user UUID, not by name
 * - Pagination support with accurate rank computation
 */

import { LeaderboardEntry } from '../../types/game';
import { supabaseService } from '../supabase/supabaseClient';
import { LeaderboardPageResult, SupabaseLeaderboardItem } from '../../types/supabase';

export interface ScoreSubmission {
  playerName: string;
  collegeName?: string;
  levelsCompleted: number;
  level?: number;
  laddus: number; // total laddus
  laddusEarned?: number;
  totalLaddus?: number;
  completionTime: string;
  score?: number;
}

export interface BackendStatus {
  isConfigured: boolean;
  providerName: 'supabase' | 'development';
  badgeText: string;
  description: string;
}

export interface ILeaderboardService {
  saveScore(entry: ScoreSubmission): Promise<boolean>;
  syncLaddus(totalLaddus: number, playerName?: string, collegeName?: string): Promise<boolean>;
  fetchLeaderboard(limit?: number): Promise<LeaderboardEntry[]>;
  fetchPage(page?: number, pageSize?: number, currentUserId?: string | null): Promise<LeaderboardPageResult>;
  subscribeToLeaderboard(callback: () => void): () => void;
  getBackendStatus(): BackendStatus;
}

class LeaderboardManager implements ILeaderboardService {
  public getBackendStatus(): BackendStatus {
    if (supabaseService.isBackendConfigured()) {
      return {
        isConfigured: true,
        providerName: 'supabase',
        badgeText: 'SUPABASE REALTIME CONNECTED',
        description: 'Connected to live global leaderboard database (public.players).',
      };
    }
    return {
      isConfigured: false,
      providerName: 'development',
      badgeText: 'SUPABASE BACKEND READY',
      description: 'Configure VITE_SUPABASE_PUBLISHABLE_KEY in environment to view live global leaderboard rankings.',
    };
  }

  /**
   * Registers a player anonymously in Supabase auth and public.players.
   */
  public async registerPlayer(
    name: string,
    college?: string
  ): Promise<{ success: boolean; userId: string | null; error?: string }> {
    return supabaseService.registerPlayer(name, college);
  }

  /**
   * Automatically synchronizes the player's authoritative Laddu count to public.players.
   * Updates total_laddus, updated_at, and score_updated_at using authenticated UUID.
   */
  public async syncLaddus(
    totalLaddus: number,
    playerName?: string,
    collegeName?: string
  ): Promise<boolean> {
    return supabaseService.syncPlayerLaddus(totalLaddus, playerName, collegeName);
  }

  /**
   * Compatibility wrapper for existing saveScore callers.
   */
  public async saveScore(submission: ScoreSubmission): Promise<boolean> {
    const total = submission.totalLaddus ?? submission.laddus;
    return this.syncLaddus(total, submission.playerName, submission.collegeName);
  }

  /**
   * Fetches paginated leaderboard data from Supabase.
   */
  public async fetchPage(
    page: number = 1,
    pageSize: number = 10,
    currentUserId?: string | null
  ): Promise<LeaderboardPageResult> {
    return supabaseService.fetchLeaderboardPage(page, pageSize, currentUserId);
  }

  /**
   * Fetches first page of leaderboard entries mapped to LeaderboardEntry interface.
   */
  public async fetchLeaderboard(limit = 20): Promise<LeaderboardEntry[]> {
    const res = await this.fetchPage(1, limit);
    return res.entries.map((item) => this.mapToLeaderboardEntry(item));
  }

  public async getLeaderboard(limit = 20): Promise<LeaderboardEntry[]> {
    return this.fetchLeaderboard(limit);
  }

  /**
   * Subscribes to realtime updates from Supabase postgres_changes.
   */
  public subscribeToLeaderboard(callback: () => void): () => void {
    return supabaseService.subscribeToRealtime(callback);
  }

  private mapToLeaderboardEntry(item: SupabaseLeaderboardItem): LeaderboardEntry {
    let formattedTime = '00:00';
    if (item.score_updated_at) {
      try {
        const d = new Date(item.score_updated_at);
        formattedTime = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      } catch {
        formattedTime = '00:00';
      }
    }

    return {
      id: item.id,
      rank: item.rank,
      playerName: item.player_name || 'Player',
      collegeName: item.college_name || undefined,
      laddus: item.total_laddus || 0,
      totalLaddus: item.total_laddus || 0,
      laddusEarned: item.total_laddus || 0,
      score: item.total_laddus || 0,
      level: 1,
      completionTime: formattedTime,
      timestamp: item.score_updated_at ? new Date(item.score_updated_at).getTime() : Date.now(),
    };
  }
}

export const leaderboardService = new LeaderboardManager();
