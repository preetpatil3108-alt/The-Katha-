/**
 * THE KATHA - Supabase Client & Backend Integration Service
 * 
 * Provides:
 * - Direct connection to Supabase using only publishable/anon key
 * - Anonymous Authentication via Supabase Auth
 * - Player registration and identity linking using authenticated UUID
 * - Automatic score synchronization to public.players
 * - Realtime updates via Supabase Realtime channel
 * - Deterministic leaderboard sorting:
 *     1. total_laddus DESC
 *     2. score_updated_at ASC
 *     3. id ASC
 * - Complete pagination support & global rank computation
 * - Resilient error handling that never crashes the local game
 */

import { createClient, SupabaseClient, RealtimeChannel } from '@supabase/supabase-js';
import { SupabasePlayerRow, SupabaseLeaderboardItem, LeaderboardPageResult } from '../../types/supabase';

const SUPABASE_DEFAULT_URL = 'https://eltxpppsplycvahwqhim.supabase.co';

export class SupabaseService {
  private static instance: SupabaseService;
  private client: SupabaseClient | null = null;
  private isConfigured: boolean = false;
  private currentUserId: string | null = null;
  private realtimeChannel: RealtimeChannel | null = null;
  private realtimeListeners: Set<() => void> = new Set();
  private authPromise: Promise<string | null> | null = null;
  private debounceTimer: ReturnType<typeof setTimeout> | null = null;

  private constructor() {
    this.initClient();
  }

  public static getInstance(): SupabaseService {
    if (!SupabaseService.instance) {
      SupabaseService.instance = new SupabaseService();
    }
    return SupabaseService.instance;
  }

