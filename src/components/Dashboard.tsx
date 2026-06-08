import { useState } from "react";
import { LONGMAN_LISTENING_QUESTIONS } from "@/data/longmanListening";
import LONGMAN_STRUCTURE_QUESTIONS from "@/data/longmanStructure";
import LONGMAN_READING_QUESTIONS from "@/data/longmanReading";
import LeaderboardCard from "./LeaderboardCard";
import ProgressCard from "./ProgressCard";
import { useAuth } from "@/hooks/useAuth";
import { Eye, EyeOff } from "lucide-react";

interface DashboardProps {
  userName: string;
  userEmail: string;
  onStartExam: () => void;
  onStartSection: (type: string) => void;
  onLogout: () => void;
  startDisabled?: boolean;
  startLabel?: string;
}

type Tab = "sections" | "progress" | "leaderboard" | "profile";

const Dashboard = ({
  userName,
  userEmail,
  onStartExam,
  onStartSection,
  onLogout,
  startDisabled = false,
  startLabel = "Start",
}: DashboardProps) => {
  const [activeTab, setActiveTab] = useState<Tab>("sections");
  const { updateProfile } = useAuth();

  // Profile settings states
  const [profileName, setProfileName] = useState(userName);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [profileError, setProfileError] = useState("");
  const [profileSuccess, setProfileSuccess] = useState("");
  const [profileLoading, setProfileLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleUpdateName = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError("");
    setProfileSuccess("");

    if (!profileName.trim()) {
      setProfileError("Name cannot be empty");
      return;
    }
    setProfileLoading(true);

    try {
      await updateProfile({ name: profileName });
      setProfileSuccess("Name updated successfully!");
    } catch (err) {
      setProfileError(err instanceof Error ? err.message : "Failed to update name");
    } finally {
      setProfileLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError("");
    setProfileSuccess("");

    if (!currentPassword) {
      setProfileError("Current password is required");
      return;
    }
    if (newPassword.length < 6) {
      setProfileError("New password must be at least 6 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      setProfileError("Confirm new password does not match");
      return;
    }
    setProfileLoading(true);

    try {
      await updateProfile({ currentPassword, newPassword });
      setProfileSuccess("Password changed successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setProfileError(err instanceof Error ? err.message : "Failed to change password");
    } finally {
      setProfileLoading(false);
    }
  };

  const listeningCount = LONGMAN_LISTENING_QUESTIONS.length;
  const structureCount = LONGMAN_STRUCTURE_QUESTIONS.length;
  const readingCount = LONGMAN_READING_QUESTIONS.length;
  const fullCount = listeningCount + structureCount + readingCount;

  // Hitung total waktu full test secara proporsional (sama dengan formula di Index.tsx)
  const totalFullMinutes = Math.round(
    (listeningCount / 50) * 35 +
    (structureCount / 40) * 25 +
    (readingCount   / 50) * 55
  );
  const fullMinsLabel = totalFullMinutes >= 60
    ? `${Math.floor(totalFullMinutes / 60)} jam ${totalFullMinutes % 60} menit`
    : `${totalFullMinutes} min`;

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
      mins: null, // Tanpa timer saat latihan per-section
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
      mins: null, // Tanpa timer saat latihan per-section
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
      mins: null, // Tanpa timer saat latihan per-section
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
      mins: fullMinsLabel, // Dihitung proporsional dari jumlah soal aktual
      special: true,
    },
  ];

  const tabs: { key: Tab; label: string; icon: string }[] = [
    { key: "sections", label: "Practice", icon: "📚" },
    { key: "progress", label: "Progress", icon: "📈" },
    { key: "leaderboard", label: "Leaderboard", icon: "🏆" },
    { key: "profile", label: "Profile", icon: "👤" },
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
                Select Section
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
                    {s.mins ? (
                      <div className="text-xs text-muted-foreground font-sans">{s.mins}</div>
                    ) : (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground/60 font-sans">
                        <span>⏱</span>
                        <span>No Limit</span>
                      </div>
                    )}
                    <span className="text-xs text-navy/40 font-sans group-hover:text-navy/70 transition-colors">
                      Start →
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

        {/* === PROFILE TAB === */}
        {activeTab === "profile" && (
          <div className="p-6 flex flex-col gap-6 font-sans">
            {/* User Header Info */}
            <div className="flex items-center gap-4 border-b border-border pb-6">
              <div className="w-16 h-16 rounded-full gradient-gold flex items-center justify-center text-navy font-display font-bold text-2xl shadow-inner flex-shrink-0">
                {userName.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <h2 className="text-lg font-bold text-navy truncate">{userName}</h2>
                <p className="text-sm text-muted-foreground truncate">{userEmail}</p>
              </div>
            </div>

            {/* Error and Success Notifications */}
            {profileError && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-700 rounded-lg px-4 py-2.5 text-sm animate-fade-in">
                ⚠️ {profileError}
              </div>
            )}
            {profileSuccess && (
              <div className="bg-green-500/10 border border-green-500/20 text-green-700 rounded-lg px-4 py-2.5 text-sm animate-fade-in">
                ✅ {profileSuccess}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Profile Details Form */}
              <div className="border border-border rounded-xl p-5 bg-card flex flex-col gap-4 shadow-sm">
                <div>
                  <h3 className="text-sm font-bold text-navy uppercase tracking-wider mb-1">Profile Information</h3>
                  <p className="text-xs text-muted-foreground">Update your full name information here.</p>
                </div>

                <form onSubmit={handleUpdateName} className="flex flex-col gap-4">
                  <div>
                    <label className="block text-muted-foreground text-xs font-semibold mb-1 uppercase tracking-wide">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={profileName}
                      onChange={(e) => setProfileName(e.target.value)}
                      placeholder="Full Name"
                      required
                      className="w-full bg-background border border-input rounded-lg px-3 py-2 text-sm outline-none focus:border-navy/50 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-muted-foreground text-xs font-semibold mb-1 uppercase tracking-wide">
                      Email (Cannot be changed)
                    </label>
                    <input
                      type="email"
                      value={userEmail}
                      disabled
                      className="w-full bg-muted border border-input rounded-lg px-3 py-2 text-sm text-muted-foreground cursor-not-allowed outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={profileLoading}
                    className="gradient-gold text-navy font-bold rounded-lg py-2.5 text-xs hover:opacity-90 transition-opacity disabled:opacity-60 font-semibold uppercase tracking-wider flex items-center justify-center gap-2"
                  >
                    {profileLoading ? (
                      <>
                        <span className="inline-block w-3 h-3 border-2 border-navy/40 border-t-navy rounded-full animate-spin" />
                        Saving...
                      </>
                    ) : (
                      "Save Name"
                    )}
                  </button>
                </form>
              </div>

              {/* Password Settings Form */}
              <div className="border border-border rounded-xl p-5 bg-card flex flex-col gap-4 shadow-sm">
                <div>
                  <h3 className="text-sm font-bold text-navy uppercase tracking-wider mb-1">Change Password</h3>
                  <p className="text-xs text-muted-foreground">Change your account password for extra security.</p>
                </div>

                <form onSubmit={handleUpdatePassword} className="flex flex-col gap-4">
                  <div>
                    <label className="block text-muted-foreground text-xs font-semibold mb-1 uppercase tracking-wide">
                      Current Password
                    </label>
                    <div className="relative">
                      <input
                        type={showCurrentPassword ? "text" : "password"}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        className="w-full bg-background border border-input rounded-lg pl-3 pr-10 py-2 text-sm outline-none focus:border-navy/50 transition-colors"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-muted-foreground/80 transition-colors focus:outline-none"
                      >
                        {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-muted-foreground text-xs font-semibold mb-1 uppercase tracking-wide">
                      New Password
                    </label>
                    <div className="relative">
                      <input
                        type={showNewPassword ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        minLength={6}
                        className="w-full bg-background border border-input rounded-lg pl-3 pr-10 py-2 text-sm outline-none focus:border-navy/50 transition-colors"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-muted-foreground/80 transition-colors focus:outline-none"
                      >
                        {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-muted-foreground text-xs font-semibold mb-1 uppercase tracking-wide">
                      Confirm New Password
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        className="w-full bg-background border border-input rounded-lg pl-3 pr-10 py-2 text-sm outline-none focus:border-navy/50 transition-colors"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-muted-foreground/80 transition-colors focus:outline-none"
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={profileLoading}
                    className="gradient-gold text-navy font-bold rounded-lg py-2.5 text-xs hover:opacity-90 transition-opacity disabled:opacity-60 font-semibold uppercase tracking-wider flex items-center justify-center gap-2"
                  >
                    {profileLoading ? (
                      <>
                        <span className="inline-block w-3 h-3 border-2 border-navy/40 border-t-navy rounded-full animate-spin" />
                        Changing...
                      </>
                    ) : (
                      "Change Password"
                    )}
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
