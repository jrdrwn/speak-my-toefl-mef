import { LONGMAN_LISTENING_QUESTIONS } from "@/data/longmanListening";
import { QUESTIONS } from "@/data/questions";

interface DashboardProps {
  userName: string;
  scores: number[];
  onStartExam: () => void;
  onLogout: () => void;
  startDisabled?: boolean;
  startLabel?: string;
}

const Dashboard = ({ userName, scores, onStartExam, onLogout, startDisabled = false, startLabel = "Mulai" }: DashboardProps) => {
  const bestScore = scores.length > 0 ? Math.max(...scores) : "—";
  const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : "—";
  const listeningCount = LONGMAN_LISTENING_QUESTIONS.length;
  const structureCount = QUESTIONS.structure.length;
  const readingCount = QUESTIONS.reading.length;
  const fullCount = listeningCount + structureCount + readingCount;

  const sections = [
    { type: "listening", icon: "🎧", bg: "bg-amber-50", title: "Section 1 — Listening Comprehension", desc: "Short conversations, longer conversations & talks", badge: "Part A · B · C", badgeClass: "bg-amber-100 text-amber-800", qs: `${listeningCount} Qs`, mins: "35 min" },
    { type: "structure", icon: "✏️", bg: "bg-blue-50", title: "Section 2 — Structure & Written Expression", desc: "Sentence completion & error identification", badge: "Grammar · Syntax", badgeClass: "bg-blue-100 text-blue-800", qs: `${structureCount} Qs`, mins: "25 min" },
    { type: "reading", icon: "📖", bg: "bg-green-50", title: "Section 3 — Reading Comprehension", desc: "Academic passages with inference & vocabulary", badge: "5 Passages", badgeClass: "bg-green-100 text-green-800", qs: `${readingCount} Qs`, mins: "55 min" },
    { type: "full", icon: "🏆", bg: "bg-purple-50", title: "Full Practice Test — All Sections", desc: "Complete simulation · Listening + Structure + Reading", badge: "Official Format", badgeClass: "bg-purple-100 text-purple-800", qs: `${fullCount} Qs`, mins: "115 min", special: true },
  ];

  return (
    <div className="animate-fade-in">
      <div className="gradient-navy p-6 rounded-t-xl flex items-center justify-between">
        <div>
          <h1 className="text-xl font-display font-bold text-card">TOEFL ITP Practice</h1>
          <p className="text-gold text-xs font-sans mt-0.5">Mulai satu alur penuh, section di bawah hanya preview</p>
        </div>
        <button onClick={onLogout} className="bg-gold/20 border border-gold/40 rounded-full px-4 py-1.5 text-gold-light text-sm font-sans hover:bg-gold/30 transition-colors">
          👤 {userName}
        </button>
      </div>

      <div className="p-6 bg-card rounded-b-xl">
        <p className="text-xs text-muted-foreground tracking-widest uppercase font-sans mb-4">Your Progress</p>
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-cream border border-border rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-navy">{scores.length}</div>
            <div className="text-xs text-muted-foreground font-sans mt-0.5">Tests Taken</div>
          </div>
          <div className="bg-cream border border-border rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-navy">{bestScore}</div>
            <div className="text-xs text-muted-foreground font-sans mt-0.5">Best Score</div>
          </div>
          <div className="bg-cream border border-border rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-navy">{avgScore}</div>
            <div className="text-xs text-muted-foreground font-sans mt-0.5">Avg Score</div>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 mb-4">
          <p className="text-xs text-muted-foreground tracking-widest uppercase font-sans">Practice Sections</p>
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
              className={`border rounded-xl p-5 flex items-center gap-4 bg-card ${s.special ? "border-purple-400 bg-purple-50/30" : "border-border"}`}
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 ${s.bg}`}>
                {s.icon}
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-navy font-sans">{s.title}</h3>
                <p className="text-xs text-muted-foreground font-sans mt-0.5">{s.desc}</p>
                <span className={`inline-block text-xs font-semibold px-2.5 py-0.5 rounded-full mt-1.5 ${s.badgeClass}`}>
                  {s.badge}
                </span>
              </div>
              <div className="text-right flex-shrink-0">
                <div className="text-sm font-bold text-navy font-sans">{s.qs}</div>
                <div className="text-xs text-muted-foreground font-sans">{s.mins}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
