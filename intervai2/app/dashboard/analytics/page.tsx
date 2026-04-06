"use client";

import { useEffect, useState } from "react";
import { useAuthListener, useTheme } from "@/lib/auth";
import { BarChart2, TrendingUp, Target, Brain, Loader2 } from "lucide-react";
import { computeUserSkills, type SkillScore } from "@/lib/skillAnalytics";

function scoreColor(s: number) { return s >= 85 ? "text-emerald-400" : s >= 60 ? "text-amber-400" : "text-red-400"; }
function scoreLabel(s: number) { 
  if (s === 0) return "No Data";
  return s >= 85 ? "Strong" : s >= 60 ? "Improving" : "Needs work"; 
}

export default function AnalyticsPage() {
  const { user, loading } = useAuthListener();
  const { isDark } = useTheme();
  
  const [skills, setSkills] = useState<SkillScore[]>([]);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!user) return;
    computeUserSkills(user.uid)
      .then(setSkills)
      .catch(console.error)
      .finally(() => setFetching(false));
  }, [user]);

  if (loading || !user) return null;

  // Calculate overall score (average of all skills that have data > 0)
  const activeSkills = skills.filter(s => s.score > 0);
  const overallScore = activeSkills.length > 0
    ? Math.round(activeSkills.reduce((a, s) => a + s.score, 0) / activeSkills.length)
    : 0;

  // Find top skill
  const topSkill = activeSkills.length > 0 
    ? activeSkills.reduce((prev, curr) => (curr.score > prev.score ? curr : prev)).name
    : "Take a quiz/interview";

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
              <p className={`text-[10px] ${t.sub} uppercase tracking-widest`}>Recent Activity</p>
              <p className={`text-sm font-bold ${t.heading}`}>Keep going!</p>
            </div>
          </div>
          <div className={`${t.statCard} border rounded-xl px-4 py-3 flex items-center gap-3`}>
            <Target size={16} className="text-blue-400" />
            <div>
              <p className={`text-[10px] ${t.sub} uppercase tracking-widest`}>Top Skill</p>
              <p className={`text-sm font-bold truncate ${t.heading}`}>{topSkill}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Skill bars */}
      <div className={`${t.card} border rounded-2xl p-6 mb-6 relative overflow-hidden`}>
        <div className="flex items-center gap-2 mb-6">
          <Brain size={16} className="text-blue-400" />
          <h2 className={`text-base font-semibold ${t.heading}`}>Skill Breakdown</h2>
        </div>

        {fetching ? (
          <div className="space-y-5 animate-pulse">
            {[1, 2, 3, 4].map(i => (
              <div key={i}>
                <div className="h-4 bg-gray-500/20 rounded w-1/3 mb-2" />
                <div className="h-2 bg-gray-500/10 rounded-full w-full" />
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-5">
            {skills.map(({ name, score, bar, badge, desc }) => (
              <div key={name}>
                <div className="flex items-start justify-between mb-2 gap-3">
                  <div>
                    <p className={`text-sm font-semibold ${t.heading}`}>{name}</p>
                    <p className={`text-xs ${t.sub} mt-0.5`}>{desc}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-lg border ${score === 0 ? "bg-gray-500/10 text-gray-500 border-gray-500/20" : badge}`}>
                      {scoreLabel(score)}
                    </span>
                    <span className={`text-sm font-bold ${score === 0 ? "text-gray-500" : scoreColor(score)}`}>{score}%</span>
                  </div>
                </div>
                <div className={`h-2 ${t.barBg} rounded-full overflow-hidden`}>
                  <div className={`h-full ${score > 0 ? bar : "bg-transparent"} rounded-full transition-all duration-700`} style={{ width: `${score}%` }} />
                </div>
              </div>
            ))}
          </div>
        )}
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
