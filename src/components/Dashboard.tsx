import { useState } from "react";
import { LONGMAN_LISTENING_QUESTIONS } from "@/data/longmanListening";
import { QUESTIONS } from "@/data/questions";
import LeaderboardCard from "./LeaderboardCard";
import ProgressCard from "./ProgressCard";

interface DashboardProps {
  userName: string;
  userEmail: string;
  onStartExam: () => void;
  onStartSection: (type: string) => void;
  onLogout: () => void;
  startDisabled?: boolean;
  startLabel?: string;
}

type Tab = "sections" | "progress" | "leaderboard";

const Dashboard = ({
  userName,
  userEmail,
  onStartExam,
  onStartSection,
  onLogout,
  startDisabled = false,
  startLabel = "Mulai",
}: DashboardProps) => {
  const [activeTab, setActiveTab] = useState<Tab>("sections");

  const listeningCount = LONGMAN_LISTENING_QUESTIONS.length;
  const structureCount = QUESTIONS.structure.length;
  const readingCount = QUESTIONS.reading.length;
  const fullCount = listeningCount + structureCount + readingCount;

  const sections = [
    {
      type: "listening",
      icon: "🎧",
      bg: "bg-amber-50",
      title: "Section 1 — Listening Comprehension",
      desc: "Short conversations, longer conversations & talks",
      badge: "Part A · B · C",
      badgeClass: "bg-amber-100 text-amber-800",
      qs: `${listeningCount} Qs`,
      mins: "35 min",
    },
    {
      type: "structure",
      icon: "✏️",
      bg: "bg-blue-50",
      title: "Section 2 — Structure & Written Expression",
      desc: "Sentence completion & error identification",
      badge: "Grammar · Syntax",
      badgeClass: "bg-blue-100 text-blue-800",
      qs: `${structureCount} Qs`,
      mins: "25 min",
    },
    {
      type: "reading",
      icon: "📖",
      bg: "bg-green-50",
      title: "Section 3 — Reading Comprehension",
      desc: "Academic passages with inference & vocabulary",
      badge: "5 Passages",
      badgeClass: "bg-green-100 text-green-800",
      qs: `${readingCount} Qs`,
      mins: "55 min",
    },
    {
      type: "full",
      icon: "🏆",
      bg: "bg-purple-50",
      title: "Full Practice Test — All Sections",
      desc: "Complete simulation · Listening + Structure + Reading",
      badge: "Official Format",
      badgeClass: "bg-purple-100 text-purple-800",
      qs: `${fullCount} Qs`,
      mins: "115 min",
      special: true,
    },
  ];

  const tabs: { key: Tab; label: string; icon: string }[] = [
    { key: "sections", label: "Latihan", icon: "📚" },
    { key: "progress", label: "Progress", icon: "📈" },
    { key: "leaderboard", label: "Ranking", icon: "🏆" },
  ];

  return (
    <div className="animate-fade-in">
      {/* Top Nav */}
      <div className="gradient-navy p-5 rounded-t-xl flex items-center justify-between">
        <div>
          <h1 className="text-xl font-display font-bold text-card">TOEFL ITP Practice</h1>
          <p className="text-gold text-xs font-sans mt-0.5">
            Halo, <span className="font-semibold">{userName}</span> 👋
          </p>
        </div>
        <button
          onClick={onLogout}
          className="bg-card/10 border border-card/20 rounded-full px-3 py-1.5 text-card/70 text-xs font-sans hover:bg-card/20 transition-colors flex items-center gap-1.5"
        >
          <span>👤</span>
          <span>Logout</span>
        </button>
      </div>

      {/* Tab Bar */}
      <div className="bg-card border-x border-border">
        <div className="flex">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-semibold font-sans transition-all duration-200 border-b-2 ${
                activeTab === tab.key
                  ? "border-navy text-navy bg-navy/5"
                  : "border-transparent text-muted-foreground hover:text-navy/70 hover:bg-muted/30"
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="bg-card rounded-b-xl border-x border-b border-border">
        {/* === SECTIONS TAB === */}
        {activeTab === "sections" && (
          <div className="p-5">
            <div className="flex items-center justify-between gap-3 mb-4">
              <p className="text-xs text-muted-foreground tracking-widest uppercase font-sans">
                Pilih Section
              </p>
              <button
                onClick={onStartExam}
                disabled={startDisabled}
                className="gradient-gold text-navy font-bold font-sans rounded-full px-5 py-2 text-sm hover:opacity-90 transition-opacity disabled:cursor-not-allowed disabled:opacity-50"
              >
                {startLabel}
              </button>
            </div>

            <div className="flex flex-col gap-3">
              {sections.map((s) => (
                <div
                  key={s.type}
                  onClick={() => onStartSection(s.type)}
                  className={`border rounded-xl p-4 flex items-center gap-4 cursor-pointer group transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 active:scale-[0.99] ${
                    s.special
                      ? "border-purple-400 bg-purple-50/30 hover:border-purple-500 hover:bg-purple-50/50"
                      : "border-border hover:border-navy/40 hover:bg-cream/60"
                  }`}
                >
                  <div
                    className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0 ${s.bg} group-hover:scale-110 transition-transform duration-200`}
                  >
                    {s.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-navy font-sans group-hover:text-navy/80 leading-tight">
                      {s.title}
                    </h3>
                    <p className="text-xs text-muted-foreground font-sans mt-0.5">{s.desc}</p>
                    <span
                      className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full mt-1.5 ${s.badgeClass}`}
                    >
                      {s.badge}
                    </span>
                  </div>
                  <div className="text-right flex-shrink-0 flex flex-col items-end gap-1">
                    <div className="text-sm font-bold text-navy font-sans">{s.qs}</div>
                    <div className="text-xs text-muted-foreground font-sans">{s.mins}</div>
                    <span className="text-xs text-navy/40 font-sans group-hover:text-navy/70 transition-colors">
                      Mulai →
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* === PROGRESS TAB === */}
        {activeTab === "progress" && (
          <div className="p-4">
            <ProgressCard />
          </div>
        )}

        {/* === LEADERBOARD TAB === */}
        {activeTab === "leaderboard" && (
          <div className="p-4">
            <LeaderboardCard currentUserEmail={userEmail} />
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
