/**
 * THE KATHA - Global Leaderboard Modal
 * 
 * Strict requirements:
 * - Direct Supabase public.players integration
 * - Supabase Realtime subscriptions with automatic refetch and clean unmount
 * - Strictly ordered by:
 *     1. total_laddus DESC
 *     2. score_updated_at ASC
 *     3. id ASC
 * - Complete pagination with persistent global rank calculations (e.g. Page 2 has ranks 11-20)
 * - Identifies current player strictly using authenticated user UUID (not by name)
 * - Highlights current player when on page; displays global rank when on another page
 * - No fake/demo players (real registered players only)
 * - Automatic score sync (NO manual "Sync My Score" button)
 * - Loading and error states with manual retry
 */

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { leaderboardService, BackendStatus } from '../../core/leaderboard/LeaderboardService';
import { useGameState } from '../../core/state/GameStateContext';
import { Trophy, X, RotateCw, AlertCircle, ShieldCheck, ChevronLeft, ChevronRight, User, ExternalLink } from 'lucide-react';
import { audioManager } from '../../core/audio/AudioManager';
import { LeaderboardPageResult, SupabaseLeaderboardItem } from '../../types/supabase';

const PAGE_SIZE = 10;

interface LeaderboardModalProps {
  onClose: () => void;
}

