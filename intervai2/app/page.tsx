"use client";

import { useEffect, useRef, useState } from "react";
import { useAuthListener, useTheme, signOut } from "@/lib/auth";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Mic, Play, BarChart3, Lock, Activity, Sun, Moon, Menu, X, ArrowRight, Sparkles } from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, loading } = useAuthListener();
  const { isDark, toggleTheme } = useTheme();
  const router = useRouter();

  const handleStartInterview = () => {
    if (!user) {
      router.push("/signup");
    } else {
      router.push("/interview");
    }
  };

  const handleGetStarted = () => {
    if (!user) {
      router.push("/signup");
    } else {
      router.push("/dashboard");
    }
  };

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  // Refs for GSAP targets
  const navRef = useRef<HTMLElement>(null);
  const badgeRef = useRef<HTMLDivElement>(null);
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const subRef = useRef<HTMLParagraphElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const avatarRef = useRef<HTMLDivElement>(null);
  const heroCardRef = useRef<HTMLDivElement>(null);
  const robotRef = useRef<HTMLDivElement>(null);
  const howTitleRef = useRef<HTMLDivElement>(null);
  const card1Ref = useRef<HTMLDivElement>(null);
  const card2Ref = useRef<HTMLDivElement>(null);
  const card3Ref = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const orb1Ref = useRef<HTMLDivElement>(null);
  const orb2Ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // ── Navbar slide in
      gsap.fromTo(
        navRef.current,
        { y: -80, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.9, ease: "power3.out" }
      );

      // ── Hero badge pop
      gsap.fromTo(
        badgeRef.current,
        { scale: 0.6, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.6, delay: 0.4, ease: "back.out(1.7)" }
      );

      // ── Headline stagger letters via SplitText fallback (word by word)
      gsap.fromTo(
        headlineRef.current,
        { y: 60, opacity: 0, skewY: 4 },
        { y: 0, opacity: 1, skewY: 0, duration: 0.9, delay: 0.6, ease: "power4.out" }
      );

      gsap.fromTo(
        subRef.current,
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.7, delay: 0.9, ease: "power3.out" }
      );

      gsap.fromTo(
        ctaRef.current,
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6, delay: 1.1, ease: "power3.out" }
      );

      gsap.fromTo(
        avatarRef.current,
        { x: -20, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.6, delay: 1.3, ease: "power3.out" }
      );

      // ── Hero card slide in from right
      gsap.fromTo(
        heroCardRef.current,
        { x: 100, opacity: 0, rotateY: 15 },
        { x: 0, opacity: 1, rotateY: 0, duration: 1, delay: 0.7, ease: "power3.out" }
      );

      // ── Robot floating animation
      gsap.to(robotRef.current, {
        y: -18,
        duration: 2.8,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
      });

      // ── Glow pulse
      gsap.to(glowRef.current, {
        scale: 1.3,
        opacity: 0.6,
        duration: 2.5,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
      });

      // ── Ambient orbs
      gsap.to(orb1Ref.current, {
        x: 40,
        y: 30,
        duration: 6,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
      });
      gsap.to(orb2Ref.current, {
        x: -30,
        y: -25,
        duration: 8,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
      });

      // ── How It Works section - scroll triggered
      gsap.fromTo(
        howTitleRef.current,
        { y: 50, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          scrollTrigger: {
            trigger: howTitleRef.current,
            start: "top 80%",
          },
        }
      );

      const cards = [card1Ref.current, card2Ref.current, card3Ref.current];
      cards.forEach((card, i) => {
        gsap.fromTo(
          card,
          { y: 60, opacity: 0, scale: 0.95 },
          {
            y: 0,
            opacity: 1,
            scale: 1,
            duration: 0.7,
            delay: i * 0.15,
            ease: "power3.out",
            scrollTrigger: {
              trigger: card,
              start: "top 85%",
            },
          }
        );
      });
    });

    return () => ctx.revert();
  }, []);

  // Theme classes
  const t = {
    bg: isDark ? "bg-[#080d1a]" : "bg-[#f0f4ff]",
    navBg: isDark
      ? "bg-white/5 border-white/10 backdrop-blur-xl"
      : "bg-white/80 border-gray-200/80 backdrop-blur-xl",
    text: isDark ? "text-white" : "text-gray-900",
    subtext: isDark ? "text-gray-400" : "text-gray-500",
    cardBg: isDark
      ? "bg-white/5 border-white/10"
      : "bg-white border-gray-200 shadow-lg",
    sectionBg: isDark ? "bg-[#0c1225]" : "bg-white/60",
    footerBg: isDark ? "border-white/10" : "border-gray-200",
    btnOutline: isDark
      ? "border-white/20 hover:border-white/50 text-white"
      : "border-gray-300 hover:border-gray-500 text-gray-900",
    loginBtn: isDark ? "text-gray-300 hover:text-white" : "text-gray-600 hover:text-gray-900",
    navLink: isDark ? "text-gray-300 hover:text-white" : "text-gray-600 hover:text-gray-900",
    recBg: isDark ? "bg-red-500/10 text-red-400" : "bg-red-50 text-red-500",
    mockPacingText: isDark ? "text-gray-400" : "text-gray-500",
    mockBg: isDark ? "bg-[#0e1628]" : "bg-white",
    robotBorder: isDark ? "border-blue-500/60" : "border-blue-400",
    robotGlow: isDark ? "bg-blue-600/20" : "bg-blue-100",
  };

  return (
    <div className={`min-h-screen ${t.bg} ${t.text} overflow-x-hidden relative transition-colors duration-500`}>
      {/* ──── Ambient Background Orbs ──── */}
      <div ref={orb1Ref} className="fixed top-0 left-[10%] w-[600px] h-[600px] rounded-full bg-blue-700/20 blur-[140px] pointer-events-none z-0" />
      <div ref={orb2Ref} className="fixed bottom-0 right-[5%] w-[500px] h-[500px] rounded-full bg-indigo-700/15 blur-[120px] pointer-events-none z-0" />

      {/* ──────────────── NAVBAR ──────────────── */}
      <nav
        ref={navRef}
        className={`fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-10 py-4 mx-auto border-b ${t.navBg}`}
      >
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="relative">
            <div className="absolute inset-0 bg-blue-500/30 blur-md rounded-full group-hover:bg-blue-500/50 transition-all duration-300" />
            <Image src="/logo.svg" alt="Intervai Logo" width={28} height={28} className="relative z-10" />
          </div>
          <span className={`text-lg font-bold tracking-tight ${t.text}`}>
            Interv<span className="text-blue-500">ai</span>
          </span>
        </Link>

        {/* Nav Links */}
        <div className={`hidden md:flex items-center gap-8 text-sm font-medium ${t.navLink}`}>
          {["Features", "Pricing", "About"].map((item) => (
            <Link
              key={item}
              href="#"
              className="relative group py-1"
            >
              {item}
              <span className="absolute bottom-0 left-0 w-0 h-[1.5px] bg-blue-500 group-hover:w-full transition-all duration-300 rounded-full" />
            </Link>
          ))}
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-3">
          {/* Theme Toggle */}
          <button
            onClick={() => toggleTheme()}
            className={`w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300 ${isDark
              ? "bg-white/10 hover:bg-white/20 text-yellow-300"
              : "bg-gray-100 hover:bg-gray-200 text-gray-700"
              }`}
            aria-label="Toggle theme"
          >
            {isDark ? <Sun size={16} /> : <Moon size={16} />}
          </button>

          {/* Auth buttons — hidden while Firebase resolves auth state */}
          {!loading && (
            <>
              {user ? (
                /* ── Authenticated: user avatar + logout ── */
                <div className="hidden md:flex items-center gap-2">
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={user.displayName ?? ""}
                      className="w-7 h-7 rounded-full ring-2 ring-blue-500/40 object-cover"
                    />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-[10px] font-bold text-white ring-2 ring-blue-500/40">
                      {(user.displayName?.[0] ?? user.email?.[0] ?? "U").toUpperCase()}
                    </div>
                  )}
                  <button
                    onClick={handleSignOut}
                    className={`text-sm font-medium transition ${t.loginBtn}`}
                  >
                    Logout
                  </button>
                </div>
              ) : (
                /* ── Unauthenticated: login link ── */
                <Link
                  href="/login"
                  className={`hidden md:block text-sm font-medium transition ${t.loginBtn}`}
                >
                  Login
                </Link>
              )}

              <button
                onClick={handleGetStarted}
                className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 shadow-lg shadow-blue-600/30 hover:shadow-blue-500/40 hover:scale-[1.03] flex items-center gap-1.5"
              >
                {user ? "Dashboard" : "Get Started"}
                <ArrowRight size={14} />
              </button>
            </>
          )}

          {/* Mobile menu toggle */}
          <button
            className={`md:hidden ml-1 p-2 rounded-lg ${isDark ? "text-white" : "text-gray-900"}`}
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className={`fixed top-[65px] left-0 right-0 z-40 ${isDark ? "bg-[#080d1a]/95" : "bg-white/95"} backdrop-blur-xl border-b ${t.footerBg} px-6 py-4 flex flex-col gap-4 transition-all duration-300`}>
          {["Features", "Pricing", "About"].map((item) => (
            <Link key={item} href="#" className={`text-sm font-medium ${t.navLink}`} onClick={() => setMenuOpen(false)}>
              {item}
            </Link>
          ))}
          {!loading && (
            user ? (
              <button
                onClick={() => { setMenuOpen(false); handleSignOut(); }}
                className={`text-sm font-medium text-left ${t.loginBtn}`}
              >
                Logout
              </button>
            ) : (
              <Link href="/login" className={`text-sm font-medium ${t.loginBtn}`} onClick={() => setMenuOpen(false)}>
                Login
              </Link>
            )
          )}
        </div>
      )}

      {/* ──────────────── HERO SECTION ──────────────── */}
      <section className="relative max-w-7xl mx-auto px-6 md:px-8 pt-36 pb-28 grid md:grid-cols-2 gap-12 items-center z-10">
        {/* Left Content */}
        <div>
          {/* Badge */}
          <div
            ref={badgeRef}
            className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold mb-8 border ${isDark
              ? "bg-blue-500/10 border-blue-500/20 text-blue-400"
              : "bg-blue-50 border-blue-200 text-blue-600"
              }`}
          >
            <Sparkles size={12} />
            New: Real-time Tone Analysis 2.0
          </div>

          {/* Headline */}
          <h1
            ref={headlineRef}
            className={`text-5xl md:text-6xl font-extrabold leading-[1.1] mb-6 tracking-tight ${t.text}`}
          >
            Crack Your Next<br />
            Interview With{" "}
            <span className="relative inline-block">
              <span className="bg-gradient-to-r from-blue-400 via-blue-500 to-indigo-500 bg-clip-text text-transparent">
                AI Coaching
              </span>
              <span className="absolute -bottom-1 left-0 right-0 h-[3px] bg-gradient-to-r from-blue-400 to-indigo-500 rounded-full opacity-60" />
            </span>
          </h1>

          {/* Sub */}
          <p ref={subRef} className={`${t.subtext} mb-10 max-w-md text-base leading-relaxed`}>
            Master your pitch with real-time feedback. Our AI coach analyzes
            your tone, content, and confidence to get you hired faster.
          </p>

          {/* CTA Buttons */}
          <div ref={ctaRef} className="flex flex-wrap gap-4">
            <button
              onClick={handleStartInterview}
              className="group bg-blue-600 hover:bg-blue-500 text-white px-7 py-3.5 rounded-xl flex items-center gap-2.5 text-sm font-semibold transition-all duration-200 shadow-xl shadow-blue-600/40 hover:shadow-blue-500/50 hover:scale-[1.03]"
            >
              <Mic size={17} className="group-hover:animate-pulse" />
              Start Mock Interview
            </button>
            <button
              className={`border ${t.btnOutline} px-7 py-3.5 rounded-xl flex items-center gap-2.5 text-sm font-medium transition-all duration-200 hover:scale-[1.03] backdrop-blur-sm`}
            >
              <Play size={17} />
              Watch Demo
            </button>
          </div>

          {/* Social proof */}
          <div ref={avatarRef} className="flex items-center gap-3 mt-10">
            <div className="flex -space-x-2.5">
              {[1, 2, 3].map((i) => (
                <img
                  key={i}
                  src={`https://i.pravatar.cc/40?img=${i}`}
                  className="w-9 h-9 rounded-full border-2 border-blue-500/30 ring-1 ring-white/10"
                  alt={`user-${i}`}
                />
              ))}
            </div>
            <div>
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className="text-yellow-400 text-xs">★</span>
                ))}
              </div>
              <p className={`${t.subtext} text-xs mt-0.5`}>
                <span className="font-semibold text-blue-500">7k+</span> hired by top tech companies
              </p>
            </div>
          </div>
        </div>

        {/* Right: Hero Card with Robot */}
        <div className="relative flex justify-center items-center">
          {/* Glow */}
          <div
            ref={glowRef}
            className="absolute w-80 h-80 bg-blue-600/25 blur-[100px] rounded-full pointer-events-none"
          />

          {/* Floating Card */}
          <div
            ref={heroCardRef}
            className={`relative ${t.mockBg} border ${isDark ? "border-white/10" : "border-gray-200"} rounded-3xl p-7 w-[340px] shadow-2xl ${isDark ? "shadow-blue-900/40" : "shadow-blue-100/80"} backdrop-blur-xl`}
            style={{ perspective: 800 }}
          >
            {/* Card header */}
            <div className="flex justify-between items-center mb-5">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <div className="w-3 h-3 rounded-full bg-yellow-400" />
                <div className="w-3 h-3 rounded-full bg-green-400" />
              </div>
              <div className={`text-xs font-bold ${t.recBg} px-3 py-1 rounded-full flex items-center gap-1`}>
                <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                REC
              </div>
            </div>

            <div className={`text-xs font-semibold ${isDark ? "text-blue-400" : "text-blue-600"} mb-5 flex items-center gap-2`}>
              <div className={`w-2 h-2 rounded-full bg-green-400 animate-pulse`} />
              Good Pacing · 60 min session
            </div>

            {/* Robot SVG */}
            <div
              ref={robotRef}
              className="flex justify-center mb-5"
            >
              <div className={`relative w-28 h-28 rounded-2xl ${t.robotGlow} flex items-center justify-center border ${t.robotBorder} overflow-hidden shadow-lg`}>
                <div className="absolute inset-0 bg-gradient-to-b from-blue-500/10 to-transparent" />
                <Image
                  src="/herorobot.png"
                  alt="AI Robot"
                  width={80}
                  height={80}
                  className="relative z-10 drop-shadow-lg"
                />
              </div>
            </div>

            {/* Audio waveform bars */}
            <div className="flex items-end justify-center gap-1 h-8 mb-5">
              {[3, 6, 10, 8, 14, 10, 7, 12, 9, 5, 3, 8, 11, 6, 4].map((h, i) => (
                <div
                  key={i}
                  className="w-1.5 rounded-full bg-gradient-to-t from-blue-600 to-blue-400 opacity-80 animate-pulse"
                  style={{
                    height: `${h * 2}px`,
                    animationDelay: `${i * 0.1}s`,
                    animationDuration: `${0.8 + (i % 3) * 0.3}s`,
                  }}
                />
              ))}
            </div>

            <p className={`text-sm ${t.mockPacingText} text-center mb-4 italic`}>
              "Tell me about a challenge you faced..."
            </p>

            {/* Score bar */}
            <div className={`text-xs ${t.subtext} text-center mb-2`}>
              AI Interviewer · Confidence Score
            </div>
            <div className={`w-full ${isDark ? "bg-white/10" : "bg-gray-100"} rounded-full h-1.5`}>
              <div
                className="h-1.5 rounded-full bg-gradient-to-r from-blue-500 to-green-400"
                style={{ width: "92%" }}
              />
            </div>
            <div className="text-right text-xs text-green-400 font-semibold mt-1">92%</div>
          </div>

          {/* Floating badge top-right */}
          <div className={`absolute -top-4 -right-4 ${isDark ? "bg-indigo-600/90" : "bg-indigo-600"} text-white text-xs font-semibold px-3 py-1.5 rounded-full shadow-lg backdrop-blur-sm flex items-center gap-1.5 animate-bounce`}
            style={{ animationDuration: "3s" }}>
            <Sparkles size={11} />
            AI-Powered
          </div>
        </div>
      </section>

      {/* ──────────────── HOW IT WORKS ──────────────── */}
      <section className={`${t.sectionBg} py-24 relative z-10`}>
        <div className="max-w-6xl mx-auto px-6 md:px-8">
          <div ref={howTitleRef} className="text-center mb-16">
            <p className={`text-xs font-bold uppercase tracking-widest text-blue-500 mb-3`}>
              Simple 3-Step Process
            </p>
            <h2 className={`text-4xl md:text-5xl font-extrabold ${t.text} mb-4`}>
              How <span className="bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent">Intervai</span> Works
            </h2>
            <p className={`${t.subtext} max-w-md mx-auto`}>
              Three simple steps to go from nervous to hired.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                ref: card1Ref,
                icon: Lock,
                color: "text-blue-500",
                glow: "bg-blue-500/10",
                border: "group-hover:border-blue-500/60",
                num: "01",
                title: "Select Role",
                desc: "Choose from 50+ job profiles including Software Engineer, Product Manager, and Sales to simulate real scenarios.",
              },
              {
                ref: card2Ref,
                icon: Activity,
                color: "text-purple-500",
                glow: "bg-purple-500/10",
                border: "group-hover:border-purple-500/60",
                num: "02",
                title: "Voice Interaction",
                desc: "Speak naturally to our advanced AI Interviewer. It adapts to your answers just like a real hiring manager.",
              },
              {
                ref: card3Ref,
                icon: BarChart3,
                color: "text-pink-500",
                glow: "bg-pink-500/10",
                border: "group-hover:border-pink-500/60",
                num: "03",
                title: "Instant Analysis",
                desc: "Get detailed scoring on your tone, pacing, keywords, and confidence immediately after the session.",
              },
            ].map(({ ref, icon: Icon, color, glow, border, num, title, desc }) => (
              <div
                key={num}
                ref={ref}
                className={`group relative ${t.cardBg} border rounded-2xl p-8 transition-all duration-300 hover:scale-[1.03] hover:-translate-y-1 cursor-default overflow-hidden ${border}`}
              >
                {/* Card number watermark */}
                <div className={`absolute top-4 right-5 text-6xl font-black opacity-[0.04] ${t.text} select-none`}>
                  {num}
                </div>

                {/* Icon */}
                <div className={`w-12 h-12 rounded-xl ${glow} flex items-center justify-center mb-6 border ${isDark ? "border-white/10" : "border-gray-200"} transition-all duration-300 group-hover:scale-110`}>
                  <Icon className={color} size={22} />
                </div>

                <h3 className={`font-bold text-lg mb-3 ${t.text}`}>{num}. {title}</h3>
                <p className={`text-sm ${t.subtext} leading-relaxed`}>{desc}</p>

                {/* Bottom accent line */}
                <div className={`absolute bottom-0 left-0 h-[2px] bg-gradient-to-r ${num === "01" ? "from-blue-500" : num === "02" ? "from-purple-500" : "from-pink-500"
                  } to-transparent w-0 group-hover:w-full transition-all duration-500 rounded-full`} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ──────────────── FOOTER ──────────────── */}
      <footer className={`relative z-10 border-t ${t.footerBg} py-8 px-6 md:px-8`}>
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Image src="/logo.svg" alt="Intervai" width={20} height={20} />
            <span className={`text-sm ${t.subtext}`}>
              © 2024 Intervai Inc. All rights reserved.
            </span>
          </div>
          <div className="flex items-center gap-5">
            <a
              href="https://twitter.com"
              target="_blank"
              rel="noopener noreferrer"
              className={`${t.subtext} hover:text-blue-400 transition`}
              aria-label="Twitter"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.74l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </a>
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className={`${t.subtext} hover:text-white transition`}
              aria-label="GitHub"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.373 0 0 5.373 0 12c0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 21.795 24 17.298 24 12c0-6.627-5.373-12-12-12z" />
              </svg>
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}