  private initClient(): void {
    const rawUrl = import.meta.env.VITE_SUPABASE_URL || SUPABASE_DEFAULT_URL;
    const rawKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
                   import.meta.env.VITE_SUPABASE_ANON_KEY ||
                   '';

    const url = typeof rawUrl === 'string' ? rawUrl.trim() : '';
    const key = typeof rawKey === 'string' ? rawKey.trim() : '';

    if (url && key && key.length > 0) {
      try {
        this.client = createClient(url, key, {
          auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: false,
          },
        });
        this.isConfigured = true;
      } catch (err) {
        console.warn('[SupabaseService] Failed to initialize Supabase client:', err);
        this.client = null;
        this.isConfigured = false;
      }
    } else {
      this.isConfigured = false;
      this.client = null;
    }
  }

  public isBackendConfigured(): boolean {
    return this.isConfigured && this.client !== null;
  }

  public getCurrentUserId(): string | null {
    return this.currentUserId;
  }

  public setCurrentUserId(id: string | null): void {
    this.currentUserId = id;
  }

  /**
   * Signs in the player anonymously via Supabase Auth or returns the existing session user.
   * Prevents duplicate in-flight requests and avoids duplicate anonymous users.
   */
  public async getOrCreateAnonymousUser(): Promise<string | null> {
    if (!this.client) {
      return null;
    }

    if (this.currentUserId) {
      return this.currentUserId;
    }

    if (this.authPromise) {
      return this.authPromise;
    }

    this.authPromise = (async () => {
      try {
        // 1. Check existing session
        const { data: sessionData, error: sessionError } = await this.client!.auth.getSession();
        if (!sessionError && sessionData.session?.user) {
          this.currentUserId = sessionData.session.user.id;
          return this.currentUserId;
        }

        // 2. Sign in anonymously
        const { data: authData, error: authError } = await this.client!.auth.signInAnonymously();
        if (authError) {
          console.error('[SupabaseService] Anonymous sign-in error:', {
            message: authError.message,
            status: authError.status,
            name: authError.name,
            code: (authError as any).code,
          });
          return null;
        }

        if (authData.user) {
          this.currentUserId = authData.user.id;
          return this.currentUserId;
        }
      } catch (err) {
        console.error('[SupabaseService] Unexpected error during anonymous auth:', err);
      } finally {
        this.authPromise = null;
      }
      return null;
    })();

    return this.authPromise;
  }

  /**
   * Registers a player in public.players using their authenticated UUID.
   * Newly registered players start with total_laddus = 0.
   */
  public async registerPlayer(
    playerName: string,
    collegeName?: string
  ): Promise<{ success: boolean; userId: string | null; error?: string }> {
    const cleanName = playerName.trim();
    const cleanCollege = collegeName ? collegeName.trim() : null;

    if (!cleanName) {
      return { success: false, userId: null, error: 'Player name is required.' };
    }

    if (!this.client) {
      return {
        success: true, // Allow local flow to continue
        userId: null,
        error: 'Supabase credentials not yet configured in environment.',
      };
    }

    try {
      // Ensure anonymous user
      const userId = await this.getOrCreateAnonymousUser();
      if (!userId) {
        return {
          success: false,
          userId: null,
          error: 'Could not obtain anonymous auth session. Please verify Anonymous Sign-ins are enabled in Supabase Authentication -> Providers.',
        };
      }

      const now = new Date().toISOString();

      // Check if player record already exists for this authenticated user
      const { data: existingPlayer, error: fetchErr } = await this.client
        .from('players')
        .select('id, total_laddus')
        .eq('id', userId)
        .maybeSingle();

      if (fetchErr) {
        console.warn('[SupabaseService] Check existing player warning:', fetchErr);
      }

      if (existingPlayer) {
        // Update player details without resetting already earned laddus
        const { error: updateErr } = await this.client
          .from('players')
          .update({
            player_name: cleanName,
            college_name: cleanCollege,
            updated_at: now,
          })
          .eq('id', userId);

        if (updateErr) {
          console.error('[SupabaseService] Update player error:', updateErr);
          return { success: false, userId, error: updateErr.message };
        }
      } else {
        // Newly registered player starts with total_laddus = 0
        const { error: insertErr } = await this.client.from('players').insert({
          id: userId,
          player_name: cleanName,
          college_name: cleanCollege,
          total_laddus: 0,
          created_at: now,
          updated_at: now,
          score_updated_at: now,
        });

        if (insertErr) {
          console.error('[SupabaseService] Insert player error:', insertErr);
          return { success: false, userId, error: insertErr.message };
        }
      }

      this.currentUserId = userId;
      return { success: true, userId };
    } catch (err: any) {
      console.error('[SupabaseService] Exception during player registration:', err);
      return { success: false, userId: this.currentUserId, error: err?.message };
    }
  }

  /**
   * Synchronizes the authoritative in-game total_laddus to public.players.
   * Identifies the player strictly by their authenticated user UUID.
   */
  public async syncPlayerLaddus(
    totalLaddus: number,
    playerName?: string,
    collegeName?: string
  ): Promise<boolean> {
    if (!this.client) {
      return false;
    }

    try {
      let userId = this.currentUserId;
      if (!userId) {
        userId = await this.getOrCreateAnonymousUser();
      }
      if (!userId) {
        return false;
      }

      const now = new Date().toISOString();
      const validLaddus = Math.max(0, Math.floor(totalLaddus));

      // Check if row exists
      const { data: existing } = await this.client
        .from('players')
        .select('id')
        .eq('id', userId)
        .maybeSingle();

      if (existing) {
        const { error } = await this.client
          .from('players')
          .update({
            total_laddus: validLaddus,
            updated_at: now,
            score_updated_at: now,
          })
          .eq('id', userId);

        if (error) {
          console.warn('[SupabaseService] Failed to update total_laddus:', error);
          return false;
        }
      } else {
        // Upsert if not yet registered in table
        const { error } = await this.client.from('players').upsert(
          {
            id: userId,
            player_name: playerName || 'Ramu',
            college_name: collegeName || null,
            total_laddus: validLaddus,
            created_at: now,
            updated_at: now,
            score_updated_at: now,
          },
          { onConflict: 'id' }
        );

        if (error) {
          console.warn('[SupabaseService] Failed to upsert player with laddus:', error);
          return false;
        }
      }

      return true;
    } catch (err) {
      console.warn('[SupabaseService] Exception during score synchronization:', err);
      return false;
    }
  }

  /**
   * Fetches paginated leaderboard data from public.players.
   * STRICT ORDERING:
   * 1. total_laddus DESC
   * 2. score_updated_at ASC
   * 3. id ASC
   */
  public async fetchLeaderboardPage(
    page: number = 1,
    pageSize: number = 10,
    currentUserId?: string | null
  ): Promise<LeaderboardPageResult> {
    if (!this.client) {
      return {
        entries: [],
        totalCount: 0,
        page: 1,
        pageSize,
        totalPages: 0,
        currentPlayerRank: null,
        currentPlayerEntry: null,
      };
    }

    try {
      const activeUserId = currentUserId || this.currentUserId;
      const safePage = Math.max(1, page);
      const from = (safePage - 1) * pageSize;
      const to = from + pageSize - 1;

      // Query page of players
      const { data, count, error } = await this.client
        .from('players')
        .select('*', { count: 'exact' })
        .order('total_laddus', { ascending: false, nullsFirst: false })
        .order('score_updated_at', { ascending: true, nullsFirst: false })
        .order('id', { ascending: true })
        .range(from, to);

      if (error) {
        console.warn('[SupabaseService] Error querying leaderboard page:', error);
        return {
          entries: [],
          totalCount: 0,
          page: safePage,
          pageSize,
          totalPages: 0,
          currentPlayerRank: null,
          currentPlayerEntry: null,
        };
      }

      const totalCount = count ?? (data ? data.length : 0);
      const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

      // Calculate 1-based ranks for the current page
      const entries: SupabaseLeaderboardItem[] = (data || []).map((row: SupabasePlayerRow, idx: number) => ({
        ...row,
        rank: from + idx + 1,
      }));

      // Find current player rank & entry
      let currentPlayerRank: number | null = null;
      let currentPlayerEntry: SupabaseLeaderboardItem | null = null;

      if (activeUserId) {
        // Check if on current page
        const foundOnPage = entries.find((e) => e.id === activeUserId);
        if (foundOnPage) {
          currentPlayerRank = foundOnPage.rank;
          currentPlayerEntry = foundOnPage;
        } else {
          // Player is on another page - compute global rank
          const { rank, entry } = await this.computePlayerGlobalRank(activeUserId);
          currentPlayerRank = rank;
          currentPlayerEntry = entry;
        }
      }

      return {
        entries,
        totalCount,
        page: safePage,
        pageSize,
        totalPages,
        currentPlayerRank,
        currentPlayerEntry,
      };
    } catch (err) {
      console.warn('[SupabaseService] Exception fetching leaderboard page:', err);
      return {
        entries: [],
        totalCount: 0,
        page: 1,
        pageSize,
        totalPages: 0,
        currentPlayerRank: null,
        currentPlayerEntry: null,
      };
    }
  }

  /**
   * Computes the exact global rank of a player identified by authenticated UUID.
   * Uses fast count queries respecting strict tie-breaker ordering:
   * 1. total_laddus DESC
   * 2. score_updated_at ASC
   * 3. id ASC
   */
  public async computePlayerGlobalRank(
    userId: string
  ): Promise<{ rank: number | null; entry: SupabaseLeaderboardItem | null }> {
    if (!this.client || !userId) {
      return { rank: null, entry: null };
    }

    try {
      // 1. Fetch current player's data
      const { data: myData, error: myErr } = await this.client
        .from('players')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (myErr || !myData) {
        return { rank: null, entry: null };
      }

      const myLaddus = myData.total_laddus ?? 0;
      const myTime = myData.score_updated_at || myData.created_at || new Date().toISOString();

      // Count players with strictly higher total_laddus
      const { count: higherCount, error: highErr } = await this.client
        .from('players')
        .select('*', { count: 'exact', head: true })
        .gt('total_laddus', myLaddus);

      if (highErr) {
        throw highErr;
      }

      // Count players with same total_laddus but earlier score_updated_at
      const { count: earlierCount, error: earlyErr } = await this.client
        .from('players')
        .select('*', { count: 'exact', head: true })
        .eq('total_laddus', myLaddus)
        .lt('score_updated_at', myTime);

      if (earlyErr) {
        throw earlyErr;
      }

      // Count players with same total_laddus, identical score_updated_at, but alphabetically smaller id
      const { count: tieIdCount, error: tieErr } = await this.client
        .from('players')
        .select('*', { count: 'exact', head: true })
        .eq('total_laddus', myLaddus)
        .eq('score_updated_at', myTime)
        .lt('id', userId);

      if (tieErr) {
        throw tieErr;
      }

      const globalRank = 1 + (higherCount || 0) + (earlierCount || 0) + (tieIdCount || 0);

      return {
        rank: globalRank,
        entry: { ...myData, rank: globalRank },
      };
    } catch (err) {
      console.warn('[SupabaseService] Error computing player rank with count, falling back to ordered scan:', err);

      try {
        // Resilient fallback using ordered scan
        const { data: myData } = await this.client
          .from('players')
          .select('*')
          .eq('id', userId)
          .maybeSingle();

        if (!myData) return { rank: null, entry: null };

        const { data: orderedIds } = await this.client
          .from('players')
          .select('id')
          .order('total_laddus', { ascending: false, nullsFirst: false })
          .order('score_updated_at', { ascending: true, nullsFirst: false })
          .order('id', { ascending: true });

        if (!orderedIds) return { rank: null, entry: null };

        const index = orderedIds.findIndex((item: { id: string }) => item.id === userId);
        const globalRank = index >= 0 ? index + 1 : null;

        return {
          rank: globalRank,
          entry: globalRank ? { ...myData, rank: globalRank } : null,
        };
      } catch (fallbackErr) {
        console.warn('[SupabaseService] Fallback rank calculation failed:', fallbackErr);
        return { rank: null, entry: null };
      }
    }
  }

  /**
   * Subscribes to realtime updates on public.players.
   * When any player's total_laddus changes, all listeners are triggered.
   * Returns an unsubscribe function.
   */
  public subscribeToRealtime(callback: () => void): () => void {
    this.realtimeListeners.add(callback);

    if (!this.realtimeChannel && this.client) {
      try {
        this.realtimeChannel = this.client
          .channel('public:players')
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'players' },
            () => {
              this.notifyRealtimeListeners();
            }
          )
          .subscribe((status) => {
            if (status === 'SUBSCRIBED') {
              console.log('[SupabaseService] Realtime channel connected.');
            }
          });
      } catch (err) {
        console.warn('[SupabaseService] Could not establish realtime subscription:', err);
      }
    }

    return () => {
      this.realtimeListeners.delete(callback);
      if (this.realtimeListeners.size === 0 && this.realtimeChannel && this.client) {
        try {
          this.client.removeChannel(this.realtimeChannel);
        } catch (e) {
          // ignore
        }
        this.realtimeChannel = null;
      }
    };
  }

  private notifyRealtimeListeners(): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
    this.debounceTimer = setTimeout(() => {
      this.realtimeListeners.forEach((cb) => {
        try {
          cb();
        } catch (e) {
          console.error('[SupabaseService] Listener callback error:', e);
        }
      });
    }, 300);
  }
}

export const supabaseService = SupabaseService.getInstance();
