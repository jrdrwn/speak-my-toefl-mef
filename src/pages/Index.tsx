import Dashboard from "@/components/Dashboard";
import LoginScreen from "@/components/LoginScreen";
import ResultsScreen from "@/components/ResultsScreen";
import TestScreen from "@/components/TestScreen";
import { LONGMAN_LISTENING_QUESTIONS, LONGMAN_LISTENING_SECTIONS } from "@/data/longmanListening";
import LONGMAN_READING_QUESTIONS from "@/data/longmanReading";
import LONGMAN_STRUCTURE_QUESTIONS from "@/data/longmanStructure";
import { Question } from "@/data/questions";
import { useAuth } from "@/hooks/useAuth";
import { useCallback, useMemo, useState } from "react";

type Screen = "dashboard" | "test" | "results";

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
  const { user, isAuthenticated, logout } = useAuth();

  const [screen, setScreen] = useState<Screen>("dashboard");
  const [testConfig, setTestConfig] = useState<TestConfig | null>(null);
  const [flowStageIndex, setFlowStageIndex] = useState(0);
  const [flowAnswers, setFlowAnswers] = useState<Record<number, number>>({});
  const [lastAnswers, setLastAnswers] = useState<Record<number, number>>({});
  const [sectionTestType, setSectionTestType] = useState<string>("full");
  const [sectionFlow, setSectionFlow] = useState<TestConfig[]>([]);
  const [sectionQuestions, setSectionQuestions] = useState<Question[]>([]);

  const examFlow = useMemo(() => buildExamFlow(), []);

  const combinedQuestions = useMemo(
    () => [...LONGMAN_LISTENING_QUESTIONS, ...LONGMAN_STRUCTURE_QUESTIONS, ...LONGMAN_READING_QUESTIONS],
    []
  );

  const startExam = useCallback(() => {
    if (examFlow.length === 0) return;
    setFlowStageIndex(0);
    setFlowAnswers({});
    setLastAnswers({});
    setSectionTestType("full");
    setTestConfig(examFlow[0]);
    setScreen("test");
  }, [examFlow]);

  const startSection = useCallback(
    (type: string) => {
      let sectionFlow: TestConfig[];
      if (type === "listening") {
        const allListeningQuestions = LONGMAN_LISTENING_SECTIONS.flatMap((s) => s.questions);
        const listeningSections = splitIntoSections(allListeningQuestions, NUM_SECTIONS);
        let offset = 0;
        sectionFlow = listeningSections.map((qs, i) => {
          const cfg: TestConfig = {
            type: "listening",
            questions: qs,
            label: "Listening Comprehension",
            sub: `Section ${i + 1} of ${NUM_SECTIONS}`,
            seconds: Math.round(7 * 60 * NUM_SECTIONS * (qs.length / allListeningQuestions.length)),
            questionOffset: offset,
            audioOffset: offset,
          };
          offset += qs.length;
          return cfg;
        });
      } else if (type === "structure") {
        const structureSections = splitIntoSections(LONGMAN_STRUCTURE_QUESTIONS, NUM_SECTIONS);
        let offset = 0;
        sectionFlow = structureSections.map((qs, i) => {
          const cfg: TestConfig = {
            type: "structure",
            questions: qs,
            label: "Structure & Written Expression",
            sub: `Section ${i + 1} of ${NUM_SECTIONS}`,
            seconds: Math.round((25 * 60) / NUM_SECTIONS),
            questionOffset: offset,
            audioOffset: 0,
          };
          offset += qs.length;
          return cfg;
        });
      } else if (type === "reading") {
        const readingSections = splitIntoSections(LONGMAN_READING_QUESTIONS, NUM_SECTIONS);
        let offset = 0;
        sectionFlow = readingSections.map((qs, i) => {
          const cfg: TestConfig = {
            type: "reading",
            questions: qs,
            label: "Reading Comprehension",
            sub: `Section ${i + 1} of ${NUM_SECTIONS}`,
            seconds: Math.round((55 * 60) / NUM_SECTIONS),
            questionOffset: offset,
            audioOffset: 0,
          };
          offset += qs.length;
          return cfg;
        });
      } else {
        startExam();
        return;
      }

      if (sectionFlow.length === 0) return;
      const allSectionQs = sectionFlow.flatMap((s) => s.questions);
      setFlowStageIndex(0);
      setFlowAnswers({});
      setLastAnswers({});
      setSectionTestType(type);
      setSectionQuestions(allSectionQs);
      setTestConfig(sectionFlow[0]);
      setSectionFlow(sectionFlow);
      setScreen("test");
    },
    [startExam]
  );

  const finishExam = useCallback(
    (answers: Record<number, number>) => {
      setLastAnswers(answers);
      setScreen("results");
    },
    []
  );

  const handleFinish = useCallback(
    (answers: Record<number, number>) => {
      if (!testConfig) return;

      const mergedAnswers = {
        ...flowAnswers,
        ...Object.fromEntries(
          Object.entries(answers).map(([key, value]) => [
            testConfig.questionOffset + Number(key),
            value,
          ])
        ),
      };

      const activeFlow = sectionTestType === "full" ? examFlow : sectionFlow;
      const nextStageIndex = flowStageIndex + 1;
      if (nextStageIndex < activeFlow.length) {
        setFlowAnswers(mergedAnswers);
        setFlowStageIndex(nextStageIndex);
        setTestConfig(activeFlow[nextStageIndex]);
        return;
      }

      finishExam(mergedAnswers);
    },
    [examFlow, sectionFlow, sectionTestType, finishExam, flowAnswers, flowStageIndex, testConfig]
  );

  const handleExitTest = useCallback(() => {
    setScreen("dashboard");
    setTestConfig(null);
    setFlowStageIndex(0);
    setFlowAnswers({});
  }, []);

  // Show login if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-3xl">
          <LoginScreen />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-3xl">
        {screen === "dashboard" && (
          <Dashboard
            userName={user!.name}
            userEmail={user!.email}
            onStartExam={startExam}
            onStartSection={startSection}
            onLogout={() => {
              logout();
            }}
            startDisabled={examFlow.length === 0}
            startLabel={examFlow.length === 0 ? "Listening not ready" : "Start"}
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
            testType={sectionTestType}
            questions={
              sectionTestType === "full" ? combinedQuestions : sectionQuestions
            }
            answers={lastAnswers}
            onRetry={() =>
              sectionTestType === "full" ? startExam() : startSection(sectionTestType)
            }
            onDashboard={() => setScreen("dashboard")}
          />
        )}
      </div>
    </div>
  );
};

export default Index;
