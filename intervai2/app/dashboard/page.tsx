"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Play, TrendingUp, CheckCircle2, Flame, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useAuthListener, useTheme } from "@/lib/auth";

const sessions = [
  { id: 1, topic: "System Design - Scalability", type: "Technical", date: "Oct 24, 2025", score: 92, iconBg: "bg-purple-500/20", iconColor: "text-purple-400", icon: "💻" },
  { id: 2, topic: "Conflict Resolution", type: "Behavioral", date: "Oct 22, 2025", score: 78, iconBg: "bg-blue-500/20", iconColor: "text-blue-400", icon: "👥" },
  { id: 3, topic: "Dynamic Programming", type: "Coding", date: "Oct 20, 2025", score: 88, iconBg: "bg-cyan-500/20", iconColor: "text-cyan-400", icon: "</>" },
];

function scoreColor(s: number) { return s >= 85 ? "text-green-500" : s >= 70 ? "text-yellow-500" : "text-red-500"; }
function scoreBadge(s: number) { return s >= 85 ? "bg-green-500/10 border border-green-500/20" : s >= 70 ? "bg-yellow-500/10 border border-yellow-500/20" : "bg-red-500/10 border border-red-500/20"; }

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading } = useAuthListener();
  const { isDark } = useTheme();
  const [activeTab, setActiveTab] = useState("All");

  useEffect(() => { if (!loading && !user) router.push("/signup"); }, [user, loading, router]);
  if (loading || !user) return null;

  const firstName = user.displayName?.split(" ")[0] ?? "there";
  const filtered = activeTab === "All" ? sessions : sessions.filter((s) => s.type === activeTab);

  // ── Theme tokens ────────────────────────────────────────────────────────
  const t = {
    heading: isDark ? "text-white" : "text-gray-900",
    sub: isDark ? "text-gray-400" : "text-gray-500",
    card: isDark ? "bg-[#141b2d] border-white/5 hover:border-white/10" : "bg-white border-gray-200 shadow-sm hover:border-gray-300",
    tabBar: isDark ? "bg-white/5" : "bg-gray-100",
    tabInact: isDark ? "text-gray-400 hover:text-white" : "text-gray-500 hover:text-gray-900",
    tabAct: isDark ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" : "bg-blue-600 text-white",
    tableHdr: isDark ? "text-gray-500" : "text-gray-400",
    rowHover: isDark ? "hover:bg-white/5 hover:border-white/5" : "hover:bg-gray-50 hover:border-gray-100",
    rowText: isDark ? "text-white" : "text-gray-900",
    rowSub: isDark ? "text-gray-400" : "text-gray-500",
    badgeLabel: isDark ? "text-xs text-gray-400 bg-white/5 px-2.5 py-1 rounded-lg border border-white/5" : "text-xs text-gray-500 bg-gray-100 px-2.5 py-1 rounded-lg border border-gray-200",
    quickCard: isDark ? "bg-[#141b2d] border-white/5" : "bg-white border-gray-200 shadow-sm",
    quickHoverOrange: isDark ? "hover:border-orange-500/30 hover:bg-orange-500/5" : "hover:border-orange-400/40 hover:bg-orange-50",
    quickHoverBlue: isDark ? "hover:border-blue-500/30  hover:bg-blue-500/5" : "hover:border-blue-400/40  hover:bg-blue-50",
    arrowIcon: isDark ? "text-gray-600" : "text-gray-400",
  };

  return (
    <div className="p-6 md:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className={`text-2xl md:text-3xl font-bold ${t.heading}`}>Welcome back, {firstName}! 👋</h1>
          <p className={`${t.sub} text-sm mt-1`}>You're on a roll. Ready to ace your next technical interview?</p>
        </div>
        <button onClick={() => router.push("/interview")} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all hover:scale-[1.03] shadow-lg shadow-blue-600/30 whitespace-nowrap">
          <Play size={15} /> Start New Session
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-6">
        {[
          { label: "Average Score", icon: TrendingUp, iconBg: "bg-blue-500/10", iconClr: "text-blue-400", val: "86", unit: "/100", extra: <span className="text-xs text-green-500 font-semibold ml-1">↗ +5%</span> },
          { label: "Interviews Completed", icon: CheckCircle2, iconBg: "bg-green-500/10", iconClr: "text-green-400", val: "14", unit: "sessions", extra: null },
          {
            label: "Current Streak", icon: Flame, iconBg: "bg-orange-500/10", iconClr: "text-orange-400", val: "12", unit: "days",
            extra: <Link href="/dashboard/streaks" className="inline-flex items-center gap-1 text-xs text-blue-500 hover:text-blue-400 mt-2 transition"><span>View streak</span><ArrowRight size={11} /></Link>
          },
        ].map(({ label, icon: Icon, iconBg, iconClr, val, unit, extra }) => (
          <div key={label} className={`${t.card} border rounded-2xl p-5 transition-all`}>
            <div className="flex items-start justify-between mb-3">
              <p className={`text-xs font-medium ${t.sub}`}>{label}</p>
              <div className={`w-8 h-8 rounded-lg ${iconBg} flex items-center justify-center`}><Icon size={15} className={iconClr} /></div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className={`text-3xl font-bold ${t.heading}`}>{val}</span>
              <span className={`text-sm ${t.sub}`}>{unit}</span>
              {extra}
            </div>
          </div>
        ))}
      </div>

      {/* Quick nav cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <Link href="/dashboard/streaks" className={`group ${t.quickCard} border ${t.quickHoverOrange} rounded-2xl p-5 flex items-center gap-4 transition-all duration-200`}>
          <div className="w-10 h-10 rounded-xl bg-orange-500/15 flex items-center justify-center group-hover:scale-110 transition-transform"><Flame size={18} className="text-orange-400" /></div>
          <div>
            <p className={`text-sm font-semibold ${t.heading}`}>Practice Streak</p>
            <p className={`text-xs ${t.sub} mt-0.5`}>View your daily activity heatmap</p>
          </div>
          <ArrowRight size={16} className={`${t.arrowIcon} group-hover:text-orange-400 ml-auto transition-colors`} />
        </Link>
        <Link href="/dashboard/analytics" className={`group ${t.quickCard} border ${t.quickHoverBlue} rounded-2xl p-5 flex items-center gap-4 transition-all duration-200`}>
          <div className="w-10 h-10 rounded-xl bg-blue-500/15 flex items-center justify-center group-hover:scale-110 transition-transform"><TrendingUp size={18} className="text-blue-400" /></div>
          <div>
            <p className={`text-sm font-semibold ${t.heading}`}>Skill Analytics</p>
            <p className={`text-xs ${t.sub} mt-0.5`}>See your performance breakdown</p>
          </div>
          <ArrowRight size={16} className={`${t.arrowIcon} group-hover:text-blue-400 ml-auto transition-colors`} />
        </Link>
      </div>

      {/* Recent Sessions */}
      <div className={`${t.card} border rounded-2xl p-6 transition-all`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <h2 className={`text-base font-semibold ${t.heading}`}>Recent Sessions</h2>
          <div className={`flex items-center gap-1 ${t.tabBar} p-1 rounded-xl`}>
            {["All", "Technical", "Behavioral"].map((tab) => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${activeTab === tab ? t.tabAct : t.tabInact}`}>
                {tab}
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-[1fr_100px_110px_90px_90px] gap-4 px-3 mb-2">
          {["TOPIC", "TYPE", "DATE", "SCORE", "ACTION"].map((h) => (
            <span key={h} className={`text-[10px] font-bold tracking-widest uppercase ${t.tableHdr}`}>{h}</span>
          ))}
        </div>
        <div className="space-y-2">
          {filtered.map((s) => (
            <div key={s.id} className={`grid grid-cols-[1fr_100px_110px_90px_90px] gap-4 items-center px-3 py-3.5 rounded-xl transition-all border border-transparent ${t.rowHover}`}>
              <div className="flex items-center gap-3 overflow-hidden">
                <div className={`w-8 h-8 rounded-lg ${s.iconBg} flex items-center justify-center flex-shrink-0 text-sm`}><span className={s.iconColor}>{s.icon}</span></div>
                <span className={`text-sm font-medium truncate ${t.rowText}`}>{s.topic}</span>
              </div>
              <span className={`text-sm ${t.rowSub}`}>{s.type}</span>
              <span className={`text-sm ${t.rowSub}`}>{s.date}</span>
              <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${scoreBadge(s.score)} ${scoreColor(s.score)} w-fit`}>{s.score}/100</span>
              <button className="text-sm text-blue-500 hover:text-blue-400 font-semibold transition text-left">View Details</button>
            </div>
          ))}
          {filtered.length === 0 && <div className={`text-center py-10 ${t.sub} text-sm`}>No {activeTab.toLowerCase()} sessions yet</div>}
        </div>
      </div>
    </div>
  );
}
