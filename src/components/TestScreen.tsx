import { LISTENING_SCRIPTS, Question } from "@/data/questions";
import { useCallback, useEffect, useRef, useState } from "react";

interface TestScreenProps {
  questions: Question[];
  testType: string;
  label: string;
  sub: string;
  totalSeconds: number;
  onFinish: (answers: Record<number, number>) => void;
  onExit: () => void;
}

const LETTERS = ["A", "B", "C", "D"];

const SPEECH_CONFIG = {
  lang: "en-US",
  rate: 0.9,
  pitch: 1,
  volume: 1,
} as const;

const PREFERRED_VOICE_NAMES = [
  // "Google US English",
  // "Microsoft Aria Online (Natural) - English (United States)",
  // "Microsoft Jenny Online (Natural) - English (United States)",
  // "Samantha",
  // "Alex",
  "Daniel",
];

const pickConsistentVoice = (): SpeechSynthesisVoice | null => {
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return null;

  for (const preferred of PREFERRED_VOICE_NAMES) {
    const exact = voices.find((v) => v.name === preferred);
    if (exact) return exact;
  }

  const enUs = voices.find((v) => v.lang.toLowerCase() === "en-us");
  if (enUs) return enUs;

  const english = voices.find((v) => v.lang.toLowerCase().startsWith("en"));
  return english ?? null;
};

const TestScreen = ({ questions, testType, label, sub, totalSeconds, onFinish, onExit }: TestScreenProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [timeLeft, setTimeLeft] = useState(totalSeconds);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const synthRef = useRef<SpeechSynthesisUtterance | null>(null);
  const answersRef = useRef<Record<number, number>>({});
  const onFinishRef = useRef(onFinish);
  const selectedVoiceRef = useRef<SpeechSynthesisVoice | null>(null);

  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);

  useEffect(() => {
    onFinishRef.current = onFinish;
  }, [onFinish]);

  useEffect(() => {
    const updateVoice = () => {
      selectedVoiceRef.current = pickConsistentVoice();
    };

    updateVoice();
    window.speechSynthesis.addEventListener("voiceschanged", updateVoice);
    return () => {
      window.speechSynthesis.removeEventListener("voiceschanged", updateVoice);
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
    if (testType === "listening") return currentIndex;
    if (testType === "full" && currentIndex < 50) return currentIndex;
    return -1;
  }, [testType, currentIndex]);

  const playAudio = useCallback(() => {
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const idx = getListeningIndex();
    const script = idx >= 0 ? LISTENING_SCRIPTS[idx] : null;
    if (!script) return;

    const utterance = new SpeechSynthesisUtterance(script);
    utterance.lang = SPEECH_CONFIG.lang;
    utterance.rate = SPEECH_CONFIG.rate;
    utterance.pitch = SPEECH_CONFIG.pitch;
    utterance.volume = SPEECH_CONFIG.volume;

    if (!selectedVoiceRef.current) {
      selectedVoiceRef.current = pickConsistentVoice();
    }
    if (selectedVoiceRef.current) {
      utterance.voice = selectedVoiceRef.current;
    }

    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    synthRef.current = utterance;
    setIsSpeaking(true);

    window.speechSynthesis.speak(utterance);
  }, [getListeningIndex, isSpeaking]);

  useEffect(() => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  }, [currentIndex]);

  const showDots = Math.min(total, 30);

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
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs text-muted-foreground font-sans">
            Question {currentIndex + 1} of {total}
          </span>
          <div className="flex flex-wrap gap-1 max-w-[220px]">
            {Array.from({ length: showDots }).map((_, i) => (
              <div
                key={i}
                onClick={() => setCurrentIndex(i)}
                className={`w-5 h-5 rounded-full border-2 cursor-pointer transition-all ${
                  answers[i] !== undefined ? "bg-navy border-navy" : "border-border"
                } ${i === currentIndex ? "border-gold ring-2 ring-gold/40" : ""}`}
              />
            ))}
          </div>
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
