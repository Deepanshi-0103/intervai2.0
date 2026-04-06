"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
    FileText, Upload, X, Sparkles, Target, TrendingUp,
    AlertTriangle, CheckCircle2, ChevronRight, RotateCcw,
    Loader2, History, Zap
} from "lucide-react";
import { useAuthListener, useTheme } from "@/lib/auth";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

interface ResumeAnalysis {
    atsScore: number;
    formattingScore: number;
    summary: string;
    strengths: string[];
    improvements: string[];
    keywordGaps: string[];
    nextSteps: string;
}

interface StoredReview {
    fileName: string;
    jobRole: string;
    timestamp: number;
    analysis: ResumeAnalysis;
}

/* Animated Score Ring */
function ScoreRing({ score, label, color }: { score: number; label: string; color: string }) {
    const [animated, setAnimated] = useState(0);
    const r = 36;
    const circ = 2 * Math.PI * r;

    useEffect(() => {
        // Start from 0 and count up to score
        let frame: number;
        let start: number | null = null;
        const duration = 1200;

        function step(ts: number) {
            if (!start) start = ts;
            const progress = Math.min((ts - start) / duration, 1);
            // Ease out cubic
            const eased = 1 - Math.pow(1 - progress, 3);
            setAnimated(Math.round(eased * score));
            if (progress < 1) frame = requestAnimationFrame(step);
        }
        frame = requestAnimationFrame(step);
        return () => cancelAnimationFrame(frame);
    }, [score]);

    const offset = circ * (1 - animated / 100);

    return (
        <div className="flex flex-col items-center gap-2">
            <div className="relative w-24 h-24 flex items-center justify-center">
                {/* Glow pulse behind ring */}
                <div
                    className="absolute inset-0 rounded-full opacity-20 blur-md animate-pulse"
                    style={{ background: color }}
                />
                <svg className="-rotate-90 w-24 h-24 relative" viewBox="0 0 96 96">
                    <circle cx="48" cy="48" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
                    <circle
                        cx="48" cy="48" r={r} fill="none" stroke={color} strokeWidth="8"
                        strokeLinecap="round"
                        strokeDasharray={circ}
                        strokeDashoffset={offset}
                        style={{ transition: "stroke-dashoffset 0.05s linear" }}
                    />
                </svg>
                <span className="absolute text-2xl font-bold text-white tabular-nums">{animated}</span>
            </div>
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest">{label}</span>
        </div>
    );
}

/* Fade-in wrapper */
function FadeIn({ children, delay = 0, className = "" }: {
    children: React.ReactNode;
    delay?: number;
    className?: string;
}) {
    const [visible, setVisible] = useState(false);
    useEffect(() => {
        const t = setTimeout(() => setVisible(true), delay);
        return () => clearTimeout(t);
    }, [delay]);

    return (
        <div
            className={className}
            style={{
                opacity: visible ? 1 : 0,
                transform: visible ? "translateY(0)" : "translateY(16px)",
                transition: "opacity 0.5s ease, transform 0.5s ease",
            }}
        >
            {children}
        </div>
    );
}

/*  Analysing skeleton */
function AnalysingSkeleton() {
    return (
        <div className="space-y-4 animate-pulse">
            {[200, 160, 120, 140].map((w, i) => (
                <div key={i} className="rounded-2xl bg-white/5 border border-white/5 p-6">
                    <div className="h-4 rounded bg-white/10 mb-3" style={{ width: `${w}px` }} />
                    <div className="space-y-2">
                        <div className="h-3 rounded bg-white/8 w-full" />
                        <div className="h-3 rounded bg-white/8 w-5/6" />
                    </div>
                </div>
            ))}
        </div>
    );
}

