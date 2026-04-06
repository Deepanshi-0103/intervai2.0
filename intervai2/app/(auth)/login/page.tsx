"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Eye, EyeOff, Lock, Mail, Sun, Moon, ArrowRight } from "lucide-react";
import gsap from "gsap";
import { signInWithEmail, signInWithGoogle, useTheme } from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const { isDark, toggleTheme } = useTheme();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");

  const cardRef = useRef<HTMLDivElement>(null);
  const logoRef = useRef<HTMLDivElement>(null);
  const orb1Ref = useRef<HTMLDivElement>(null);
  const orb2Ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        cardRef.current,
        { y: 40, opacity: 0, scale: 0.96 },
        { y: 0, opacity: 1, scale: 1, duration: 0.8, ease: "power3.out", delay: 0.1 }
      );
      gsap.fromTo(
        logoRef.current,
        { scale: 0.5, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.6, ease: "back.out(1.7)", delay: 0.4 }
      );
      gsap.to(orb1Ref.current, {
        x: 30, y: 20, duration: 7, repeat: -1, yoyo: true, ease: "sine.inOut",
      });
      gsap.to(orb2Ref.current, {
        x: -25, y: -18, duration: 9, repeat: -1, yoyo: true, ease: "sine.inOut",
      });
    });
    return () => ctx.revert();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    try {
      await signInWithEmail(email, password);
      router.push("/dashboard");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Sign in failed";
      if (msg.includes("invalid-credential") || msg.includes("wrong-password") || msg.includes("user-not-found")) {
        setError("Incorrect email or password. Please try again.");
      } else if (msg.includes("too-many-requests")) {
        setError("Too many attempts. Please wait a moment and try again.");
      } else {
        setError("Sign in failed. Please check your credentials.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError("");
    setGoogleLoading(true);
    try {
      await signInWithGoogle();
      router.push("/dashboard");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "";
      if (!msg.includes("popup-closed-by-user") && !msg.includes("cancelled-popup-request")) {
        setError("Google sign-in failed. Please try again.");
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  const t = {
    pageBg: isDark ? "bg-[#080d1a]" : "bg-gradient-to-br from-slate-100 to-blue-50",
    cardBg: isDark
      ? "bg-gradient-to-b from-[#1a1060]/90 to-[#0d0d2b]/90 border-white/10"
      : "bg-white border-gray-200 shadow-2xl shadow-blue-100",
    text: isDark ? "text-white" : "text-gray-900",
    subtext: isDark ? "text-gray-400" : "text-gray-500",
    inputBg: isDark
      ? "bg-white/5 border-white/10 text-white placeholder-gray-500 focus:border-blue-500/60 focus:bg-white/10"
      : "bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:bg-white",
    inputIcon: isDark ? "text-gray-500" : "text-gray-400",
    divider: isDark ? "border-white/10" : "border-gray-200",
    dividerText: isDark ? "text-gray-500 bg-[#110d35]" : "text-gray-400 bg-white",
    footerLink: isDark ? "text-gray-600 hover:text-gray-400" : "text-gray-400 hover:text-gray-600",
    signupText: isDark ? "text-gray-400" : "text-gray-500",
    googleBtn: isDark
      ? "bg-white/5 border-white/10 text-white hover:bg-white/10"
      : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50",
    forgotText: isDark ? "text-blue-400 hover:text-blue-300" : "text-blue-600 hover:text-blue-500",
    labelText: isDark ? "text-gray-300" : "text-gray-700",
    toggleBtn: isDark
      ? "bg-white/10 hover:bg-white/20 text-yellow-300"
      : "bg-gray-100 hover:bg-gray-200 text-gray-600",
  };

  return (
    <div className={`min-h-screen ${t.pageBg} flex flex-col items-center justify-center p-4 relative overflow-hidden transition-colors duration-500`}>
      {/* Ambient orbs */}
      <div ref={orb1Ref} className="fixed top-[-100px] left-[10%] w-[500px] h-[500px] rounded-full bg-blue-700/20 blur-[130px] pointer-events-none" />
      <div ref={orb2Ref} className="fixed bottom-0 right-[5%] w-[400px] h-[400px] rounded-full bg-indigo-700/20 blur-[110px] pointer-events-none" />
      {isDark && (
        <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] rounded-full bg-purple-900/20 blur-[100px] pointer-events-none" />
      )}

      {/* Theme toggle — top right */}
      <div className="fixed top-5 right-5 z-50 flex items-center gap-3">
        <Link href="/" className={`text-xs font-medium ${t.subtext} hover:text-blue-400 transition`}>← Home</Link>
        <button
          onClick={() => toggleTheme()}
          className={`w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300 ${t.toggleBtn}`}
          aria-label="Toggle theme"
        >
          {isDark ? <Sun size={16} /> : <Moon size={16} />}
        </button>
      </div>

      {/* Card */}
      <div
        ref={cardRef}
        className={`relative w-full max-w-sm border rounded-2xl p-8 backdrop-blur-xl transition-colors duration-500 ${t.cardBg}`}
      >
        {isDark && (
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-purple-600/5 to-transparent pointer-events-none" />
        )}

        {/* Logo + Brand */}
        <div ref={logoRef} className="flex flex-col items-center mb-7">
          <div className="relative mb-3">
            <div className="absolute inset-0 bg-blue-500/25 blur-md rounded-full" />
            <Image src="/logo.svg" alt="Intervai" width={32} height={32} className="relative z-10" />
          </div>
          <span className={`text-sm font-bold tracking-tight ${t.text}`}>
            Interv<span className="text-blue-500">ai</span>
          </span>
          <h1 className={`text-2xl font-bold mt-4 ${t.text}`}>Welcome back</h1>
          <p className={`text-xs text-center mt-1.5 ${t.subtext}`}>
            Enter your details to access your AI Interview coach.
          </p>
        </div>

        {/* Error banner */}
        {error && (
          <div className="mb-4 px-3 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs text-center">
            {error}
          </div>
        )}

        {/* Google SSO */}
        <button
          onClick={handleGoogle}
          disabled={googleLoading || isLoading}
          className={`w-full flex items-center justify-center gap-3 py-2.5 rounded-xl border text-sm font-semibold transition-all duration-200 hover:scale-[1.02] disabled:opacity-60 disabled:cursor-not-allowed ${t.googleBtn}`}
        >
          {googleLoading ? (
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
          )}
          {googleLoading ? "Signing in..." : "Sign in with Google"}
        </button>

        {/* Divider */}
        <div className="flex items-center gap-3 my-5">
          <div className={`flex-1 border-t ${t.divider}`} />
          <span className={`text-xs px-1 ${t.dividerText}`}>or</span>
          <div className={`flex-1 border-t ${t.divider}`} />
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email */}
          <div>
            <label className={`block text-xs font-semibold mb-1.5 ${t.labelText}`}>
              Email address
            </label>
            <div className="relative">
              <Mail size={15} className={`absolute left-3 top-1/2 -translate-y-1/2 ${t.inputIcon}`} />
              <input
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className={`w-full pl-9 pr-3 py-2.5 rounded-xl border text-sm outline-none transition-all duration-200 ${t.inputBg}`}
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className={`text-xs font-semibold ${t.labelText}`}>Password</label>
              <Link href="#" className={`text-xs font-medium ${t.forgotText} transition`}>
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <Lock size={15} className={`absolute left-3 top-1/2 -translate-y-1/2 ${t.inputIcon}`} />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className={`w-full pl-9 pr-10 py-2.5 rounded-xl border text-sm outline-none transition-all duration-200 ${t.inputBg}`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className={`absolute right-3 top-1/2 -translate-y-1/2 ${t.inputIcon} hover:text-blue-400 transition`}
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isLoading || googleLoading}
            className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-70 text-white py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all duration-200 shadow-lg shadow-blue-600/30 hover:shadow-blue-500/40 hover:scale-[1.02] mt-1"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Signing in...
              </>
            ) : (
              <>Sign in <ArrowRight size={15} /></>
            )}
          </button>
        </form>

        {/* Sign up link */}
        <p className={`text-xs text-center mt-5 ${t.signupText}`}>
          Don't have an account?{" "}
          <Link href="/signup" className="text-blue-500 hover:text-blue-400 font-semibold transition">
            Sign up
          </Link>
        </p>
      </div>

      {/* Footer */}
      <div className={`flex items-center gap-5 mt-7 text-xs ${t.footerLink} transition-colors duration-300`}>
        <Link href="#" className="hover:text-blue-400 transition">Privacy Policy</Link>
        <Link href="#" className="hover:text-blue-400 transition">Terms of Service</Link>
        <Link href="#" className="hover:text-blue-400 transition">Help</Link>
      </div>
    </div>
  );
}
