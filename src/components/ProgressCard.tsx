import { useEffect, useState } from "react";
import { progressApi } from "@/lib/api";

interface Progress {
  totalXp: number;
  currentStreak: number;
  longestStreak: number;
  testsCount: number;
  bestScore: number;
  lastActiveAt: string | null;
  level: number;
  xpInCurrentLevel: number;
  xpToNextLevel: number;
}

interface RecentResult {
  id: string;
  testType: string;
  score: number;
  rawCorrect: number;
  totalQs: number;
  xpEarned: number;
  createdAt: string;
}

const TYPE_LABEL: Record<string, string> = {
  full: "Full Test",
  listening: "Listening",
  structure: "Structure",
  reading: "Reading",
};

const TYPE_COLOR: Record<string, string> = {
  full: "bg-purple-100 text-purple-800",
  listening: "bg-amber-100 text-amber-800",
  structure: "bg-blue-100 text-blue-800",
  reading: "bg-green-100 text-green-800",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const XP_PER_LEVEL = 500;

const ProgressCard = () => {
  const [progress, setProgress] = useState<Progress | null>(null);
  const [recentResults, setRecentResults] = useState<RecentResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    progressApi
      .get()
      .then((data) => {
        setProgress(data.progress);
        setRecentResults(data.recentResults);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="bg-card border border-border rounded-xl p-5 flex items-center justify-center gap-2 min-h-[120px]">
        <span className="inline-block w-5 h-5 border-2 border-navy/20 border-t-navy rounded-full animate-spin" />
        <span className="text-muted-foreground text-sm font-sans">Memuat progress...</span>
      </div>
    );
  }

  if (!progress) return null;

  const xpPct = Math.round((progress.xpInCurrentLevel / XP_PER_LEVEL) * 100);

  return (
    <div className="flex flex-col gap-3">
      {/* Stats header */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="gradient-navy px-5 py-4">
          <div className="flex items-center gap-2">
            <span className="text-xl">📈</span>
            <h2 className="text-card font-display font-bold text-base">Progress Kamu</h2>
          </div>
          <p className="text-gold/80 text-xs font-sans mt-0.5">Statistik latihan TOEFL</p>
        </div>

        <div className="p-4">
          {/* Level + XP bar */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <span className="bg-navy text-gold text-xs font-bold px-2.5 py-1 rounded-full font-sans">
                  LVL {progress.level}
                </span>
                <span className="text-sm font-semibold text-navy font-sans">
                  {progress.totalXp.toLocaleString()} XP
                </span>
              </div>
              <span className="text-xs text-muted-foreground font-sans">
                +{progress.xpToNextLevel} XP → LVL {progress.level + 1}
              </span>
            </div>
            <div className="w-full bg-muted rounded-full h-2.5 overflow-hidden">
              <div
                className="gradient-gold h-2.5 rounded-full transition-all duration-1000 ease-out"
                style={{ width: `${xpPct}%` }}
              />
            </div>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-2 gap-2.5 mb-4">
            <div className="bg-cream border border-border rounded-xl p-3 text-center">
              <div className="text-2xl mb-0.5">
                {progress.currentStreak > 0 ? "🔥" : "💤"}
              </div>
              <div className="text-xl font-bold text-navy font-sans">{progress.currentStreak}</div>
              <div className="text-xs text-muted-foreground font-sans">Hari Streak</div>
            </div>
            <div className="bg-cream border border-border rounded-xl p-3 text-center">
              <div className="text-2xl mb-0.5">⭐</div>
              <div className="text-xl font-bold text-navy font-sans">{progress.longestStreak}</div>
              <div className="text-xs text-muted-foreground font-sans">Best Streak</div>
            </div>
            <div className="bg-cream border border-border rounded-xl p-3 text-center">
              <div className="text-2xl mb-0.5">📝</div>
              <div className="text-xl font-bold text-navy font-sans">{progress.testsCount}</div>
              <div className="text-xs text-muted-foreground font-sans">Total Tes</div>
            </div>
            <div className="bg-cream border border-border rounded-xl p-3 text-center">
              <div className="text-2xl mb-0.5">🏆</div>
              <div className="text-xl font-bold text-navy font-sans">
                {progress.bestScore > 0 ? progress.bestScore : "—"}
              </div>
              <div className="text-xs text-muted-foreground font-sans">Best Score</div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent history */}
      {recentResults.length > 0 && (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="px-5 py-3 border-b border-border">
            <h3 className="text-sm font-semibold text-navy font-sans">Riwayat Tes Terbaru</h3>
          </div>
          <div className="divide-y divide-border">
            {recentResults.slice(0, 5).map((r) => {
              const accuracy = Math.round((r.rawCorrect / r.totalQs) * 100);
              return (
                <div key={r.id} className="flex items-center gap-3 px-4 py-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${TYPE_COLOR[r.testType] || "bg-gray-100 text-gray-700"}`}>
                        {TYPE_LABEL[r.testType] || r.testType}
                      </span>
                      <span className="text-xs text-muted-foreground font-sans">
                        {formatDate(r.createdAt)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1 bg-muted rounded-full h-1.5 max-w-[80px]">
                        <div
                          className="bg-navy h-1.5 rounded-full"
                          style={{ width: `${accuracy}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground font-sans">{accuracy}% benar</span>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-sm font-bold text-navy font-sans">{r.score}</div>
                    <div className="text-xs text-gold font-sans">+{r.xpEarned} XP</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProgressCard;