export const LeaderboardModal: React.FC<LeaderboardModalProps> = ({ onClose }) => {
  const { playerId, playerName, ladduCount } = useGameState();
  const [page, setPage] = useState<number>(1);
  const [pageData, setPageData] = useState<LeaderboardPageResult>({
    entries: [],
    totalCount: 0,
    page: 1,
    pageSize: PAGE_SIZE,
    totalPages: 1,
    currentPlayerRank: null,
    currentPlayerEntry: null,
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [backendStatus, setBackendStatus] = useState<BackendStatus>(() =>
    leaderboardService.getBackendStatus()
  );

  const currentPageRef = useRef<number>(page);
  currentPageRef.current = page;

  const loadData = useCallback(async (targetPage: number = 1, showRefreshSpinner: boolean = false) => {
    if (showRefreshSpinner) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setError(null);

    try {
      const result = await leaderboardService.fetchPage(targetPage, PAGE_SIZE, playerId);
      setPageData(result);
      setBackendStatus(leaderboardService.getBackendStatus());
    } catch (err: any) {
      console.warn('[LeaderboardModal] Fetch error:', err);
      setError('Unable to load rankings. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [playerId]);

  useEffect(() => {
    loadData(page);
  }, [page, loadData]);

  // Realtime subscription: automatically refetches whenever public.players changes in Supabase
  useEffect(() => {
    const unsubscribe = leaderboardService.subscribeToLeaderboard(() => {
      loadData(currentPageRef.current, false);
    });

    return () => {
      unsubscribe();
    };
  }, [loadData]);

  const handleManualRefresh = () => {
    audioManager.playSound('button_tap');
    loadData(page, true);
  };

  const handlePrevPage = () => {
    if (page > 1) {
      audioManager.playSound('button_tap');
      setPage((prev) => prev - 1);
    }
  };

  const handleNextPage = () => {
    if (page < pageData.totalPages) {
      audioManager.playSound('button_tap');
      setPage((prev) => prev + 1);
    }
  };

  const handleJumpToMyRank = () => {
    if (pageData.currentPlayerRank) {
      audioManager.playSound('button_tap');
      const targetPage = Math.ceil(pageData.currentPlayerRank / PAGE_SIZE);
      setPage(targetPage);
    }
  };

  const isCurrentPlayerOnThisPage = pageData.entries.some((e) => playerId && e.id === playerId);

  return (
    <div
      id="leaderboard-screen-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-950/85 backdrop-blur-sm select-none"
    >
      <div className="relative w-full max-w-2xl bg-stone-900 border-2 border-amber-500/40 rounded-3xl p-4 sm:p-6 shadow-2xl text-amber-50 flex flex-col max-h-[92vh]">
        {/* ================= HEADER ================= */}
        <div className="flex items-center justify-between pb-3 border-b border-amber-500/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center text-stone-950 shadow-md">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black font-cinzel text-amber-100 leading-tight">
                  GLOBAL LEADERBOARD
                </h2>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/30">
                  Live
                </span>
              </div>
              <p className="text-[11px] text-stone-400 leading-none mt-0.5">
                Vinayaka Chavithi Champion Rankings • Rangastalam Village
              </p>
            </div>
          </div>

          <button
            id="close-leaderboard-btn"
            type="button"
            onClick={() => {
              audioManager.playSound('button_tap');
              onClose();
            }}
            aria-label="Close Leaderboard"
            className="w-8 h-8 rounded-full bg-stone-800 hover:bg-stone-700 text-stone-400 hover:text-amber-200 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ================= BACKEND STATUS BANNER ================= */}
        <div className="my-2.5 p-2.5 rounded-2xl bg-stone-950/80 border border-amber-500/20 text-xs">
          <div className="flex items-center justify-between gap-2.5">
            <div className="flex items-center gap-2 min-w-0">
              {backendStatus.isConfigured ? (
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
              )}
              <div className="truncate">
                <div className="flex items-center gap-1.5">
                  <span
                    className={`text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md ${
                      backendStatus.isConfigured
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                        : 'bg-amber-950 text-amber-300 border border-amber-500/40'
                    }`}
                  >
                    {backendStatus.badgeText}
                  </span>
                  <span className="text-[10px] text-stone-400 truncate hidden sm:inline">
                    {backendStatus.description}
                  </span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleManualRefresh}
              title="Refresh Leaderboard"
              disabled={isRefreshing}
              className="p-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-amber-300 transition-transform active:rotate-180 cursor-pointer shrink-0"
            >
              <RotateCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* ================= CURRENT PLAYER RANK BANNER (If not on visible page) ================= */}
        {playerId && pageData.currentPlayerRank !== null && !isCurrentPlayerOnThisPage && (
          <div className="mb-2.5 px-3 py-2 rounded-xl bg-amber-950/40 border border-amber-500/40 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-amber-500/20 border border-amber-400 text-amber-200 font-black text-xs flex items-center justify-center">
                #{pageData.currentPlayerRank}
              </span>
              <div className="text-[11px]">
                <span className="font-semibold text-amber-100">Your Current Global Standing: </span>
                <span className="text-amber-300 font-bold">{ladduCount} Laddus</span>
              </div>
            </div>
            <button
              type="button"
              onClick={handleJumpToMyRank}
              className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold text-[10px] uppercase tracking-wide border border-amber-400/30 flex items-center gap-1 cursor-pointer"
            >
              <span>Jump to My Page</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>
        )}

        {/* ================= ERROR STATE ================= */}
        {error && (
          <div className="mb-2.5 p-3 rounded-xl bg-red-950/40 border border-red-500/40 flex items-center justify-between text-xs text-red-200">
            <span>{error}</span>
            <button
              type="button"
              onClick={() => loadData(page, true)}
              className="px-2.5 py-1 rounded-lg bg-red-900/60 hover:bg-red-800 text-red-100 font-bold text-xs cursor-pointer"
            >
              Retry
            </button>
          </div>
        )}

        {/* ================= LEADERBOARD TABLE ================= */}
        <div className="flex-1 overflow-hidden flex flex-col min-h-0 bg-stone-950/60 rounded-2xl border border-stone-800">
          {/* Table Header Row */}
          <div className="grid grid-cols-12 gap-1 px-3 py-2.5 bg-stone-900/90 border-b border-amber-500/20 text-[11px] font-black font-mono text-amber-300/90 uppercase tracking-wider shrink-0">
            <div className="col-span-2 sm:col-span-1 text-center">RANK</div>
            <div className="col-span-6 sm:col-span-6 text-left">PLAYER & COLLEGE</div>
            <div className="col-span-4 sm:col-span-3 text-center">TOTAL LADDUS</div>
            <div className="hidden sm:block sm:col-span-2 text-right">TIME</div>
          </div>

          {/* Table Rows (Scrollable) */}
          <div className="flex-1 overflow-y-auto divide-y divide-stone-800/80 p-1 space-y-1">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-16 text-stone-400 text-xs gap-2">
                <RotateCw className="w-6 h-6 animate-spin text-amber-400" />
                <span>Loading global rankings from Supabase...</span>
              </div>
            ) : pageData.entries.length === 0 ? (
              <div className="text-center py-14 text-stone-400 text-xs px-4">
                <p className="font-semibold text-amber-200/80 text-sm mb-1">No Players Recorded Yet</p>
                <p className="text-stone-500 text-[11px]">
                  {backendStatus.isConfigured
                    ? 'Be the first hero to register your name and begin the sacred festival journey!'
                    : 'Add your Supabase publishable key to environment settings to connect to the live global leaderboard.'}
                </p>
              </div>
            ) : (
              pageData.entries.map((entry: SupabaseLeaderboardItem, index: number) => {
                const rankNum = entry.rank || (page - 1) * PAGE_SIZE + index + 1;
                // Identify current player STRICTLY by authenticated UUID
                const isCurrentPlayer = playerId && entry.id === playerId;

                // Rank Medal Styling
                const isTop1 = rankNum === 1;
                const isTop2 = rankNum === 2;
                const isTop3 = rankNum === 3;

                let formattedTime = 'Recently';
                if (entry.score_updated_at) {
                  try {
                    const d = new Date(entry.score_updated_at);
                    formattedTime = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                  } catch {
                    formattedTime = 'Recently';
                  }
                }

                return (
                  <div
                    key={entry.id}
                    className={`grid grid-cols-12 gap-1 items-center px-3 py-2 rounded-xl transition-colors text-xs ${
                      isCurrentPlayer
                        ? 'bg-amber-950/70 border border-amber-400/60 text-amber-100 font-bold shadow-sm'
                        : 'hover:bg-stone-900/70 text-stone-200'
                    }`}
                  >
                    {/* 1. RANK */}
                    <div className="col-span-2 sm:col-span-1 flex items-center justify-center">
                      {isTop1 ? (
                        <span className="w-5 h-5 rounded-full bg-gradient-to-tr from-amber-400 to-yellow-300 text-stone-950 font-black text-[11px] flex items-center justify-center shadow-md">
                          1
                        </span>
                      ) : isTop2 ? (
                        <span className="w-5 h-5 rounded-full bg-gradient-to-tr from-slate-200 to-slate-400 text-stone-950 font-bold text-[11px] flex items-center justify-center shadow-md">
                          2
                        </span>
                      ) : isTop3 ? (
                        <span className="w-5 h-5 rounded-full bg-gradient-to-tr from-amber-700 to-amber-600 text-amber-100 font-bold text-[11px] flex items-center justify-center shadow-md">
                          3
                        </span>
                      ) : (
                        <span className="w-5 text-center font-mono font-bold text-stone-400 text-xs">
                          {rankNum}
                        </span>
                      )}
                    </div>

                    {/* 2. PLAYER & COLLEGE */}
                    <div className="col-span-6 sm:col-span-6 flex flex-col justify-center min-w-0 pr-1">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="truncate font-semibold text-amber-100">
                          {entry.player_name || 'Anonymous Hero'}
                        </span>
                        {isCurrentPlayer && (
                          <span className="shrink-0 text-[8px] px-1.5 py-0.2 rounded bg-amber-500 text-stone-950 font-black uppercase">
                            You
                          </span>
                        )}
                      </div>
                      {entry.college_name && (
                        <span className="truncate text-[9px] text-amber-200/60 font-medium leading-none mt-0.5">
                          {entry.college_name}
                        </span>
                      )}
                    </div>

                    {/* 3. TOTAL LADDUS */}
                    <div className="col-span-4 sm:col-span-3 text-center font-bold text-amber-200 flex items-center justify-center gap-1 font-mono text-xs">
                      <span>{entry.total_laddus ?? 0}</span>
                      <span className="text-[11px]">🪔</span>
                    </div>

                    {/* 4. TIME */}
                    <div className="hidden sm:block sm:col-span-2 text-right font-mono text-[10px] text-stone-400">
                      {formattedTime}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* ================= PAGINATION CONTROLS ================= */}
          <div className="px-3 py-2 bg-stone-900/80 border-t border-amber-500/20 flex items-center justify-between text-xs shrink-0">
            <button
              type="button"
              onClick={handlePrevPage}
              disabled={page <= 1 || isLoading}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1 font-bold text-xs transition-colors ${
                page <= 1 || isLoading
                  ? 'bg-stone-900 text-stone-600 cursor-not-allowed'
                  : 'bg-stone-800 hover:bg-stone-700 text-amber-200 cursor-pointer'
              }`}
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Prev</span>
            </button>

            <div className="text-[11px] font-mono text-stone-400">
              <span>Page </span>
              <strong className="text-amber-300">{pageData.page}</strong>
              <span> of </span>
              <strong className="text-amber-200">{pageData.totalPages}</strong>
              <span className="hidden sm:inline text-stone-500 ml-1.5">
                ({pageData.totalCount} {pageData.totalCount === 1 ? 'Player' : 'Players'})
              </span>
            </div>

            <button
              type="button"
              onClick={handleNextPage}
              disabled={page >= pageData.totalPages || isLoading}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1 font-bold text-xs transition-colors ${
                page >= pageData.totalPages || isLoading
                  ? 'bg-stone-900 text-stone-600 cursor-not-allowed'
                  : 'bg-stone-800 hover:bg-stone-700 text-amber-200 cursor-pointer'
              }`}
            >
              <span>Next</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ================= FOOTER ================= */}
        <div className="pt-3 border-t border-amber-500/20 mt-2.5 flex items-center justify-between gap-3 text-xs shrink-0">
          <div className="flex items-center gap-1.5 text-stone-400 text-[11px]">
            <User className="w-3.5 h-3.5 text-amber-400" />
            <span>
              Your Offerings:{' '}
              <strong className="text-amber-300">{ladduCount} Laddus</strong>
            </span>
          </div>

          <button
            id="leaderboard-close-footer-btn"
            type="button"
            onClick={() => {
              audioManager.playSound('button_tap');
              onClose();
            }}
            className="px-5 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-amber-200 font-bold text-xs transition-all active:scale-95 cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
