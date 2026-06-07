import { useEffect, useState, useRef } from "react";
import { Question } from "@/data/questions";
import { resultsApi } from "@/lib/api";

interface ResultsScreenProps {
  testType: string;
  questions: Question[];
  answers: Record<number, number>;
  onRetry: () => void;
  onDashboard: () => void;
}

function calcScore(answers: Record<number, number>, questions: Question[]) {
  let correct = 0;
  questions.forEach((q, i) => {
    if (answers[i] === q.correct) correct++;
  });
  return correct;
}

function toITPScale(raw: number, total: number, min: number, max: number) {
  return Math.round(min + (raw / total) * (max - min));
}

interface SavedResult {
  xpEarned: number;
  streakBonus: number;
  newStreak: number;
}

const ResultsScreen = ({
  testType,
  questions,
  answers,
  onRetry,
  onDashboard,
}: ResultsScreenProps) => {
  const [savedResult, setSavedResult] = useState<SavedResult | null>(null);
  const [saving, setSaving] = useState(true);
  const [saveError, setSaveError] = useState(false);
  const [showXpAnim, setShowXpAnim] = useState(false);
  const savedRef = useRef(false);

  let lScore: string | number = "—";
  let sScore: string | number = "—";
  let rScore: string | number = "—";
  let totalScale = 0;
  let totalMax = 677;
  let title = "Practice Test Complete";

  let lScoreNum: number | undefined;
  let sScoreNum: number | undefined;
  let rScoreNum: number | undefined;

  if (testType === "listening") {
    const raw = calcScore(answers, questions);
    const scaled = toITPScale(raw, 50, 31, 68);
    lScore = scaled;
    totalScale = scaled;
    totalMax = 68;
    title = "Listening Complete";
  } else if (testType === "structure") {
    const raw = calcScore(answers, questions);
    const scaled = toITPScale(raw, 40, 31, 68);
    sScore = scaled;
    totalScale = scaled;
    totalMax = 68;
    title = "Structure Complete";
  } else if (testType === "reading") {
    const raw = calcScore(answers, questions);
    const scaled = toITPScale(raw, 50, 31, 67);
    rScore = scaled;
    totalScale = scaled;
    totalMax = 67;
    title = "Reading Complete";
  } else {
    const lQs = questions.slice(0, 50);
    const sQs = questions.slice(50, 90);
    const rQs = questions.slice(90);
    const lAns: Record<number, number> = {};
    const sAns: Record<number, number> = {};
    const rAns: Record<number, number> = {};
    Object.keys(answers).forEach((k) => {
      const idx = parseInt(k);
      if (idx < 50) lAns[idx] = answers[idx];
      else if (idx < 90) sAns[idx - 50] = answers[idx];
      else rAns[idx - 90] = answers[idx];
    });
    lScoreNum = toITPScale(calcScore(lAns, lQs), 50, 31, 68);
    sScoreNum = toITPScale(calcScore(sAns, sQs), 40, 31, 68);
    rScoreNum = toITPScale(calcScore(rAns, rQs), 50, 31, 67);
    lScore = lScoreNum;
    sScore = sScoreNum;
    rScore = rScoreNum;
    totalScale = Math.round(
      ((lScoreNum as number) + (sScoreNum as number) * 2 + (rScoreNum as number)) * (677 / 203)
    );
    totalMax = 677;
    title = "Full Practice Test Complete";
  }

  const rawTotal = calcScore(answers, questions);
  const pct = Math.round((rawTotal / questions.length) * 100);

  // Save result once on mount
  useEffect(() => {
    if (savedRef.current) return;
    savedRef.current = true;

    const type = testType as "full" | "listening" | "structure" | "reading";

    resultsApi
      .save({
        testType: type,
        score: totalScale,
        rawCorrect: rawTotal,
        totalQs: questions.length,
        lScore: lScoreNum,
        sScore: sScoreNum,
        rScore: rScoreNum,
      })
      .then((res) => {
        setSavedResult(res);
        setSaving(false);
        // Trigger XP animation after short delay
        setTimeout(() => setShowXpAnim(true), 300);
      })
      .catch((err) => {
        console.error("Failed to save result:", err);
        setSaveError(true);
        setSaving(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="animate-fade-in">
      {/* Score header */}
      <div className="gradient-navy p-8 rounded-t-xl text-center">
        <div className="w-28 h-28 rounded-full border-[5px] border-gold flex flex-col items-center justify-center mx-auto mb-4">
          <div className="text-3xl font-bold text-card">{totalScale}</div>
          <div className="text-xs text-gold font-sans">Score</div>
        </div>
        <h2 className="text-lg font-display font-bold text-card mb-1">{title}</h2>
        <p className="text-card/60 text-sm font-sans">
          {testType === "full"
            ? `Estimated TOEFL ITP Score: ${totalScale} / 677`
            : `Scaled score: ${totalScale} / ${totalMax}`}
        </p>

        {/* XP earned banner */}
        {savedResult && (
          <div
            className={`mt-4 flex items-center justify-center gap-2 transition-all duration-700 ${
              showXpAnim ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            <div className="bg-gold/20 border border-gold/50 rounded-full px-4 py-1.5 flex items-center gap-2">
              <span className="text-gold font-bold text-sm font-sans">
                ✨ +{savedResult.xpEarned} XP earned!
              </span>
              {savedResult.streakBonus > 0 && (
                <span className="text-xs text-gold/80 font-sans">
                  (including 🔥 +{savedResult.streakBonus} streak bonus)
                </span>
              )}
            </div>
          </div>
        )}

        {/* Streak info */}
        {savedResult && savedResult.newStreak > 0 && (
          <p className="text-gold/70 text-xs font-sans mt-2">
            🔥 Current Streak: <span className="font-bold">{savedResult.newStreak} day{savedResult.newStreak !== 1 ? "s" : ""}</span>
          </p>
        )}

        {saving && (
          <div className="mt-3 flex items-center justify-center gap-2">
            <span className="inline-block w-3 h-3 border-2 border-gold/40 border-t-gold rounded-full animate-spin" />
            <span className="text-gold/60 text-xs font-sans">Saving results...</span>
          </div>
        )}

        {saveError && (
          <p className="text-red-300/80 text-xs font-sans mt-2">
            ⚠️ Failed to save results (no connection to server)
          </p>
        )}
      </div>

      {/* Body */}
      <div className="p-6 bg-card rounded-b-xl">
        <p className="text-xs text-muted-foreground tracking-widest uppercase font-sans mb-4">
          Section Scores
        </p>
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="border border-border rounded-lg p-3 text-center">
            <div className="text-xl font-bold text-navy">{lScore}</div>
            <div className="text-xs text-muted-foreground font-sans mt-0.5">Listening</div>
            <div className="text-xs text-muted-foreground font-sans">/ 68</div>
          </div>
          <div className="border border-border rounded-lg p-3 text-center">
            <div className="text-xl font-bold text-navy">{sScore}</div>
            <div className="text-xs text-muted-foreground font-sans mt-0.5">Structure</div>
            <div className="text-xs text-muted-foreground font-sans">/ 68</div>
          </div>
          <div className="border border-border rounded-lg p-3 text-center">
            <div className="text-xl font-bold text-navy">{rScore}</div>
            <div className="text-xs text-muted-foreground font-sans mt-0.5">Reading</div>
            <div className="text-xs text-muted-foreground font-sans">/ 67</div>
          </div>
        </div>

        <p className="text-xs text-muted-foreground tracking-widest uppercase font-sans mb-3">
          Accuracy
        </p>
        <div className="flex items-center gap-3 mb-2">
          <span className="text-sm text-muted-foreground font-sans w-20">Accuracy</span>
          <div className="flex-1 bg-muted rounded-md h-2">
            <div
              className="gradient-gold h-2 rounded-md transition-all duration-1000"
              style={{ width: `${pct}%` }}
            />
          </div>
          <span className="text-sm font-semibold text-navy font-sans">{pct}%</span>
        </div>
        <p className="text-xs text-muted-foreground font-sans mb-6">
          {rawTotal} correct out of {questions.length} questions
        </p>

        <button
          onClick={onRetry}
          className="w-full gradient-gold text-navy font-bold font-sans rounded-lg py-3 text-sm hover:opacity-90 transition-opacity mb-3"
        >
          Retry This Test
        </button>
        <button
          onClick={onDashboard}
          className="w-full border-2 border-navy text-navy font-semibold font-sans rounded-lg py-2.5 text-sm hover:bg-navy/5 transition-colors"
        >
          Back to Dashboard
        </button>
      </div>
    </div>
  );
};

export default ResultsScreen;
