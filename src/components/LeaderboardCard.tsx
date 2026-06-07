import { useEffect, useState } from "react";
import { leaderboardApi } from "@/lib/api";

interface LeaderboardEntry {
  rank: number;
  name: string;
  email: string;
  bestScore: number;
  totalXp: number;
  testsCount: number;
  currentStreak: number;
  hasFullTest: boolean;
}

interface LeaderboardCardProps {
  currentUserEmail?: string;
}

const MEDAL = ["🥇", "🥈", "🥉"];

const LeaderboardCard = ({ currentUserEmail }: LeaderboardCardProps) => {
  const [leaders, setLeaders] = useState<LeaderboardEntry[]>([]);
  const [myRank, setMyRank] = useState<number | null>(null);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [lb, rank] = await Promise.all([
          leaderboardApi.top(),
          leaderboardApi.myRank(),
        ]);
        setLeaders(lb.leaderboard as LeaderboardEntry[]);
        setMyRank(rank.rank);
        setTotal(rank.total);
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      {/* Header */}
      <div className="gradient-navy px-5 py-4 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl">🏆</span>
            <h2 className="text-card font-display font-bold text-base">Leaderboard</h2>
          </div>
          <p className="text-gold/80 text-xs font-sans mt-0.5">Top TOEFL ITP Students</p>
        </div>
        {myRank && (
          <div className="text-right">
            <div className="bg-gold/20 border border-gold/40 rounded-full px-3 py-1">
              <span className="text-gold text-xs font-bold font-sans">Rank #{myRank}</span>
            </div>
            <p className="text-gold/50 text-xs font-sans mt-1">out of {total} participants</p>
          </div>
        )}
      </div>

      {/* Info bar */}
      <div className="bg-amber-50/60 border-b border-amber-200/60 px-5 py-2.5 flex items-center gap-2">
        <span className="text-amber-600 text-sm">ℹ️</span>
        <p className="text-amber-700 text-xs font-sans">
          Scores are ranked by <strong>Full Test</strong>. Complete a full test to increase your rank!
        </p>
      </div>

      {/* Body */}
      <div className="p-4">
        {loading ? (
          <div className="flex items-center justify-center py-8 gap-2">
            <span className="inline-block w-5 h-5 border-2 border-navy/20 border-t-navy rounded-full animate-spin" />
            <span className="text-muted-foreground text-sm font-sans">Loading leaderboard...</span>
          </div>
        ) : error ? (
          <div className="text-center py-6 text-muted-foreground text-sm font-sans">
            Failed to load leaderboard. Please try again later.
          </div>
        ) : leaders.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-2">🌟</div>
            <p className="text-navy font-semibold font-sans text-sm">No data available</p>
            <p className="text-muted-foreground text-xs font-sans mt-1">
              Be the first to join the leaderboard!
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {leaders.map((entry, idx) => {
              const isMe = entry.email === currentUserEmail;
              return (
                <div
                  key={entry.email}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${
                    isMe
                      ? "bg-gold/10 border border-gold/40"
                      : idx === 0 && entry.hasFullTest
                      ? "bg-amber-50/60 border border-amber-200/60"
                      : "bg-muted/30 border border-border/50"
                  }`}
                >
                  {/* Rank */}
                  <div className="w-8 text-center flex-shrink-0">
                    {idx < 3 && entry.hasFullTest ? (
                      <span className="text-lg">{MEDAL[idx]}</span>
                    ) : (
                      <span className="text-sm font-bold text-muted-foreground font-sans">
                        #{entry.rank}
                      </span>
                    )}
                  </div>

                  {/* Name + status */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <p className={`text-sm font-semibold font-sans truncate ${isMe ? "text-navy" : "text-navy/90"}`}>
                        {entry.name}
                      </p>
                      {isMe && (
                        <span className="text-xs bg-gold text-navy px-1.5 py-0.5 rounded-full font-bold flex-shrink-0">
                          You
                        </span>
                      )}
                      {!entry.hasFullTest && (
                        <span className="text-xs bg-gray-100 text-gray-500 border border-gray-200 px-1.5 py-0.5 rounded-full font-sans flex-shrink-0">
                          No full test yet
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground font-sans mt-0.5">
                      {entry.testsCount} test{entry.testsCount !== 1 ? "s" : ""} · {entry.totalXp} XP
                      {entry.currentStreak > 0 ? ` · 🔥 ${entry.currentStreak} day${entry.currentStreak !== 1 ? "s" : ""}` : ""}
                    </p>
                  </div>

                  {/* Score */}
                  <div className="text-right flex-shrink-0">
                    {entry.hasFullTest ? (
                      <>
                        <div className={`text-base font-bold font-sans ${isMe ? "text-navy" : idx === 0 ? "text-amber-700" : "text-navy/80"}`}>
                          {entry.bestScore}
                        </div>
                        <div className="text-xs text-muted-foreground font-sans">/ 677</div>
                      </>
                    ) : (
                      <div className="text-xs text-muted-foreground font-sans text-right">
                        <span className="block text-lg">—</span>
                        <span className="text-xs">no score</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default LeaderboardCard;
