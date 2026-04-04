import { useState } from "react";

interface LoginScreenProps {
  onLogin: (name: string) => void;
}

const LoginScreen = ({ onLogin }: LoginScreenProps) => {
  const [email, setEmail] = useState("student@toefl.com");
  const [password, setPassword] = useState("password");

  const handleLogin = () => {
    if (!email.trim()) return;
    const name = email.split("@")[0];
    onLogin(name.charAt(0).toUpperCase() + name.slice(1));
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 gradient-navy rounded-xl">
      <div className="gradient-gold text-navy font-display font-bold text-xs px-4 py-1.5 rounded-full tracking-widest uppercase mb-4">
        ETS · TOEFL ITP
      </div>
      <h1 className="text-3xl font-display font-bold text-card mb-1 text-center">
        TOEFL ITP Practice Test
      </h1>
      <p className="text-gold text-xs tracking-wider text-center mb-8 font-sans">
        Official Simulation · 140 Questions
      </p>

      <div className="bg-card/5 border border-gold/30 rounded-xl p-8 w-full max-w-sm">
        <h2 className="text-card font-display text-lg mb-1">Welcome back</h2>
        <p className="text-card/50 text-sm mb-6 font-sans">Sign in to continue your preparation</p>

        <div className="mb-4">
          <label className="block text-card/70 text-xs tracking-wider mb-1.5 font-sans uppercase">
            Email address
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full bg-card/10 border border-gold/30 rounded-lg px-4 py-2.5 text-card text-sm font-sans outline-none focus:border-gold transition-colors placeholder:text-card/30"
          />
        </div>

        <div className="mb-4">
          <label className="block text-card/70 text-xs tracking-wider mb-1.5 font-sans uppercase">
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full bg-card/10 border border-gold/30 rounded-lg px-4 py-2.5 text-card text-sm font-sans outline-none focus:border-gold transition-colors placeholder:text-card/30"
          />
        </div>

        <button
          onClick={handleLogin}
          className="w-full gradient-gold text-navy font-bold font-sans rounded-lg py-3 text-sm hover:opacity-90 transition-opacity mt-2"
        >
          Sign In →
        </button>

        <p className="text-card/35 text-xs text-center mt-4 font-sans">
          Demo: any email + any password · Data stays in your browser
        </p>
      </div>
    </div>
  );
};

export default LoginScreen;
