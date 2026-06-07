import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Eye, EyeOff } from "lucide-react";
import { authApi } from "@/lib/api";

type RegisterStep = "idle" | "success";
type ForgotStep = "request" | "reset";

const LoginScreen = () => {
  const [mode, setMode] = useState<"login" | "register" | "forgot">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [localError, setLocalError] = useState("");
  const [registerStep, setRegisterStep] = useState<RegisterStep>("idle");
  const [registeredName, setRegisteredName] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [forgotStep, setForgotStep] = useState<ForgotStep>("request");
  const [forgotOtp, setForgotOtp] = useState("");
  const [forgotNewPassword, setForgotNewPassword] = useState("");
  const [forgotMockOtp, setForgotMockOtp] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);

  const { login, register, loading, error, clearError } = useAuth();

  const handleForgotPasswordRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError("");
    clearError();
    setForgotLoading(true);

    try {
      const res = await authApi.forgotPassword(email);
      setForgotMockOtp(res.mockOtp || "");
      setForgotStep("reset");
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : "Gagal meminta reset password");
    } finally {
      setForgotLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError("");
    clearError();

    if (!forgotOtp.trim()) {
      setLocalError("Kode OTP tidak boleh kosong");
      return;
    }
    if (forgotNewPassword.length < 6) {
      setLocalError("Password baru minimal 6 karakter");
      return;
    }
    setForgotLoading(true);

    try {
      await authApi.resetPassword(email, forgotOtp, forgotNewPassword);
      setMode("login");
      setForgotStep("request");
      setForgotOtp("");
      setForgotNewPassword("");
      setForgotMockOtp("");
      setEmail("");
      setPassword("");
      setLocalError("Password berhasil diperbarui! Silakan masuk.");
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : "Gagal mereset password");
    } finally {
      setForgotLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError("");
    clearError();

    try {
      if (mode === "register") {
        if (!name.trim()) { setLocalError("Nama tidak boleh kosong"); return; }
        const user = await register(email, name.trim(), password);
        // Show success banner — auth state already set, redirect handled by parent
        setRegisteredName(user.name);
        setRegisterStep("success");
      } else if (mode === "login") {
        await login(email, password);
        // Auth state updated in context → Index.tsx will re-render automatically
      }
    } catch {
      // error already set by hook
    }
  };

  const displayError = localError || error;

  // Register success screen — shown briefly before parent redirects
  if (registerStep === "success") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8 gradient-navy rounded-xl">
        <div className="bg-card/5 border border-gold/30 rounded-xl p-10 w-full max-w-sm text-center animate-fade-in">
          <div className="w-20 h-20 rounded-full bg-green-500/20 border-2 border-green-400/60 flex items-center justify-center mx-auto mb-5 text-4xl">
            🎉
          </div>
          <h2 className="text-card font-display text-xl font-bold mb-2">
            Akun Berhasil Dibuat!
          </h2>
          <p className="text-card/60 text-sm font-sans mb-1">
            Selamat datang, <span className="text-gold font-semibold">{registeredName}</span>!
          </p>
          <p className="text-card/40 text-xs font-sans mb-6">
            Kamu sudah otomatis masuk ke dashboard.
          </p>
          <div className="flex items-center justify-center gap-2 text-green-400/80 text-xs font-sans">
            <span className="inline-block w-3 h-3 border-2 border-green-400/40 border-t-green-400 rounded-full animate-spin" />
            Memuat dashboard...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 gradient-navy rounded-xl">
      {/* Badge */}
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
        {mode === "forgot" ? (
          <div>
            <h2 className="text-card font-display text-lg mb-1">
              {forgotStep === "request" ? "Lupa Password" : "Reset Password"}
            </h2>
            <p className="text-card/50 text-sm mb-6 font-sans">
              {forgotStep === "request"
                ? "Masukkan email terdaftar untuk meminta kode reset."
                : "Masukkan kode OTP dan password baru Anda."}
            </p>

            {forgotStep === "reset" && forgotMockOtp && (
              <div className="bg-blue-500/20 border border-blue-400/40 rounded-lg px-4 py-3 text-blue-300 text-xs font-sans mb-6">
                💡 <strong>Simulasi OTP:</strong> Gunakan kode <span className="text-gold font-bold tracking-wider">{forgotMockOtp}</span> untuk mereset password email <strong>{email}</strong>.
              </div>
            )}

            <form onSubmit={forgotStep === "request" ? handleForgotPasswordRequest : handleResetPassword} className="flex flex-col gap-4">
              {forgotStep === "request" ? (
                <div>
                  <label className="block text-card/70 text-xs tracking-wider mb-1.5 font-sans uppercase">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="kamu@example.com"
                    required
                    className="w-full bg-card/10 border border-gold/30 rounded-lg px-4 py-2.5 text-card text-sm font-sans outline-none focus:border-gold transition-colors placeholder:text-card/30"
                  />
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-card/70 text-xs tracking-wider mb-1.5 font-sans uppercase">
                      Kode OTP (6 Digit)
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      value={forgotOtp}
                      onChange={(e) => setForgotOtp(e.target.value)}
                      placeholder="123456"
                      required
                      className="w-full bg-card/10 border border-gold/30 rounded-lg px-4 py-2.5 text-card text-sm font-sans outline-none focus:border-gold transition-colors placeholder:text-card/30"
                    />
                  </div>
                  <div>
                    <label className="block text-card/70 text-xs tracking-wider mb-1.5 font-sans uppercase">
                      Password Baru
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={forgotNewPassword}
                        onChange={(e) => setForgotNewPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        minLength={6}
                        className="w-full bg-card/10 border border-gold/30 rounded-lg pl-4 pr-10 py-2.5 text-card text-sm font-sans outline-none focus:border-gold transition-colors placeholder:text-card/30"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-card/50 hover:text-card/80 transition-colors focus:outline-none"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </>
              )}

              {/* Error */}
              {displayError && (
                <div className="bg-red-500/20 border border-red-400/40 rounded-lg px-4 py-2.5 text-red-300 text-sm font-sans animate-fade-in">
                  ⚠️ {displayError}
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={forgotLoading}
                className="w-full gradient-gold text-navy font-bold font-sans rounded-lg py-3 text-sm hover:opacity-90 transition-opacity mt-1 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {forgotLoading ? (
                  <>
                    <span className="inline-block w-4 h-4 border-2 border-navy/40 border-t-navy rounded-full animate-spin" />
                    Memproses...
                  </>
                ) : (
                  forgotStep === "request" ? "Kirim Kode OTP →" : "Perbarui Password →"
                )}
              </button>
            </form>

            <div className="text-center mt-4">
              <button
                type="button"
                onClick={() => {
                  setMode("login");
                  setForgotStep("request");
                  setLocalError("");
                  clearError();
                  setShowPassword(false);
                }}
                className="text-gold/80 hover:text-gold text-xs font-sans transition-colors"
              >
                ← Kembali ke Masuk
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Mode toggle */}
            <div className="flex bg-card/10 rounded-lg p-1 mb-6">
              <button
                type="button"
                onClick={() => { setMode("login"); clearError(); setLocalError(""); setShowPassword(false); }}
                className={`flex-1 py-2 text-sm font-semibold font-sans rounded-md transition-all duration-200 ${mode === "login"
                    ? "bg-gold text-navy shadow-sm"
                    : "text-card/60 hover:text-card/80"
                  }`}
              >
                Masuk
              </button>
              <button
                type="button"
                onClick={() => { setMode("register"); clearError(); setLocalError(""); setShowPassword(false); }}
                className={`flex-1 py-2 text-sm font-semibold font-sans rounded-md transition-all duration-200 ${mode === "register"
                    ? "bg-gold text-navy shadow-sm"
                    : "text-card/60 hover:text-card/80"
                  }`}
              >
                Daftar
              </button>
            </div>

            <h2 className="text-card font-display text-lg mb-1">
              {mode === "login" ? "Selamat datang kembali" : "Buat akun baru"}
            </h2>
            <p className="text-card/50 text-sm mb-6 font-sans">
              {mode === "login"
                ? "Masuk untuk melanjutkan latihan"
                : "Daftar dan mulai persiapan TOEFL"}
            </p>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {/* Name (register only) */}
              {mode === "register" && (
                <div>
                  <label className="block text-card/70 text-xs tracking-wider mb-1.5 font-sans uppercase">
                    Nama lengkap
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="John Doe"
                    required
                    className="w-full bg-card/10 border border-gold/30 rounded-lg px-4 py-2.5 text-card text-sm font-sans outline-none focus:border-gold transition-colors placeholder:text-card/30"
                  />
                </div>
              )}

              {/* Email */}
              <div>
                <label className="block text-card/70 text-xs tracking-wider mb-1.5 font-sans uppercase">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="kamu@example.com"
                  required
                  className="w-full bg-card/10 border border-gold/30 rounded-lg px-4 py-2.5 text-card text-sm font-sans outline-none focus:border-gold transition-colors placeholder:text-card/30"
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-card/70 text-xs tracking-wider mb-1.5 font-sans uppercase">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    minLength={6}
                    className="w-full bg-card/10 border border-gold/30 rounded-lg pl-4 pr-10 py-2.5 text-card text-sm font-sans outline-none focus:border-gold transition-colors placeholder:text-card/30"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-card/50 hover:text-card/80 transition-colors focus:outline-none"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {mode === "register" && (
                  <p className="text-card/40 text-xs mt-1 font-sans">Minimal 6 karakter</p>
                )}
                {mode === "login" && (
                  <div className="text-right mt-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setMode("forgot");
                        setForgotStep("request");
                        setLocalError("");
                        clearError();
                        setShowPassword(false);
                      }}
                      className="text-gold/80 hover:text-gold text-xs font-sans transition-colors"
                    >
                      Lupa password?
                    </button>
                  </div>
                )}
              </div>

              {/* Error */}
              {displayError && (
                <div className="bg-red-500/20 border border-red-400/40 rounded-lg px-4 py-2.5 text-red-300 text-sm font-sans animate-fade-in">
                  ⚠️ {displayError}
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full gradient-gold text-navy font-bold font-sans rounded-lg py-3 text-sm hover:opacity-90 transition-opacity mt-1 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <span className="inline-block w-4 h-4 border-2 border-navy/40 border-t-navy rounded-full animate-spin" />
                    {mode === "login" ? "Masuk..." : "Mendaftar..."}
                  </>
                ) : (
                  mode === "login" ? "Masuk →" : "Buat Akun →"
                )}
              </button>
            </form>
          </>
        )}

        <p className="text-card/30 text-xs text-center mt-4 font-sans">
        </p>
      </div>
    </div>
  );
};

export default LoginScreen;
