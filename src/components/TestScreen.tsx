import { Question } from "@/data/questions";
import { useCallback, useEffect, useRef, useState } from "react";

interface TestScreenProps {
  questions: Question[];
  testType: string;
  label: string;
  sub: string;
  totalSeconds: number;
  questionOffset: number;
  audioOffset: number;
  onFinish: (answers: Record<number, number>) => void;
  onExit: () => void;
}

const LETTERS = ["A", "B", "C", "D"];

const TestScreen = ({ questions, testType, label, sub, totalSeconds, questionOffset, audioOffset, onFinish, onExit }: TestScreenProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [timeLeft, setTimeLeft] = useState(totalSeconds);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showDots, setShowDots] = useState(false);
  const [audioError, setAudioError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const answersRef = useRef<Record<number, number>>({});
  const onFinishRef = useRef(onFinish);

  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);

  useEffect(() => {
    onFinishRef.current = onFinish;
  }, [onFinish]);

  useEffect(() => {
    const audio = new Audio();
    audio.preload = "auto";

    const handleEnded = () => setIsSpeaking(false);
    const handleError = () => {
      setIsSpeaking(false);
      setAudioError("Audio custom untuk soal ini belum tersedia.");
    };

    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("error", handleError);
    audioRef.current = audio;

    return () => {
      audio.pause();
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("error", handleError);
      audio.src = "";
      audioRef.current = null;
    };
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(interval);
          onFinishRef.current(answersRef.current);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const q = questions[currentIndex];
  const total = questions.length;
  const progress = ((currentIndex + 1) / total) * 100;
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const timerColor = timeLeft < 300 ? "text-destructive" : timeLeft < 600 ? "text-gold" : "text-card";

  const selectAnswer = (i: number) => {
    setAnswers((prev) => ({ ...prev, [currentIndex]: i }));
  };

  const prevQ = () => { if (currentIndex > 0) setCurrentIndex(currentIndex - 1); };
  const nextQ = () => {
    if (currentIndex === total - 1) {
      onFinish(answers);
    } else {
      setCurrentIndex(currentIndex + 1);
    }
  };

  // Determine the global listening index for TTS
  const getListeningIndex = useCallback(() => {
    if (testType === "listening") return audioOffset + currentIndex;
    return -1;
  }, [audioOffset, currentIndex, testType]);

  const stopAudio = useCallback(() => {
    if (!audioRef.current) return;
    audioRef.current.pause();
    audioRef.current.currentTime = 0;
    setIsSpeaking(false);
  }, []);

  const playAudio = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isSpeaking) {
      stopAudio();
      return;
    }

    const idx = getListeningIndex();
    const source = q.audio ? `/listening/longman/${q.audio}` : idx >= 0 ? `/listening/${idx}.mp3` : null;
    if (!source) return;
    const sourceUrl = new URL(source, window.location.origin).toString();
    if (audio.src !== sourceUrl) {
      audio.src = sourceUrl;
    }

    audio.currentTime = q.audioSeekMinute ? q.audioSeekMinute * 60 : 0;
    setAudioError(null);
    void audio.play()
      .then(() => setIsSpeaking(true))
      .catch(() => {
        setIsSpeaking(false);
        setAudioError("Audio tidak bisa diputar di device ini.");
      });
  }, [getListeningIndex, isSpeaking, stopAudio]);

  useEffect(() => {
    stopAudio();
    setAudioError(null);
  }, [currentIndex, stopAudio]);




  return (
    <div className="animate-fade-in">
      {/* Top bar */}
      <div className="gradient-navy px-6 py-3 flex items-center justify-between rounded-t-xl">
        <div>
          <div className="text-gold text-xs font-sans tracking-wider">{label}</div>
          <div className="text-card/60 text-xs font-sans mt-0.5">{sub}</div>
        </div>
        <div className={`font-mono font-bold text-lg ${timerColor}`}>
          {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
        </div>
      </div>

      {/* Progress bar */}
      <div className="bg-card/15 h-1">
        <div className="gradient-gold h-1 transition-all duration-300" style={{ width: `${progress}%` }} />
      </div>

      {/* Body */}
      <div className="p-6 bg-card rounded-b-xl">
        {testType === "listening" && q.instruction && (
          <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50/70 p-4">
            <div className="text-[11px] tracking-[0.2em] uppercase text-amber-700 font-semibold font-sans">Longman Listening</div>
            <div className="mt-2 text-sm text-foreground font-sans leading-relaxed">{q.instruction}</div>
            {q.audio && (
              <div className="mt-3 text-xs text-amber-800 font-sans">
                Audio file: {q.audio} {q.audioSeekMinute !== undefined ? `· start at minute ${q.audioSeekMinute}` : ""}
              </div>
            )}
          </div>
        )}

        {/* Question navigation (collapsible) */}
        <div className="mb-4">
          <button
            onClick={() => setShowDots((v) => !v)}
            className="w-full flex items-center justify-between text-xs text-muted-foreground font-sans hover:text-foreground transition-colors py-1 px-2 rounded-lg hover:bg-muted"
          >
            <span>Question {currentIndex + 1} of {total}</span>
            <span className={`transition-transform duration-200 ${showDots ? "rotate-180" : ""}`}>▾</span>
          </button>
          {showDots && (
            <div className="flex flex-wrap gap-1 mt-2 px-1">
              {Array.from({ length: total }).map((_, i) => (
                <div
                  key={i}
                  onClick={() => setCurrentIndex(i)}
                  className={`w-5 h-5 rounded-full border-2 cursor-pointer transition-all flex items-center justify-center text-[0.5rem] ${
                    answers[i] !== undefined ? "bg-navy border-navy text-white" : "border-border"
                  } ${i === currentIndex ? "border-gold ring-2 ring-gold/40" : ""}`}
                >
                  {i + 1}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Audio player */}
        {q.audio && (
          <div className="bg-muted border border-border rounded-lg p-4 mb-6 flex items-center gap-3">
            <button
              onClick={playAudio}
              className="w-10 h-10 rounded-full gradient-navy flex items-center justify-center text-gold flex-shrink-0 hover:opacity-85 transition-opacity"
            >
              {isSpeaking ? "⏸" : "▶"}
            </button>
            <div className="flex-1">
              <div className="text-sm font-semibold text-navy font-sans">{q.audio}</div>
              <div className="text-xs text-muted-foreground font-sans">{q.part} · Click ▶ to listen</div>
              {audioError && <div className="text-xs text-destructive font-sans mt-1">{audioError}</div>}
            </div>
            <div className="flex items-center gap-0.5 h-5">
              {[6, 14, 10, 16, 8, 12].map((h, i) => (
                <span
                  key={i}
                  className="w-[3px] bg-gold rounded-sm transition-all"
                  style={{
                    height: `${h}px`,
                    animation: isSpeaking ? `wave-bar 0.8s ease-in-out ${i * 0.1}s infinite alternate` : "none",
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {/* Reading layout or question */}
        {q.passage ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-muted border border-border rounded-lg p-4 max-h-96 overflow-y-auto text-sm leading-relaxed text-foreground/80 font-serif">
              <h4 className="text-sm font-semibold text-navy font-sans mb-2">Reading Passage</h4>
              {q.passage}
            </div>
            <div>
              <p className="text-sm text-foreground leading-relaxed mb-4 font-sans">{q.q}</p>
              <div className="flex flex-col gap-2.5">
                {q.a.map((opt, i) => (
                  <div
                    key={i}
                    onClick={() => selectAnswer(i)}
                    className={`border-2 rounded-lg px-4 py-3 cursor-pointer flex items-start gap-3 transition-all font-sans text-sm ${
                      answers[currentIndex] === i
                        ? "border-info bg-info/5 text-info"
                        : "border-border hover:border-gold hover:bg-gold/5 text-foreground/80"
                    }`}
                  >
                    <span className="w-6 h-6 rounded-full border-2 border-current flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                      {LETTERS[i]}
                    </span>
                    <span>{opt}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <>
            <p className="text-sm text-foreground leading-relaxed mb-5 font-sans">{q.q}</p>
            <div className="flex flex-col gap-2.5">
              {q.a.map((opt, i) => (
                <div
                  key={i}
                  onClick={() => selectAnswer(i)}
                  className={`border-2 rounded-lg px-4 py-3 cursor-pointer flex items-start gap-3 transition-all font-sans text-sm ${
                    answers[currentIndex] === i
                      ? "border-info bg-info/5 text-info"
                      : "border-border hover:border-gold hover:bg-gold/5 text-foreground/80"
                  }`}
                >
                  <span className="w-6 h-6 rounded-full border-2 border-current flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                    {LETTERS[i]}
                  </span>
                  <span>{opt}</span>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-border">
          <div className="flex gap-2">
            <button onClick={prevQ} disabled={currentIndex === 0} className="gradient-navy text-gold font-sans font-semibold text-sm rounded-lg px-5 py-2.5 disabled:opacity-30 hover:opacity-85 transition-opacity">
              ← Prev
            </button>
            <button onClick={onExit} className="border-2 border-navy text-navy font-sans font-semibold text-sm rounded-lg px-5 py-2.5 hover:bg-navy/5 transition-colors">
              Exit
            </button>
            {import.meta.env.DEV && (
              <button
                onClick={() => onFinish(answers)}
                className="bg-amber-600 hover:bg-amber-700 text-white font-sans font-semibold text-sm rounded-lg px-4 py-2.5 transition-colors"
              >
                Skip Section (Dev)
              </button>
            )}
          </div>
          <button onClick={nextQ} className="gradient-navy text-gold font-sans font-semibold text-sm rounded-lg px-5 py-2.5 hover:opacity-85 transition-opacity">
            {currentIndex === total - 1 ? "Finish ✓" : "Next →"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TestScreen;
