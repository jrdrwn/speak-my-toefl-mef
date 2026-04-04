import { useState, useCallback } from "react";
import LoginScreen from "@/components/LoginScreen";
import Dashboard from "@/components/Dashboard";
import TestScreen from "@/components/TestScreen";
import ResultsScreen from "@/components/ResultsScreen";
import { QUESTIONS, Question } from "@/data/questions";

type Screen = "login" | "dashboard" | "test" | "results";

interface TestConfig {
  type: string;
  questions: Question[];
  label: string;
  sub: string;
  seconds: number;
}

const Index = () => {
  const [screen, setScreen] = useState<Screen>("login");
  const [userName, setUserName] = useState("Student");
  const [scores, setScores] = useState<number[]>([]);
  const [testConfig, setTestConfig] = useState<TestConfig | null>(null);
  const [lastAnswers, setLastAnswers] = useState<Record<number, number>>({});

  const handleLogin = useCallback((name: string) => {
    setUserName(name);
    setScreen("dashboard");
  }, []);

  const handleStartTest = useCallback((type: string) => {
    let qs: Question[], seconds: number, label: string, sub: string;
    if (type === "listening") {
      qs = QUESTIONS.listening; seconds = 35 * 60; label = "Listening Comprehension"; sub = "Section 1 · Part A";
    } else if (type === "structure") {
      qs = QUESTIONS.structure; seconds = 25 * 60; label = "Structure & Written Expression"; sub = "Section 2";
    } else if (type === "reading") {
      qs = QUESTIONS.reading; seconds = 55 * 60; label = "Reading Comprehension"; sub = "Section 3";
    } else {
      qs = [...QUESTIONS.listening, ...QUESTIONS.structure, ...QUESTIONS.reading];
      seconds = 115 * 60; label = "Full Practice Test"; sub = "Section 1 — Listening";
    }
    setTestConfig({ type, questions: qs, label, sub, seconds });
    setScreen("test");
  }, []);

  const handleFinish = useCallback((answers: Record<number, number>) => {
    setLastAnswers(answers);
    if (testConfig?.type === "full") {
      const qs = testConfig.questions;
      let correct = 0;
      qs.forEach((q, i) => { if (answers[i] === q.correct) correct++; });
      const lScore = Math.round(31 + (correct / qs.length) * 37);
      setScores((prev) => [...prev, lScore * 10]);
    }
    setScreen("results");
  }, [testConfig]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-3xl">
        {screen === "login" && <LoginScreen onLogin={handleLogin} />}
        {screen === "dashboard" && (
          <Dashboard userName={userName} scores={scores} onStartTest={handleStartTest} onLogout={() => setScreen("login")} />
        )}
        {screen === "test" && testConfig && (
          <TestScreen
            questions={testConfig.questions}
            testType={testConfig.type}
            label={testConfig.label}
            sub={testConfig.sub}
            totalSeconds={testConfig.seconds}
            onFinish={handleFinish}
            onExit={() => setScreen("dashboard")}
          />
        )}
        {screen === "results" && testConfig && (
          <ResultsScreen
            testType={testConfig.type}
            questions={testConfig.questions}
            answers={lastAnswers}
            onRetry={() => handleStartTest(testConfig.type)}
            onDashboard={() => setScreen("dashboard")}
          />
        )}
      </div>
    </div>
  );
};

export default Index;
