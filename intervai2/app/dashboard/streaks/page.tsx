"use client";

import { useState } from "react";
import { useAuthListener, useTheme } from "@/lib/auth";
import StreakHeatmap, { type StreakStats } from "@/app/components/ui/StreakHeatmap";
import { Flame, Calendar, Zap, Trophy, TrendingUp } from "lucide-react";

export default function StreaksPage() {
    const { user } = useAuthListener();
    const { isDark } = useTheme();
    const [stats, setStats] = useState<StreakStats | null>(null);

    if (!user) return null;

    const firstName = user.displayName?.split(" ")[0] ?? "there";

    const t = {
        heading: isDark ? "text-white" : "text-gray-900",
        sub: isDark ? "text-gray-400" : "text-gray-500",
        card: isDark ? "bg-[#141b2d] border-white/5 hover:border-white/10" : "bg-white border-gray-200 shadow-sm hover:border-gray-300",
        tip: isDark ? "bg-[#141b2d] border-white/5 hover:border-white/10" : "bg-white border-gray-200 shadow-sm",
        badge: isDark ? "text-xs text-gray-400 bg-white/5 px-3 py-1.5 rounded-lg border border-white/5" : "text-xs text-gray-500 bg-gray-100 px-3 py-1.5 rounded-lg border border-gray-200",
    };

    const statCards = [
        {
            icon: Flame,
            color: "text-orange-400",
            bg: "bg-orange-500/10 border-orange-500/15",
            label: "Current Streak",
            value: stats?.currentStreak ?? null,
            unit: "days",
        },
        {
            icon: Trophy,
            color: "text-yellow-400",
            bg: "bg-yellow-500/10 border-yellow-500/15",
            label: "Longest Streak",
            value: stats?.maxStreak ?? null,
            unit: "days",
        },
        {
            icon: Calendar,
            color: "text-blue-400",
            bg: "bg-blue-500/10 border-blue-500/15",
            label: "Active Days",
            value: stats?.activeDays ?? null,
            unit: "this year",
        },
        {
            icon: TrendingUp,
            color: "text-green-400",
            bg: "bg-green-500/10 border-green-500/15",
            label: "Total Sessions",
            value: stats?.totalSessions ?? null,
            unit: "recorded",
        },
    ];

    return (
        <div className="p-6 md:p-10 space-y-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-orange-500/15 border border-orange-500/20 flex items-center justify-center">
                        <Flame size={20} className="text-orange-400" />
                    </div>
                    <div>
                        <h1 className={`text-2xl md:text-3xl font-bold ${t.heading} leading-tight`}>Practice Streak</h1>
                        <p className={`${t.sub} text-sm mt-0.5`}>Hey {firstName}, consistency beats intensity.</p>
                    </div>
                </div>
                <a href="/interview" className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-all hover:scale-[1.02] shadow-lg shadow-blue-600/25 whitespace-nowrap self-start sm:self-auto">
                    <Zap size={15} /> Start Session
                </a>
            </div>

            {/* Stat strip */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {statCards.map(({ icon: Icon, color, bg, label, value, unit }) => (
                    <div key={label} className={`${t.card} border rounded-2xl p-5 flex items-start gap-4 transition-all`}>
                        <div className={`w-9 h-9 rounded-xl ${bg} border flex items-center justify-center flex-shrink-0`}>
                            <Icon size={17} className={color} />
                        </div>
                        <div>
                            <p className={`text-xs ${t.sub} font-medium mb-1`}>{label}</p>
                            <p className={`text-2xl font-bold ${t.heading} leading-tight`}>
                                {value === null ? (
                                    <span className="inline-block w-8 h-6 rounded bg-current opacity-10 animate-pulse" />
                                ) : value}
                            </p>
                            <p className={`text-[11px] ${t.sub} mt-0.5`}>{unit}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Heatmap card – full width */}
            <div className={`${t.card} border rounded-2xl p-6 md:p-8 transition-all`}>
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className={`text-base font-semibold ${t.heading}`}>Activity Calendar</h2>
                        <p className={`text-xs ${t.sub} mt-0.5`}>Past 12 months of interview activity</p>
                    </div>
                    <div className={t.badge}>Last 12 months</div>
                </div>
                <StreakHeatmap
                    uid={user.uid}
                    theme={isDark ? "dark" : "light"}
                    onStatsLoaded={setStats}
                />
            </div>

            {/* Tips */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                    { emoji: "🎯", title: "Set a daily goal", desc: "Even one question per day compounds into massive improvement over weeks." },
                    { emoji: "⚡", title: "Short sessions count", desc: "A 15-minute quiz still lights up your heatmap. Momentum matters more than duration." },
                    { emoji: "📈", title: "Track your weak spots", desc: "Visit Analytics to see which skill categories need the most practice." },
                ].map(({ emoji, title, desc }) => (
                    <div key={title} className={`${t.tip} border rounded-2xl p-5 hover:border-white/10 transition-all`}>
                        <p className="text-xl mb-3">{emoji}</p>
                        <p className={`text-sm font-semibold ${t.heading} mb-1.5`}>{title}</p>
                        <p className={`text-xs ${t.sub} leading-relaxed`}>{desc}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}

