"use client";

import { useEffect, useState } from "react";
import { useAuthListener, useTheme } from "@/lib/auth";
import { fetchUserSessions, type SessionSummary } from "@/firebase/fetchSessions";
import {
    Mic, ChevronDown, ChevronUp, Loader2, Sparkles,
    Trophy, TrendingUp, AlertCircle, CheckCircle2, ArrowRight,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────
interface QuestionFeedback {
    question: string;
    rating: "Excellent" | "Good" | "Fair" | "Needs Work";
    feedback: string;
}
interface Feedback {
    overallScore: number;
    summary: string;
    strengths: string[];
    improvements: string[];
    questionFeedback: QuestionFeedback[];
    nextSteps: string;
}

const RATING_COLOR: Record<string, string> = {
    "Excellent": "text-green-400 bg-green-500/10 border-green-500/20",
    "Good": "text-blue-400 bg-blue-500/10 border-blue-500/20",
    "Fair": "text-yellow-400 bg-yellow-500/10 border-yellow-500/20",
    "Needs Work": "text-red-400 bg-red-500/10 border-red-500/20",
};

function scoreColor(s: number) {
    if (s >= 80) return "text-green-400";
    if (s >= 60) return "text-yellow-400";
    return "text-red-400";
}

function scoreRing(s: number) {
    if (s >= 80) return "stroke-green-400";
    if (s >= 60) return "stroke-yellow-400";
    return "stroke-red-400";
}

// ── Score ring SVG ────────────────────────────────────────────────────────────
function ScoreRing({ score }: { score: number }) {
    const r = 36, c = 2 * Math.PI * r;
    const offset = c - (score / 100) * c;
    return (
        <div className="relative flex items-center justify-center w-24 h-24">
            <svg className="absolute" width="96" height="96" viewBox="0 0 96 96">
                <circle cx="48" cy="48" r={r} fill="none" stroke="currentColor" strokeWidth="8" className="text-white/5" />
                <circle cx="48" cy="48" r={r} fill="none" strokeWidth="8"
                    strokeDasharray={c} strokeDashoffset={offset}
                    strokeLinecap="round" className={`${scoreRing(score)} transition-all duration-700`}
                    transform="rotate(-90 48 48)" />
            </svg>
            <span className={`text-2xl font-bold ${scoreColor(score)}`}>{score}</span>
        </div>
    );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function InterviewsPage() {
    const { user, loading } = useAuthListener();
    const { isDark } = useTheme();
    const [sessions, setSessions] = useState<SessionSummary[]>([]);
    const [fetching, setFetching] = useState(true);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [feedbackMap, setFeedbackMap] = useState<Record<string, Feedback>>({});
    const [generatingId, setGeneratingId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!user) return;
        fetchUserSessions(user.uid)
            .then(setSessions)
            .catch(() => setError("Failed to load sessions. Check Firestore rules."))
            .finally(() => setFetching(false));
    }, [user]);

    if (loading || !user) return null;

    const t = {
        heading: isDark ? "text-white" : "text-gray-900",
        sub: isDark ? "text-gray-400" : "text-gray-500",
        card: isDark ? "bg-[#141b2d] border-white/5" : "bg-white border-gray-200 shadow-sm",
        cardHover: isDark ? "hover:border-white/10" : "hover:border-gray-300",
        inner: isDark ? "bg-white/[0.03] border-white/5" : "bg-gray-50 border-gray-100",
        badge: isDark ? "bg-white/5 border-white/10 text-gray-400" : "bg-gray-100 border-gray-200 text-gray-500",
    };

    async function generateFeedback(session: SessionSummary) {
        if (feedbackMap[session.id]) {
            setExpandedId(expandedId === session.id ? null : session.id);
            return;
        }

        // Guard: session must have questions to generate feedback
        if (!session.questions || session.questions.length === 0) {
            setError("This session has no questions recorded — feedback cannot be generated.");
            return;
        }

        setGeneratingId(session.id);
        setExpandedId(session.id);
        setError(null);
        try {
            const res = await fetch("/api/generate-feedback", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    role: session.role,
                    questions: session.questions,
                    answers: session.answers,
                }),
            });
            const data = await res.json();
            if (!res.ok) {
                // Surface the specific error from the API
                const msg = data?.error ?? `Server error (${res.status})`;
                setError(`Feedback generation failed: ${msg}`);
                setExpandedId(null);
                return;
            }
            if (data.feedback) {
                setFeedbackMap((prev) => ({ ...prev, [session.id]: data.feedback }));
            }
        } catch (err) {
            console.error("[generateFeedback] network error:", err);
            setError("Network error — could not reach the feedback API. Please try again.");
            setExpandedId(null);
        } finally {
            setGeneratingId(null);
        }
    }

    return (
        <div className="p-6 md:p-10 space-y-6">

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/15 border border-blue-500/20 flex items-center justify-center">
                        <Mic size={20} className="text-blue-400" />
                    </div>
                    <div>
                        <h1 className={`text-2xl md:text-3xl font-bold ${t.heading} leading-tight`}>
                            Interview History
                        </h1>
                        <p className={`${t.sub} text-sm mt-0.5`}>
                            {fetching ? "Loading sessions…" : `${sessions.length} session${sessions.length !== 1 ? "s" : ""} recorded`}
                        </p>
                    </div>
                </div>
                <a href="/interview"
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-all hover:scale-[1.02] shadow-lg shadow-blue-600/25 whitespace-nowrap self-start sm:self-auto">
                    <Mic size={15} /> New Interview
                </a>
            </div>

            {/* Error */}
            {error && (
                <div className="flex items-center gap-3 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                    <AlertCircle size={16} className="flex-shrink-0" />
                    {error}
                </div>
            )}

            {/* Loading skeleton */}
            {fetching && (
                <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className={`${t.card} border rounded-2xl p-5 animate-pulse`}>
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-white/5" />
                                <div className="flex-1 space-y-2">
                                    <div className="h-4 bg-white/5 rounded w-48" />
                                    <div className="h-3 bg-white/5 rounded w-32" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Empty state */}
            {!fetching && sessions.length === 0 && !error && (
                <div className={`${t.card} border rounded-2xl p-12 flex flex-col items-center justify-center gap-4 text-center`}>
                    <div className="w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                        <Mic size={28} className="text-blue-400" />
                    </div>
                    <div>
                        <p className={`text-base font-semibold ${t.heading}`}>No sessions yet</p>
                        <p className={`text-sm ${t.sub} mt-1`}>Complete your first interview to see it here.</p>
                    </div>
                    <a href="/interview"
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all mt-2">
                        Start Interview <ArrowRight size={14} />
                    </a>
                </div>
            )}

            {/* Session list */}
            {!fetching && sessions.map((session) => {
                const isExpanded = expandedId === session.id;
                const isGenerating = generatingId === session.id;
                const feedback = feedbackMap[session.id];
                const dateStr = session.createdAt.toLocaleDateString("en-IN", {
                    day: "numeric", month: "short", year: "numeric",
                });
                const timeStr = session.createdAt.toLocaleTimeString("en-IN", {
                    hour: "2-digit", minute: "2-digit",
                });

                return (
                    <div key={session.id}
                        className={`${t.card} ${t.cardHover} border rounded-2xl overflow-hidden transition-all duration-200`}>

                        {/* Session header row */}
                        <div className="flex items-center gap-4 p-5">
                            <div className="w-10 h-10 rounded-xl bg-blue-500/15 border border-blue-500/20 flex items-center justify-center flex-shrink-0">
                                <Mic size={18} className="text-blue-400" />
                            </div>

                            <div className="flex-1 min-w-0">
                                <p className={`text-sm font-semibold truncate ${t.heading}`}>{session.role}</p>
                                <p className={`text-xs ${t.sub} mt-0.5`}>
                                    {dateStr} at {timeStr} · {session.questions.length} questions
                                </p>
                            </div>

                            {/* Score badge if feedback exists */}
                            {feedback && (
                                <div className={`text-sm font-bold px-3 py-1 rounded-lg border ${feedback.overallScore >= 80
                                    ? "text-green-400 bg-green-500/10 border-green-500/20"
                                    : feedback.overallScore >= 60
                                        ? "text-yellow-400 bg-yellow-500/10 border-yellow-500/20"
                                        : "text-red-400 bg-red-500/10 border-red-500/20"}`}>
                                    {feedback.overallScore}/100
                                </div>
                            )}

                            {/* Feedback / expand button */}
                            <button
                                onClick={() => generateFeedback(session)}
                                disabled={isGenerating}
                                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all active:scale-95 ${feedback
                                    ? isDark
                                        ? "bg-white/5 text-gray-300 hover:bg-white/10 border border-white/10"
                                        : "bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200"
                                    : "bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-600/20"
                                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                            >
                                {isGenerating ? (
                                    <><Loader2 size={14} className="animate-spin" /> Analysing…</>
                                ) : feedback ? (
                                    isExpanded ? <><ChevronUp size={14} /> Hide</> : <><ChevronDown size={14} /> View Report</>
                                ) : (
                                    <><Sparkles size={14} /> Get Feedback</>
                                )}
                            </button>
                        </div>

                        {/* Generating shimmer */}
                        {isGenerating && (
                            <div className={`px-5 pb-5`}>
                                <div className={`${t.inner} border rounded-xl p-4 space-y-3 animate-pulse`}>
                                    <div className="flex items-center gap-2">
                                        <Sparkles size={14} className="text-blue-400" />
                                        <span className={`text-xs ${t.sub}`}>Gemini is analysing your responses…</span>
                                    </div>
                                    {[80, 60, 90, 55].map((w, i) => (
                                        <div key={i} className="h-3 bg-white/5 rounded" style={{ width: `${w}%` }} />
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Feedback panel */}
                        {isExpanded && feedback && !isGenerating && (
                            <div className="px-5 pb-5 space-y-5">

                                {/* Score + summary */}
                                <div className={`${t.inner} border rounded-2xl p-5 flex flex-col sm:flex-row items-center gap-6`}>
                                    <div className="flex flex-col items-center gap-1 flex-shrink-0">
                                        <ScoreRing score={feedback.overallScore} />
                                        <p className={`text-xs font-semibold ${t.sub}`}>Overall Score</p>
                                    </div>
                                    <div className="flex-1">
                                        <p className={`text-sm font-semibold ${t.heading} mb-2`}>Summary</p>
                                        <p className={`text-sm ${t.sub} leading-relaxed`}>{feedback.summary}</p>
                                        <div className={`mt-3 rounded-lg border px-4 py-3 text-sm ${isDark ? "border-blue-500/20 bg-blue-500/5 text-blue-300" : "border-blue-200 bg-blue-50 text-blue-700"}`}>
                                            <span className="font-semibold">Next steps: </span>{feedback.nextSteps}
                                        </div>
                                    </div>
                                </div>

                                {/* Strengths + Improvements */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className={`${t.inner} border rounded-xl p-4`}>
                                        <div className="flex items-center gap-2 mb-3">
                                            <CheckCircle2 size={14} className="text-green-400" />
                                            <p className="text-sm font-semibold text-green-400">Strengths</p>
                                        </div>
                                        <ul className="space-y-2">
                                            {feedback.strengths.map((s, i) => (
                                                <li key={i} className={`text-xs ${t.sub} flex items-start gap-2`}>
                                                    <span className="text-green-400 mt-0.5 flex-shrink-0">▸</span>{s}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                    <div className={`${t.inner} border rounded-xl p-4`}>
                                        <div className="flex items-center gap-2 mb-3">
                                            <TrendingUp size={14} className="text-orange-400" />
                                            <p className="text-sm font-semibold text-orange-400">Areas to Improve</p>
                                        </div>
                                        <ul className="space-y-2">
                                            {feedback.improvements.map((s, i) => (
                                                <li key={i} className={`text-xs ${t.sub} flex items-start gap-2`}>
                                                    <span className="text-orange-400 mt-0.5 flex-shrink-0">▸</span>{s}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>

                                {/* Per-question feedback */}
                                <div className="space-y-3">
                                    <p className={`text-sm font-semibold ${t.heading}`}>Question-by-Question Breakdown</p>
                                    {feedback.questionFeedback.map((qf, i) => (
                                        <div key={i} className={`${t.inner} border rounded-xl p-4`}>
                                            <div className="flex items-start justify-between gap-3 mb-2">
                                                <p className={`text-xs font-semibold ${t.heading} flex-1`}>
                                                    Q{i + 1}: {qf.question}
                                                </p>
                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded border flex-shrink-0 ${RATING_COLOR[qf.rating] ?? "text-gray-400 bg-white/5 border-white/10"}`}>
                                                    {qf.rating}
                                                </span>
                                            </div>
                                            <p className={`text-xs ${t.sub} leading-relaxed`}>{qf.feedback}</p>
                                            {session.answers[i] && (
                                                <details className="mt-2 group">
                                                    <summary className={`text-[10px] cursor-pointer ${t.sub} hover:text-blue-400 transition-colors`}>
                                                        Show your answer ▾
                                                    </summary>
                                                    <p className={`text-xs mt-1.5 italic ${t.sub} leading-relaxed pl-2 border-l-2 border-white/10`}>
                                                        {session.answers[i]}
                                                    </p>
                                                </details>
                                            )}
                                        </div>
                                    ))}
                                </div>

                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