/* Helpers */
function scoreGrade(s: number) {
    if (s >= 80) return { label: "Excellent", color: "text-emerald-400", border: "border-emerald-500/30", bg: "bg-emerald-500/10" };
    if (s >= 60) return { label: "Good", color: "text-blue-400", border: "border-blue-500/30", bg: "bg-blue-500/10" };
    if (s >= 40) return { label: "Fair", color: "text-amber-400", border: "border-amber-500/30", bg: "bg-amber-500/10" };
    return { label: "Needs Work", color: "text-red-400", border: "border-red-500/30", bg: "bg-red-500/10" };
}

/* Main Page Component */
export default function ResumeReviewPage() {
    const router = useRouter();
    const { user, loading } = useAuthListener();
    const { isDark } = useTheme();

    const [dragging, setDragging] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [jobRole, setJobRole] = useState("Software Engineer");
    const [analyzing, setAnalyzing] = useState(false);
    const [analysis, setAnalysis] = useState<ResumeAnalysis | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [history, setHistory] = useState<StoredReview | null>(null);
    const [showHistory, setShowHistory] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (!loading && !user) router.push("/signup");
    }, [user, loading, router]);

    useEffect(() => {
        async function fetchHistory() {
            if (!user) return;
            try {
                const docRef = doc(db, "users", user.uid, "activity", "latest_resume");
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) setHistory(docSnap.data() as StoredReview);
            } catch (err) {
                console.warn("Could not load resume history from Firebase", err);
            }
        }
        fetchHistory();
    }, [user]);

    if (loading || !user) return null;

    /* Theme tokens */
    const t = {
        heading: isDark ? "text-white" : "text-gray-900",
        sub: isDark ? "text-gray-400" : "text-gray-500",
        card: isDark ? "bg-[#141b2d] border-white/5" : "bg-white border-gray-200 shadow-sm",
        input: isDark
            ? "bg-white/5 border-white/10 text-white placeholder-gray-500 focus:border-blue-500/50"
            : "bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:border-blue-400",
        dropzone: dragging
            ? isDark ? "border-blue-400 bg-blue-500/10" : "border-blue-400 bg-blue-50"
            : isDark ? "border-white/10 hover:border-blue-500/40 bg-white/[0.03]" : "border-gray-200 hover:border-blue-400 bg-gray-50",
        historyCard: isDark ? "bg-blue-500/[0.08] border-blue-500/20" : "bg-blue-50 border-blue-200",
        strengthRow: isDark ? "bg-emerald-500/[0.08] border-emerald-500/15" : "bg-emerald-50 border-emerald-100",
        improveRow: isDark ? "bg-amber-500/[0.08] border-amber-500/15" : "bg-amber-50 border-amber-100",
        keywordChip: isDark ? "bg-white/5 border-white/10 text-gray-300 hover:bg-white/10 hover:border-blue-500/40" : "bg-gray-100 border-gray-200 text-gray-600 hover:bg-blue-50 hover:border-blue-300",
    };

    function handleFiles(files: FileList | null) {
        if (!files || files.length === 0) return;
        const f = files[0];
        const allowed = ["application/pdf", "text/plain"];
        if (!allowed.includes(f.type) && !f.name.endsWith(".txt")) {
            setError("Please upload a PDF or TXT file.");
            return;
        }
        setFile(f);
        setError(null);
        setAnalysis(null);
        setShowHistory(false);
    }

    async function handleAnalyze() {
        if (!file || !user) return;
        setAnalyzing(true);
        setError(null);
        setAnalysis(null);
        setShowHistory(false);

        try {
            const form = new FormData();
            form.append("file", file);
            form.append("jobRole", jobRole.trim() || "Software Engineer");

            const res = await fetch("/api/analyze-resume", { method: "POST", body: form });
            const json = await res.json();

            if (!res.ok || json.error) {
                setError(json.error ?? "Analysis failed. Please try again.");
                return;
            }

            const result = json.analysis as ResumeAnalysis;
            setAnalysis(result);

            const stored: StoredReview = {
                fileName: file.name,
                jobRole: jobRole.trim() || "Software Engineer",
                timestamp: Date.now(),
                analysis: result,
            };
            setHistory(stored);

            try {
                const docRef = doc(db, "users", user.uid, "activity", "latest_resume");
                await setDoc(docRef, stored);
            } catch (err) {
                console.warn("Failed to persist history to Firebase:", err);
            }
        } catch (err) {
            console.error("Analysis process error:", err);
            setError("Network error. Please check your connection.");
        } finally {
            setAnalyzing(false);
        }
    }

    function handleReset() {
        setFile(null);
        setAnalysis(null);
        setError(null);
        setShowHistory(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
    }

    function loadHistory() {
        if (!history) return;
        setAnalysis(history.analysis);
        setJobRole(history.jobRole);
        setShowHistory(true);
        setFile(null);
    }

    const avg = analysis ? Math.round((analysis.atsScore + analysis.formattingScore) / 2) : 0;
    const grade = scoreGrade(avg);

    return (
        <div className="p-6 md:p-8 max-w-4xl mx-auto">

            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-1">
                    <div className="w-9 h-9 rounded-xl bg-violet-500/15 flex items-center justify-center">
                        <FileText size={18} className="text-violet-400" />
                    </div>
                    <h1 className={`text-2xl md:text-3xl font-bold ${t.heading}`}>Resume Review</h1>
                </div>
                <p className={`${t.sub} text-sm mt-1 ml-12`}>
                    Upload your resume and get an AI-powered ATS score and personalised suggestions.
                </p>
            </div>

            {/* History banner */}
            {history && !analysis && (
                <div
                    className={`${t.historyCard} border rounded-2xl p-4 mb-6 flex items-center gap-4`}
                    style={{ animation: "slideDown 0.4s ease" }}
                >
                    <div className="w-9 h-9 rounded-xl bg-blue-500/15 flex items-center justify-center flex-shrink-0">
                        <History size={16} className="text-blue-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className={`text-sm font-semibold ${t.heading}`}>Previous analysis available</p>
                        <p className={`text-xs ${t.sub} mt-0.5 truncate`}>
                            {history.fileName} · {history.jobRole} · {new Date(history.timestamp).toLocaleDateString()}
                        </p>
                    </div>
                    <button
                        onClick={loadHistory}
                        className="flex items-center gap-1.5 text-xs font-semibold text-blue-400 hover:text-blue-300 transition flex-shrink-0"
                    >
                        View <ChevronRight size={13} />
                    </button>
                </div>
            )}

            {/* Upload card */}
            {!analysis && !analyzing && (
                <div className={`${t.card} border rounded-2xl p-6 mb-6`} style={{ animation: "fadeUp 0.4s ease" }}>
                    <p className={`text-sm font-semibold ${t.heading} mb-4`}>Upload Resume</p>

                    {/* Job role */}
                    <div className="mb-4">
                        <label className={`text-xs font-semibold ${t.sub} uppercase tracking-widest mb-1.5 block`}>
                            Target Job Role
                        </label>
                        <input
                            type="text"
                            value={jobRole}
                            onChange={(e) => setJobRole(e.target.value)}
                            placeholder="e.g. Software Engineer, Data Scientist…"
                            className={`w-full px-4 py-2.5 rounded-xl border text-sm transition-colors outline-none ${t.input}`}
                        />
                    </div>

                    {/* Drop zone */}
                    <div
                        className={`relative border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all duration-200 ${t.dropzone}`}
                        onClick={() => fileInputRef.current?.click()}
                        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                        onDragLeave={() => setDragging(false)}
                        onDrop={(e) => { e.preventDefault(); setDragging(false); handleFiles(e.dataTransfer.files); }}
                    >
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".pdf,.txt"
                            className="hidden"
                            onChange={(e) => handleFiles(e.target.files)}
                        />
                        {file ? (
                            <div className="flex flex-col items-center gap-3">
                                <div className="w-12 h-12 rounded-2xl bg-violet-500/15 flex items-center justify-center">
                                    <FileText size={22} className="text-violet-400" />
                                </div>
                                <div>
                                    <p className={`text-sm font-semibold ${t.heading}`}>{file.name}</p>
                                    <p className={`text-xs ${t.sub} mt-1`}>{(file.size / 1024).toFixed(1)} KB · Ready to analyse</p>
                                </div>
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleReset(); }}
                                    className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 transition"
                                >
                                    <X size={12} /> Remove
                                </button>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center gap-3">
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-200 ${dragging ? "bg-blue-500/20 scale-110" : "bg-white/5"}`}>
                                    <Upload size={22} className={`transition-colors duration-200 ${dragging ? "text-blue-400" : "text-gray-400"}`} />
                                </div>
                                <div>
                                    <p className={`text-sm font-semibold ${t.heading}`}>
                                        {dragging ? "Drop it here!" : "Drop your resume here"}
                                    </p>
                                    <p className={`text-xs ${t.sub} mt-1`}>PDF or TXT · Max 5 MB</p>
                                </div>
                                <span className="text-xs text-blue-400 font-medium">or click to browse</span>
                            </div>
                        )}
                    </div>

                    {error && (
                        <div className="flex items-center gap-2 mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20"
                            style={{ animation: "fadeUp 0.3s ease" }}>
                            <AlertTriangle size={14} className="text-red-400 flex-shrink-0" />
                            <p className="text-xs text-red-400">{error}</p>
                        </div>
                    )}

                    <button
                        onClick={handleAnalyze}
                        disabled={!file || analyzing}
                        className="shimmer-btn w-full mt-5 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 rounded-xl text-sm font-semibold shadow-lg shadow-blue-600/20 hover:scale-[1.01] transition-transform"
                    >
                        <Sparkles size={16} /> Analyse Resume
                    </button>
                </div>
            )}

            {/* Loading skeleton */}
            {analyzing && (
                <div style={{ animation: "fadeUp 0.4s ease" }}>
                    <div className={`${t.card} border rounded-2xl p-6 mb-5`}>
                        <div className="flex items-center gap-3 mb-6">
                            <Loader2 size={18} className="text-blue-400 animate-spin" />
                            <p className={`text-sm font-semibold ${t.heading}`}>Analysing your resume…</p>
                        </div>
                        <AnalysingSkeleton />
                    </div>
                </div>
            )}

            {/* Results */}
            {analysis && !analyzing && (
                <div className="space-y-5">
                    {/* Header bar */}
                    <div className="flex items-center justify-between" style={{ animation: "fadeUp 0.3s ease" }}>
                        <div className="flex items-center gap-2">
                            {showHistory && (
                                <span className="flex items-center gap-1 text-xs font-semibold text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2.5 py-1 rounded-lg">
                                    <History size={11} /> Previous analysis
                                </span>
                            )}
                        </div>
                        <button
                            onClick={handleReset}
                            className={`flex items-center gap-1.5 text-xs font-semibold ${t.sub} hover:text-blue-400 transition`}
                        >
                            <RotateCcw size={13} /> New Upload
                        </button>
                    </div>

                    {/* Score card */}
                    <FadeIn delay={50}>
                        <div className={`${t.card} border rounded-2xl p-6 card-hover`}>
                            <div className="flex flex-col sm:flex-row items-center gap-8 sm:gap-12">
                                <div className="flex items-center gap-8">
                                    <ScoreRing score={analysis.atsScore} label="ATS Score" color="#3b82f6" />
                                    <ScoreRing score={analysis.formattingScore} label="Format" color="#a78bfa" />
                                </div>
                                <div className="flex-1 text-center sm:text-left">
                                    <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg border text-sm font-bold mb-3 ${grade.bg} ${grade.border} ${grade.color}`}>
                                        <Zap size={13} />
                                        {grade.label}
                                    </div>
                                    <p className={`text-sm ${t.sub} leading-relaxed`}>{analysis.summary}</p>
                                </div>
                            </div>
                        </div>
                    </FadeIn>

                    {/* Strengths */}
                    <FadeIn delay={150}>
                        <div className={`${t.card} border rounded-2xl p-6 card-hover`}>
                            <div className="flex items-center gap-2 mb-4">
                                <CheckCircle2 size={16} className="text-emerald-400" />
                                <h2 className={`text-sm font-semibold ${t.heading}`}>Strengths</h2>
                            </div>
                            <div className="space-y-2.5">
                                {analysis.strengths.map((s, i) => (
                                    <div
                                        key={i}
                                        className={`flex items-start gap-3 p-3 rounded-xl border ${t.strengthRow}`}
                                        style={{ animation: `fadeUp 0.4s ease ${i * 80}ms both` }}
                                    >
                                        <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                                            <span className="text-[10px] font-bold text-emerald-400">{i + 1}</span>
                                        </div>
                                        <p className={`text-sm ${t.heading}`}>{s}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </FadeIn>

                    {/* Improvements */}
                    <FadeIn delay={250}>
                        <div className={`${t.card} border rounded-2xl p-6 card-hover`}>
                            <div className="flex items-center gap-2 mb-4">
                                <TrendingUp size={16} className="text-amber-400" />
                                <h2 className={`text-sm font-semibold ${t.heading}`}>Areas to Improve</h2>
                            </div>
                            <div className="space-y-2.5">
                                {analysis.improvements.map((item, i) => (
                                    <div
                                        key={i}
                                        className={`flex items-start gap-3 p-3 rounded-xl border ${t.improveRow}`}
                                        style={{ animation: `fadeUp 0.4s ease ${i * 80}ms both` }}
                                    >
                                        <div className="w-5 h-5 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                                            <span className="text-[10px] font-bold text-amber-400">{i + 1}</span>
                                        </div>
                                        <p className={`text-sm ${t.heading}`}>{item}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </FadeIn>

                    {/* Keyword gaps */}
                    {analysis.keywordGaps.length > 0 && (
                        <FadeIn delay={350}>
                            <div className={`${t.card} border rounded-2xl p-6 card-hover`}>
                                <div className="flex items-center gap-2 mb-4">
                                    <Target size={16} className="text-blue-400" />
                                    <h2 className={`text-sm font-semibold ${t.heading}`}>Missing Keywords</h2>
                                    <span className={`text-xs ${t.sub} ml-auto`}>Add these to improve ATS ranking</span>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {analysis.keywordGaps.map((kw, i) => (
                                        <span
                                            key={kw}
                                            className={`chip-hover text-xs font-medium px-3 py-1.5 rounded-lg border cursor-default ${t.keywordChip}`}
                                            style={{ animation: `fadeUp 0.35s ease ${i * 50}ms both` }}
                                        >
                                            {kw}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </FadeIn>
                    )}

                    {/* Next steps */}
                    <FadeIn delay={450}>
                        <div className="flex items-start gap-4 p-5 rounded-2xl bg-gradient-to-r from-blue-600/10 to-violet-600/10 border border-blue-500/20 card-hover">
                            <div className="w-9 h-9 rounded-xl bg-blue-500/15 flex items-center justify-center flex-shrink-0">
                                <Sparkles size={16} className="text-blue-400" />
                            </div>
                            <div>
                                <p className={`text-sm font-semibold ${t.heading} mb-1`}>Recommended Next Step</p>
                                <p className={`text-sm ${t.sub} leading-relaxed`}>{analysis.nextSteps}</p>
                            </div>
                        </div>
                    </FadeIn>

                    {/* Re-analyse CTA */}
                    <FadeIn delay={520}>
                        <button
                            onClick={handleReset}
                            className="shimmer-btn w-full flex items-center justify-center gap-2 text-white py-3 rounded-xl text-sm font-semibold shadow-lg shadow-blue-600/20 hover:scale-[1.01] transition-transform"
                        >
                            <RotateCcw size={15} /> Analyse Another Resume
                        </button>
                    </FadeIn>

                </div>
            )}
        </div>
    );
}