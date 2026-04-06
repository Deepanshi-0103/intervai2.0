"use client";


import { useEffect, useState, useCallback } from "react";
import {
    collection,
    getDocs,
    doc,
    setDoc,
    increment,
    Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

// Public helper — call after interview completion
export async function recordActivity(uid: string) {
    const today = new Date().toISOString().slice(0, 10);
    const ref = doc(db, "users", uid, "activity", today);
    await setDoc(
        ref,
        { count: increment(1), updatedAt: Timestamp.now() },
        { merge: true }
    );
}

// Types
type Level = 0 | 1 | 2 | 3 | 4;

export interface StreakStats {
    currentStreak: number;
    maxStreak: number;
    activeDays: number;
    totalSessions: number;
}

interface Cell {
    date: string;    // YYYY-MM-DD
    display: string; // "Mar 4"
    count: number;
    level: Level;
    monthStart?: string; // abbreviated month name, set on first cell of that month
}

// Helpers
function toLevel(n: number): Level {
    if (n === 0) return 0;
    if (n === 1) return 1;
    if (n <= 2) return 2;
    if (n <= 4) return 3;
    return 4;
}

const MONTH_ABBR = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** Build 371 cells (53 × 7) anchored so today is the last filled cell. */
function buildYear(): Cell[] {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Start from the Sunday 52 full weeks ago
    const start = new Date(today);
    start.setDate(today.getDate() - today.getDay() - 52 * 7);

    const cells: Cell[] = [];
    let lastMonth = -1;

    const end = new Date(start);
    end.setDate(start.getDate() + 53 * 7); // 53 cols × 7 rows

    for (let d = new Date(start); d < end; d.setDate(d.getDate() + 1)) {
        const iso = d.toISOString().slice(0, 10);
        const display = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
        const month = d.getMonth();
        const cell: Cell = { date: iso, display, count: 0, level: 0 };
        if (month !== lastMonth && d.getDay() === 0) {
            cell.monthStart = MONTH_ABBR[month];
            lastMonth = month;
        }
        cells.push(cell);
    }
    return cells;
}

// Color scales
const LEVEL_BG_DARK = [
    "bg-white/[0.04] hover:bg-white/10",
    "bg-blue-900/80 hover:bg-blue-800",
    "bg-blue-700   hover:bg-blue-600",
    "bg-blue-500   hover:bg-blue-400",
    "bg-blue-400   hover:bg-blue-300",
];
const LEVEL_BG_LIGHT = [
    "bg-gray-100 hover:bg-gray-200",
    "bg-green-200 hover:bg-green-300",
    "bg-green-400 hover:bg-green-500",
    "bg-green-600 hover:bg-green-700",
    "bg-green-700 hover:bg-green-800",
];

// Props
interface Props {
    uid: string;
    /** Increment to force a data refresh (e.g. after recording a new session) */
    refreshKey?: number;
    theme?: "dark" | "light";
    /** Called once data loads so the parent can display live stat numbers */
    onStatsLoaded?: (stats: StreakStats) => void;
}

// Component
export default function StreakHeatmap({ uid, refreshKey = 0, theme = "dark", onStatsLoaded }: Props) {
    const LEVEL_BG = theme === "light" ? LEVEL_BG_LIGHT : LEVEL_BG_DARK;

    const [cells, setCells] = useState<Cell[]>(buildYear);
    const [totalSessions, setTotal] = useState(0);
    const [activeDays, setActiveDays] = useState(0);
    const [maxStreak, setMaxStreak] = useState(0);
    const [currentStreak, setCurrent] = useState(0);
    const [loading, setLoading] = useState(true);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const snap = await getDocs(collection(db, "users", uid, "activity"));
            const map: Record<string, number> = {};
            let total = 0;
            snap.forEach((d) => {
                const cnt = (d.data() as { count?: number }).count ?? 0;
                map[d.id] = cnt;
                total += cnt;
            });

            const base = buildYear();
            const filled = base.map((c) => {
                const count = map[c.date] ?? 0;
                return { ...c, count, level: toLevel(count) };
            });

            const active = filled.filter((c) => c.count > 0).length;

            const today = new Date().toISOString().slice(0, 10);
            // Only consider past days (up to and including today) for streak math
            const pastDays = [...filled]
                .filter((c) => c.date <= today)
                .sort((a, b) => a.date.localeCompare(b.date));

            // Current streak: walk backward from today
            let curStreak = 0;
            for (let i = pastDays.length - 1; i >= 0; i--) {
                if (pastDays[i].count > 0) {
                    curStreak++;
                } else {
                    break; // streak is broken
                }
            }

            // Max streak: forward scan over past days only
            let max = 0, cur = 0;
            for (const c of pastDays) {
                if (c.count > 0) { cur++; max = Math.max(max, cur); } else { cur = 0; }
            }

            setCells(filled);
            setTotal(total);
            setActiveDays(active);
            setMaxStreak(max);
            setCurrent(curStreak);
            onStatsLoaded?.({ currentStreak: curStreak, maxStreak: max, activeDays: active, totalSessions: total });
        } catch (e) {
            console.error("StreakHeatmap load:", e);
        } finally {
            setLoading(false);
        }
    }, [uid, refreshKey]);

    useEffect(() => { load(); }, [load]);

    // Group cells into 53 columns of 7
    const COLS = 53;
    const weeks: Cell[][] = Array.from({ length: COLS }, (_, wi) =>
        cells.slice(wi * 7, wi * 7 + 7)
    );

    return (
        <div className="w-full space-y-6">
            {/* Top stats bar */}
            <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm font-semibold text-white">
                    {loading ? "—" : <><span className="text-blue-400 font-bold text-base">{totalSessions}</span> sessions in the past year</>}
                </p>
                <div className="flex items-center gap-6 text-xs text-gray-400">
                    <span>Total active days: <strong className="text-white">{loading ? "—" : activeDays}</strong></span>
                    <span>Max streak: <strong className="text-white">{loading ? "—" : maxStreak}</strong></span>
                    <span>Current streak: <strong className="text-blue-400">{loading ? "—" : currentStreak}</strong></span>
                </div>
            </div>

            {/* Heatmap grid */}
            <div className="w-full overflow-x-auto">
                <div className="min-w-[700px]">
                    {/* Day-of-week labels (left gutter) */}
                    <div className="flex gap-[3px]">
                        {/* empty corner */}
                        <div className="w-7 flex-shrink-0" />

                        {/* Week columns */}
                        {weeks.map((week, wi) => (
                            <div key={wi} className="flex-1 flex flex-col gap-[3px]">
                                {/* Month label on first day of month that falls on a Sunday */}
                                <div className="h-4 flex items-end">
                                    {week[0]?.monthStart && (
                                        <span className="text-[10px] text-gray-500 font-medium leading-none">
                                            {week[0].monthStart}
                                        </span>
                                    )}
                                </div>
                                {/* 7 day cells */}
                                {week.map((cell, di) => (
                                    <div
                                        key={cell.date}
                                        title={`${cell.display}: ${cell.count} session${cell.count !== 1 ? "s" : ""}`}
                                        className={`
                      w-full aspect-square rounded-[3px] cursor-default
                      transition-all duration-150
                      ${LEVEL_BG[cell.level]}
                      ${cell.date > new Date().toISOString().slice(0, 10) ? "opacity-0 pointer-events-none" : ""}
                    `}
                                    />
                                ))}
                            </div>
                        ))}

                        {/* DOW labels (right side like LeetCode) */}
                        <div className="flex flex-col gap-[3px] pl-2 w-7 flex-shrink-0">
                            <div className="h-4" />{/* spacer for month row */}
                            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                                <div key={d} className="flex-1 flex items-center text-[9px] text-gray-600 leading-none">
                                    {d === "Mon" || d === "Wed" || d === "Fri" ? d : ""}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Legend */}
            <div className="flex items-center gap-2 text-xs text-gray-500">
                <span>Less</span>
                {LEVEL_BG.map((cls, i) => (
                    <div
                        key={i}
                        className={`w-3.5 h-3.5 rounded-sm ${cls.split(" ")[0]}`}
                    />
                ))}
                <span>More</span>
            </div>
        </div>
    );
}
