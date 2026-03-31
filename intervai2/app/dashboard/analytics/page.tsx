"use client";

import { useAuthListener, useTheme } from "@/lib/auth";
import { BarChart2, TrendingUp, Target, Brain } from "lucide-react";

const skills = [
  { name: "System Design", score: 92, bar: "bg-blue-500", badge: "bg-blue-500/10 text-blue-500 border-blue-500/20", desc: "Scalability, distributed systems, architecture patterns" },
  { name: "Algorithms & DSA", score: 85, bar: "bg-indigo-500", badge: "bg-indigo-500/10 text-indigo-500 border-indigo-500/20", desc: "Sorting, graphs, dynamic programming, complexity analysis" },
  { name: "Behavioral", score: 78, bar: "bg-orange-500", badge: "bg-orange-500/10 text-orange-500 border-orange-500/20", desc: "STAR method, leadership, conflict resolution" },
  { name: "Communication", score: 88, bar: "bg-blue-400", badge: "bg-blue-400/10 text-blue-400 border-blue-400/20", desc: "Clarity, structure, active listening" },
  { name: "Problem Solving", score: 81, bar: "bg-purple-500", badge: "bg-purple-500/10 text-purple-500 border-purple-500/20", desc: "Breaking down problems, edge cases, optimisation" },
  { name: "Code Quality", score: 76, bar: "bg-cyan-500", badge: "bg-cyan-500/10 text-cyan-500 border-cyan-500/20", desc: "Readability, naming, modularity, testing" },
];

function scoreColor(s: number) { return s >= 85 ? "text-green-500" : s >= 70 ? "text-yellow-500" : "text-red-500"; }
function scoreLabel(s: number) { return s >= 85 ? "Strong" : s >= 70 ? "Improving" : "Needs work"; }
const overallScore = Math.round(skills.reduce((a, s) => a + s.score, 0) / skills.length);

export default function AnalyticsPage() {
  const { user } = useAuthListener();
  const { isDark } = useTheme();
  if (!user) return null;

  const t = {
    heading: isDark ? "text-white" : "text-gray-900",
    sub: isDark ? "text-gray-400" : "text-gray-500",
    card: isDark ? "bg-[#141b2d] border-white/5" : "bg-white border-gray-200 shadow-sm",
    gauge: isDark ? "bg-gradient-to-br from-blue-600/20 to-indigo-600/10 border-blue-500/20" : "bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200",
    statCard: isDark ? "bg-[#141b2d] border-white/5" : "bg-gray-50 border-gray-200",
    barBg: isDark ? "bg-white/5" : "bg-gray-100",
    placeholder: isDark ? "bg-[#141b2d] border-white/5 border-dashed" : "bg-gray-50 border-gray-200 border-dashed",
    placeholderIcon: isDark ? "text-gray-600" : "text-gray-300",
    placeholderText: isDark ? "text-gray-400" : "text-gray-500",
    placeholderSub: isDark ? "text-gray-600" : "text-gray-400",
  };

  return (
    <div className="p-6 md:p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-9 h-9 rounded-xl bg-blue-500/15 flex items-center justify-center">
            <BarChart2 size={18} className="text-blue-400" />
          </div>
          <h1 className={`text-2xl md:text-3xl font-bold ${t.heading}`}>Analytics</h1>
        </div>
        <p className={`${t.sub} text-sm mt-1 ml-12`}>Deep-dive into your performance across all interview categories.</p>
      </div>

      {/* Overall + quick stats */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className={`${t.gauge} border rounded-2xl p-6 flex items-center gap-5 flex-1`}>
          <div className="relative flex items-center justify-center">
            <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
              <circle cx="40" cy="40" r="32" fill="none" stroke="rgba(99,102,241,0.1)" strokeWidth="8" />
              <circle cx="40" cy="40" r="32" fill="none" stroke="#3b82f6" strokeWidth="8" strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 32}`}
                strokeDashoffset={`${2 * Math.PI * 32 * (1 - overallScore / 100)}`}
                className="transition-all duration-700" />
            </svg>
            <span className={`absolute text-xl font-bold ${t.heading}`}>{overallScore}</span>
          </div>
          <div>
            <p className={`text-xs ${t.sub} font-semibold uppercase tracking-widest mb-1`}>Overall Score</p>
            <p className={`text-2xl font-bold ${t.heading}`}>{overallScore}<span className={`${t.sub} text-base`}>/100</span></p>
            <p className={`text-sm font-semibold mt-0.5 ${scoreColor(overallScore)}`}>{scoreLabel(overallScore)}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:flex sm:flex-col sm:gap-4">
          <div className={`${t.statCard} border rounded-xl px-4 py-3 flex items-center gap-3`}>
            <TrendingUp size={16} className="text-green-400" />
            <div>
              <p className={`text-[10px] ${t.sub} uppercase tracking-widest`}>Improvement</p>
              <p className={`text-sm font-bold ${t.heading}`}>+5% this week</p>
            </div>
          </div>
          <div className={`${t.statCard} border rounded-xl px-4 py-3 flex items-center gap-3`}>
            <Target size={16} className="text-blue-400" />
            <div>
              <p className={`text-[10px] ${t.sub} uppercase tracking-widest`}>Top Skill</p>
              <p className={`text-sm font-bold ${t.heading}`}>System Design</p>
            </div>
          </div>
        </div>
      </div>

      {/* Skill bars */}
      <div className={`${t.card} border rounded-2xl p-6 mb-6`}>
        <div className="flex items-center gap-2 mb-6">
          <Brain size={16} className="text-blue-400" />
          <h2 className={`text-base font-semibold ${t.heading}`}>Skill Breakdown</h2>
        </div>
        <div className="space-y-5">
          {skills.map(({ name, score, bar, badge, desc }) => (
            <div key={name}>
              <div className="flex items-start justify-between mb-2 gap-3">
                <div>
                  <p className={`text-sm font-semibold ${t.heading}`}>{name}</p>
                  <p className={`text-xs ${t.sub} mt-0.5`}>{desc}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-lg border ${badge}`}>{scoreLabel(score)}</span>
                  <span className={`text-sm font-bold ${scoreColor(score)}`}>{score}%</span>
                </div>
              </div>
              <div className={`h-2 ${t.barBg} rounded-full overflow-hidden`}>
                <div className={`h-full ${bar} rounded-full transition-all duration-700`} style={{ width: `${score}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Placeholder */}
      <div className={`${t.placeholder} border rounded-2xl p-8 text-center`}>
        <BarChart2 size={32} className={`${t.placeholderIcon} mx-auto mb-3`} />
        <p className={`text-sm font-semibold ${t.placeholderText}`}>Performance over time</p>
        <p className={`text-xs ${t.placeholderSub} mt-1`}>Score trend charts will appear here after more sessions are recorded.</p>
      </div>
    </div>
  );
}
