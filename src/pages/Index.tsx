import Dashboard from "@/components/Dashboard";
import LoginScreen from "@/components/LoginScreen";
import ResultsScreen from "@/components/ResultsScreen";
import TestScreen from "@/components/TestScreen";
import { LONGMAN_LISTENING_QUESTIONS, LONGMAN_LISTENING_SECTIONS } from "@/data/longmanListening";
import LONGMAN_READING_QUESTIONS from '@/data/longmanReading';
import LONGMAN_STRUCTURE_QUESTIONS from '@/data/longmanStructure';
import { QUESTIONS, Question } from "@/data/questions";
import { useCallback, useMemo, useState } from "react";

type Screen = "login" | "dashboard" | "test" | "results";

interface TestConfig {
  type: string;
  questions: Question[];
  label: string;
  sub: string;
  seconds: number;
  questionOffset: number;
  audioOffset: number;
}

const NUM_SECTIONS = 5;

/** Splits an array into `count` chunks as evenly as possible. */
function splitIntoSections<T>(items: T[], count: number): T[][] {
  const result: T[][] = [];
  const base = Math.floor(items.length / count);
  const remainder = items.length % count;
  let start = 0;
  for (let i = 0; i < count; i++) {
    const size = base + (i < remainder ? 1 : 0);
    if (size > 0) result.push(items.slice(start, start + size));
    start += size;
  }
  return result;
}

const buildExamFlow = () => {
  const stages: TestConfig[] = [];
  let currentOffset = 0;

  // --- LISTENING: flatten all questions then split into 5 ---
  const allListeningQuestions = LONGMAN_LISTENING_SECTIONS.flatMap((s) => s.questions);
  const listeningSections = splitIntoSections(allListeningQuestions, NUM_SECTIONS);
  listeningSections.forEach((qs, i) => {
    stages.push({
      type: "listening",
      questions: qs,
      label: "Longman Listening",
      sub: `Section ${i + 1} of ${NUM_SECTIONS}`,
      seconds: Math.round(7 * 60 * NUM_SECTIONS * (qs.length / allListeningQuestions.length)),
      questionOffset: currentOffset,
      audioOffset: currentOffset,
    });
    currentOffset += qs.length;
  });

  // --- STRUCTURE: split into 5 ---
  const structureSections = splitIntoSections(LONGMAN_STRUCTURE_QUESTIONS, NUM_SECTIONS);
  structureSections.forEach((qs, i) => {
    stages.push({
      type: "structure",
      questions: qs,
      label: "Structure & Written Expression",
      sub: `Section ${i + 1} of ${NUM_SECTIONS}`,
      seconds: Math.round((25 * 60) / NUM_SECTIONS),
      questionOffset: currentOffset,
      audioOffset: 0,
    });
    currentOffset += qs.length;
  });

  // --- READING: split into 5 ---
  const readingSections = splitIntoSections(LONGMAN_READING_QUESTIONS, NUM_SECTIONS);
  readingSections.forEach((qs, i) => {
    stages.push({
      type: "reading",
      questions: qs,
      label: "Reading Comprehension",
      sub: `Section ${i + 1} of ${NUM_SECTIONS}`,
      seconds: Math.round((55 * 60) / NUM_SECTIONS),
      questionOffset: currentOffset,
      audioOffset: 0,
    });
    currentOffset += qs.length;
  });

  return stages;
};

const Index = () => {
  const [screen, setScreen] = useState<Screen>("login");
  const [userName, setUserName] = useState("Student");
  const [scores, setScores] = useState<number[]>([]);
  const [testConfig, setTestConfig] = useState<TestConfig | null>(null);
  const [flowStageIndex, setFlowStageIndex] = useState(0);
  const [flowAnswers, setFlowAnswers] = useState<Record<number, number>>({});
  const [lastAnswers, setLastAnswers] = useState<Record<number, number>>({});

  const examFlow = useMemo(() => {
    return buildExamFlow();
  }, []);

  const combinedQuestions = useMemo(() => {
    return [...LONGMAN_LISTENING_QUESTIONS, ...LONGMAN_STRUCTURE_QUESTIONS, ...LONGMAN_READING_QUESTIONS];
  }, []);

  const handleLogin = useCallback((name: string) => {
    setUserName(name);
    setScreen("dashboard");
  }, []);

  const startExam = useCallback(() => {
    if (examFlow.length === 0) return;
    setFlowStageIndex(0);
    setFlowAnswers({});
    setLastAnswers({});
    setTestConfig(examFlow[0]);
    setScreen("test");
  }, [examFlow]);

  const finishExam = useCallback((answers: Record<number, number>) => {
    setLastAnswers(answers);
    const qs = combinedQuestions;
    let correct = 0;
    qs.forEach((q, i) => {
      if (answers[i] === q.correct) correct += 1;
    });
    const lScore = Math.round(31 + (correct / qs.length) * 37);
    setScores((prev) => [...prev, lScore * 10]);
    setScreen("results");
  }, [combinedQuestions]);

  const handleFinish = useCallback((answers: Record<number, number>) => {
    if (!testConfig) return;

    const mergedAnswers = {
      ...flowAnswers,
      ...Object.fromEntries(
        Object.entries(answers).map(([key, value]) => [testConfig.questionOffset + Number(key), value]),
      ),
    };

    const nextStageIndex = flowStageIndex + 1;
    if (nextStageIndex < examFlow.length) {
      setFlowAnswers(mergedAnswers);
      setFlowStageIndex(nextStageIndex);
      setTestConfig(examFlow[nextStageIndex]);
      return;
    }

    finishExam(mergedAnswers);
  }, [examFlow, finishExam, flowAnswers, flowStageIndex, testConfig]);

  const handleExitTest = useCallback(() => {
    setScreen("dashboard");
    setTestConfig(null);
    setFlowStageIndex(0);
    setFlowAnswers({});
  }, []);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-3xl">
        {screen === "login" && <LoginScreen onLogin={handleLogin} />}
        {screen === "dashboard" && (
          <Dashboard
            userName={userName}
            scores={scores}
            onStartExam={startExam}
            onLogout={() => setScreen("login")}
            startDisabled={examFlow.length === 0}
            startLabel={examFlow.length === 0 ? "Listening belum siap" : "Mulai"}
          />
        )}
        {screen === "test" && testConfig && (
          <TestScreen
            key={`${testConfig.type}-${testConfig.questionOffset}`}
            questions={testConfig.questions}
            testType={testConfig.type}
            label={testConfig.label}
            sub={testConfig.sub}
            totalSeconds={testConfig.seconds}
            questionOffset={testConfig.questionOffset}
            audioOffset={testConfig.audioOffset}
            onFinish={handleFinish}
            onExit={handleExitTest}
          />
        )}
        {screen === "results" && testConfig && (
          <ResultsScreen
            testType="full"
            questions={combinedQuestions}
            answers={lastAnswers}
            onRetry={startExam}
            onDashboard={() => setScreen("dashboard")}
          />
        )}
      </div>
    </div>
  );
};

export default Index;
