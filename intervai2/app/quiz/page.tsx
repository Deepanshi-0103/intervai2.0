"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthListener, useTheme } from "@/lib/auth";
import { quizzes } from "@/lib/quizData";
import type { Level } from "@/lib/quizData";
import {
  BookOpen, ChevronRight, Zap, Shield, Flame,
  LayoutDashboard, Mic, BarChart2, FileText, LogOut, MoreHorizontal, Sun, Moon,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { signOut } from "@/lib/auth";

// ── Level config ──────────────────────────────────────────────────────────────
const LEVELS: { id: Level; label: string; icon: React.ReactNode; color: string; ring: string }[] = [
  { id: "easy",   label: "Easy",   icon: <Zap size={11} />,    color: "text-emerald-400", ring: "bg-emerald-500/10 border-emerald-500/30 hover:bg-emerald-500/20" },
  { id: "medium", label: "Medium", icon: <Shield size={11} />, color: "text-amber-400",   ring: "bg-amber-500/10   border-amber-500/30   hover:bg-amber-500/20"   },
  { id: "hard",   label: "Hard",   icon: <Flame size={11} />,  color: "text-red-400",     ring: "bg-red-500/10    border-red-500/30     hover:bg-red-500/20"     },
];

// ── Sidebar nav (mirrors dashboard layout) ────────────────────────────────────
const navItems = [
  { label: "Dashboard",     icon: LayoutDashboard, href: "/dashboard" },
  { label: "Interviews",    icon: Mic,             href: "/dashboard/interviews" },
  { label: "Quizzes",       icon: BookOpen,        href: "/quiz" },
  { label: "Analytics",     icon: BarChart2,       href: "/dashboard/analytics" },
  { label: "Streaks",       icon: Flame,           href: "/dashboard/streaks" },
  { label: "Resume Review", icon: FileText,        href: "#" },
];

export default function QuizPage() {
  const router = useRouter();
  const { user, loading } = useAuthListener();
  const { isDark, toggleTheme } = useTheme();
  const [selectedLevels, setSelectedLevels] = useState<Record<string, Level>>({});
  const [showUserMenu, setShowUserMenu] = useState(false);

  if (loading || !user) return null;

  const initials = user.displayName
    ? user.displayName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : user.email?.[0].toUpperCase() ?? "U";

  const handleSignOut = async () => { await signOut(); router.push("/"); };

  const getLevel = (id: string): Level => selectedLevels[id] ?? "easy";
  const setLevel  = (id: string, level: Level) =>
    setSelectedLevels((prev) => ({ ...prev, [id]: level }));

  // ── Theme tokens ────────────────────────────────────────────────────────────
  const t = {
    pageBg:      isDark ? "bg-[#0f1629]" : "bg-[#f0f4ff]",
    sidebar:     isDark ? "bg-[#0a0f1e] border-white/5" : "bg-white border-gray-200",
    logoText:    isDark ? "text-white" : "text-gray-900",
    activeNav:   isDark ? "bg-blue-600/20 text-blue-400 border-blue-500/20" : "bg-blue-600/10 text-blue-600 border-blue-600/20",
    inactiveNav: isDark ? "text-gray-400 hover:text-white hover:bg-white/5" : "text-gray-500 hover:text-gray-900 hover:bg-gray-100",
    userBorder:  isDark ? "border-white/5" : "border-gray-200",
    userName:    isDark ? "text-white" : "text-gray-900",
    userRole:    isDark ? "text-purple-400" : "text-purple-600",
    userHover:   isDark ? "hover:bg-white/5" : "hover:bg-gray-50",
    moreIcon:    isDark ? "text-gray-500 group-hover:text-gray-300" : "text-gray-400 group-hover:text-gray-700",
    dropdownBg:  isDark ? "bg-[#1a2035] border-white/10" : "bg-white border-gray-200",
    toggleBtn:   isDark ? "bg-white/10 hover:bg-white/20 text-yellow-300" : "bg-gray-100 hover:bg-gray-200 text-gray-600",
    heading:     isDark ? "text-white" : "text-gray-900",
    sub:         isDark ? "text-gray-400" : "text-gray-500",
    card:        isDark ? "bg-[#141b2d] border-white/5 hover:border-blue-500/30" : "bg-white border-gray-200 hover:border-blue-400/40 shadow-sm",
  };

  return (
    <div className={`min-h-screen ${t.pageBg} flex transition-colors duration-300`}>

      {/* ── SIDEBAR ──────────────────────────────────────────────────────── */}
      <aside className={`fixed top-0 left-0 h-full w-[168px] ${t.sidebar} border-r flex flex-col z-30 transition-colors duration-300`}>

        {/* Logo + theme toggle */}
        <div className={`px-4 py-4 border-b ${t.userBorder} flex items-center justify-between`}>
          <Link href="/" className="flex items-center gap-2 group">
            <div className="relative">
              <div className="absolute inset-0 bg-blue-500/30 blur-md rounded-full" />
              <Image src="/logo.svg" alt="Intervai" width={20} height={20} className="relative z-10" />
            </div>
            <span className={`text-sm font-bold tracking-tight ${t.logoText}`}>
              Interv<span className="text-blue-500">ai</span>
            </span>
          </Link>
          <button
            onClick={toggleTheme}
            className={`w-7 h-7 rounded-full flex items-center justify-center transition-all duration-300 ${t.toggleBtn}`}
            aria-label="Toggle theme"
          >
            {isDark ? <Sun size={13} /> : <Moon size={13} />}
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map(({ label, icon: Icon, href }) => {
            const active = href === "/quiz" ? true : false; // we are on quiz
            return (
              <Link
                key={label}
                href={href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${active ? t.activeNav : t.inactiveNav} border border-transparent`}
              >
                <Icon size={16} />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* User section */}
        <div className={`px-3 py-4 border-t ${t.userBorder} relative`}>
          <button
            className={`w-full flex items-center gap-2.5 p-2 rounded-xl transition-all duration-200 group ${t.userHover}`}
            onClick={() => setShowUserMenu(!showUserMenu)}
          >
            {user.photoURL ? (
              <img src={user.photoURL} alt={user.displayName ?? "User"} className="w-8 h-8 rounded-full ring-2 ring-blue-500/30 object-cover flex-shrink-0" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-xs font-bold flex-shrink-0 ring-2 ring-blue-500/30 text-white">
                {initials}
              </div>
            )}
            <div className="flex-1 text-left overflow-hidden">
              <p className={`text-xs font-semibold truncate ${t.userName}`}>{user.displayName ?? user.email}</p>
              <p className={`text-[10px] font-medium ${t.userRole}`}>Pro Member</p>
            </div>
            <MoreHorizontal size={15} className={`${t.moreIcon} transition flex-shrink-0`} />
          </button>

          {showUserMenu && (
            <div className={`absolute bottom-full left-3 right-3 mb-2 ${t.dropdownBg} border rounded-xl p-1 shadow-xl z-50`}>
              <button
                onClick={handleSignOut}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
              >
                <LogOut size={14} />
                Sign out
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* ── MAIN CONTENT ─────────────────────────────────────────────────── */}
      <main className="ml-[168px] flex-1 min-h-screen overflow-y-auto">
        <div className="p-6 md:p-10 space-y-8">

          {/* Header */}
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 rounded-xl bg-blue-500/15 border border-blue-500/20 flex items-center justify-center">
                <BookOpen size={20} className="text-blue-400" />
              </div>
              <div>
                <h1 className={`text-2xl md:text-3xl font-bold ${t.heading} leading-tight`}>Knowledge Quizzes</h1>
                <p className={`${t.sub} text-sm mt-0.5`}>9 domains · 3 difficulty levels · 5 questions each</p>
              </div>
            </div>
          </div>

          {/* Level legend */}
          <div className="flex items-center gap-3 flex-wrap">
            {LEVELS.map(({ id, label, icon, color, ring }) => (
              <span key={id} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold ${ring} ${color} transition-colors cursor-default`}>
                {icon}{label}
              </span>
            ))}
            <span className={`text-xs ${t.sub} ml-1`}>— select a level on each card before starting</span>
          </div>

          {/* 3-column grid of quiz cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {quizzes.map((quiz) => {
              const currentLevel = getLevel(quiz.id);
              const levelCfg = LEVELS.find((l) => l.id === currentLevel)!;
              return (
                <div
                  key={quiz.id}
                  className={`${t.card} border rounded-2xl p-5 flex flex-col gap-4 transition-all duration-200 group`}
                >
                  {/* Card header */}
                  <div className="flex items-start justify-between">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${quiz.gradient} border border-white/5 flex items-center justify-center text-2xl flex-shrink-0 group-hover:scale-110 transition-transform`}>
                      {quiz.icon}
                    </div>
                    <span className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full border ${t.sub} ${isDark ? "bg-white/5 border-white/10" : "bg-gray-100 border-gray-200"}`}>
                      {quiz.domain}
                    </span>
                  </div>

                  {/* Title + description */}
                  <div>
                    <h2 className={`text-base font-bold ${t.heading} mb-1`}>{quiz.title}</h2>
                    <p className={`text-xs ${t.sub} leading-relaxed line-clamp-2`}>{quiz.description}</p>
                  </div>

                  {/* Difficulty selector */}
                  <div className="flex items-center gap-1.5">
                    {LEVELS.map(({ id, label, color, ring }) => (
                      <button
                        key={id}
                        onClick={() => setLevel(quiz.id, id)}
                        className={`flex-1 py-1.5 rounded-lg text-xs font-semibold border transition-all duration-150 ${
                          currentLevel === id
                            ? `${ring} ${color}`
                            : isDark
                              ? "border-white/5 text-gray-500 hover:border-white/15 hover:text-gray-300"
                              : "border-gray-200 text-gray-400 hover:border-gray-300 hover:text-gray-600"
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>

                  {/* Meta + CTA */}
                  <div className="flex items-center justify-between mt-auto pt-1">
                    <div className="flex items-center gap-3">
                      <span className={`text-xs ${t.sub}`}>5 questions</span>
                      <span className={`flex items-center gap-1 text-xs font-semibold ${levelCfg.color}`}>
                        {levelCfg.icon} {levelCfg.label}
                      </span>
                    </div>
                    <button
                      onClick={() => router.push(`/quiz/${quiz.id}?level=${currentLevel}`)}
                      className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl text-xs font-semibold transition-all hover:scale-[1.04] shadow-lg shadow-blue-600/20"
                    >
                      Start <ChevronRight size={13} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}
