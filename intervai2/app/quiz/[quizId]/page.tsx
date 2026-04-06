"use client";

import { Suspense, use, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthListener, useTheme } from "@/lib/auth";
import { db } from "@/lib/firebase";
import { collection, addDoc } from "firebase/firestore";
import { getQuiz } from "@/lib/quizData";
import type { Level, Question } from "@/lib/quizData";
import { recordActivity } from "@/app/components/ui/StreakHeatmap";
import {
  ChevronLeft, ChevronRight, CheckCircle2, XCircle,
  Trophy, RotateCcw, LayoutGrid, BookOpen,
} from "lucide-react";

type Phase = "intro" | "quiz" | "result";

interface AnswerRecord {
  question: Question;
  chosen: number | null;
  correct: boolean;
}

// Level colours
const LEVEL_META: Record<Level, { label: string; color: string; bg: string }> = {
  easy:   { label: "Easy",   color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/30" },
  medium: { label: "Medium", color: "text-amber-400",   bg: "bg-amber-500/10   border-amber-500/30"   },
  hard:   { label: "Hard",   color: "text-red-400",     bg: "bg-red-500/10     border-red-500/30"     },
};

// Grade helper
function grade(score: number, total: number) {
  const pct = score / total;
  if (pct === 1)   return { label: "Perfect! 🏆",       color: "text-yellow-400" };
  if (pct >= 0.8)  return { label: "Excellent! 🎉",     color: "text-emerald-400" };
  if (pct >= 0.6)  return { label: "Good Job! 👍",       color: "text-blue-400" };
  if (pct >= 0.4)  return { label: "Keep Practicing 📚", color: "text-amber-400" };
  return           { label: "Needs Work 💪",             color: "text-red-400" };
}

function QuizSession({ params }: { params: Promise<{ quizId: string }> }) {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const { user, loading } = useAuthListener();
  const { isDark } = useTheme();

  const { quizId } = use(params);
  const level  = (searchParams.get("level") ?? "easy") as Level;
  const quiz   = getQuiz(quizId);
  const questions = quiz?.questions[level] ?? [];

  const [phase,      setPhase]  = useState<Phase>("intro");
  const [current,    setCurrent] = useState(0);
  const [chosen,     setChosen]  = useState<number | null>(null);
  const [revealed,   setRevealed] = useState(false);
  const [answers,    setAnswers]  = useState<AnswerRecord[]>([]);
  const streakRecorded = useRef(false);

  useEffect(() => {
    if (!loading && !user) router.push("/signup");
  }, [user, loading, router]);

  // Record activity once on results screen
  useEffect(() => {
    if (phase === "result" && user && !streakRecorded.current) {
      streakRecorded.current = true;
      recordActivity(user.uid).catch(console.error);

      // Save quiz score for Analytics
      const score = answers.filter((a) => a.correct).length;
      addDoc(collection(db, "quizResults"), {
        userId: user.uid,
        domain: quizId,
        level,
        score,
        totalQuestions: questions.length,
        createdAt: new Date()
      }).catch(console.error);
    }
  }, [phase, user, answers, quizId, level, questions.length]);

  if (loading || !user) return null;
  if (!quiz) {
    return (
      <div className={`min-h-screen ${isDark ? "bg-[#0f1629] text-white" : "bg-[#f0f4ff] text-gray-900"} flex items-center justify-center`}>
        <div className="text-center space-y-4">
          <p className="text-2xl font-bold">Quiz not found</p>
          <button onClick={() => router.push("/quiz")} className="text-blue-400 hover:text-blue-300 text-sm">← Back to Quizzes</button>
        </div>
      </div>
    );
  }

  const levelMeta   = LEVEL_META[level];
  const q           = questions[current];
  const totalQ      = questions.length;
  const score       = answers.filter((a) => a.correct).length;

  const t = {
    pageBg:  isDark ? "bg-[#0f1629]" : "bg-[#f0f4ff]",
    card:    isDark ? "bg-[#141b2d] border-white/5 card-hover"   : "bg-white border-gray-200 shadow-sm card-hover",
    heading: isDark ? "text-white"   : "text-gray-900",
    sub:     isDark ? "text-gray-400" : "text-gray-500",
    back:    isDark ? "text-gray-400 hover:text-white" : "text-gray-500 hover:text-gray-900",
    optBase: isDark
      ? "border-white/10 hover:border-blue-400/50 hover:bg-blue-500/5 text-gray-200"
      : "border-gray-200 hover:border-blue-400 hover:bg-blue-50 text-gray-700",
  };

  // Handlers
  const handleChoose = (idx: number) => {
    if (revealed) return;
    setChosen(idx);
    setRevealed(true);
    setAnswers((prev) => [
      ...prev,
      { question: q, chosen: idx, correct: idx === q.correctIndex },
    ]);
  };

  const handleNext = () => {
    if (current + 1 < totalQ) {
      setCurrent((c) => c + 1);
      setChosen(null);
      setRevealed(false);
    } else {
      setPhase("result");
    }
  };

  const handleRetake = () => {
    setPhase("intro");
    setCurrent(0);
    setChosen(null);
    setRevealed(false);
    setAnswers([]);
    streakRecorded.current = false;
  };

  // Option styling
  const optionStyle = (idx: number): string => {
    if (!revealed) return `border ${t.optBase} rounded-xl px-4 py-3 text-sm font-medium transition-all cursor-pointer`;
    if (idx === q.correctIndex) return "border border-emerald-500/60 bg-emerald-500/10 rounded-xl px-4 py-3 text-sm font-semibold text-emerald-400 cursor-default";
    if (idx === chosen && idx !== q.correctIndex) return "border border-red-500/60 bg-red-500/10 rounded-xl px-4 py-3 text-sm font-semibold text-red-400 cursor-default";
    return `border ${isDark ? "border-white/5" : "border-gray-100"} rounded-xl px-4 py-3 text-sm ${t.sub} cursor-default opacity-50`;
  };


  // INTRO PHASE

  if (phase === "intro") {
    return (
      <div className={`min-h-screen ${t.pageBg} flex items-center justify-center p-6 transition-colors`}>
        <div className={`${t.card} border rounded-2xl p-8 max-w-md w-full space-y-6`} style={{ animation: "fadeUp 0.4s ease both" }}>
          {/* Back */}
          <button onClick={() => router.push("/quiz")} className={`flex items-center gap-1.5 text-sm ${t.back} transition`}>
            <ChevronLeft size={16} /> All Quizzes
          </button>

          {/* Icon + title */}
          <div className="text-center space-y-3">
            <div className={`w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br ${quiz.gradient} border border-white/10 flex items-center justify-center text-4xl`}>
              {quiz.icon}
            </div>
            <div>
              <h1 className={`text-2xl font-bold ${t.heading}`}>{quiz.title}</h1>
              <p className={`text-sm ${t.sub} mt-1`}>{quiz.description}</p>
            </div>
          </div>

          {/* Meta pills */}
          <div className="flex justify-center gap-3 flex-wrap">
            <span className={`px-3 py-1.5 rounded-full border text-xs font-semibold ${levelMeta.bg} ${levelMeta.color}`}>
              {levelMeta.label} Level
            </span>
            <span className={`px-3 py-1.5 rounded-full border text-xs font-semibold ${isDark ? "border-white/10 text-gray-300 bg-white/5" : "border-gray-200 text-gray-600 bg-gray-50"}`}>
              5 Questions
            </span>
            <span className={`px-3 py-1.5 rounded-full border text-xs font-semibold ${isDark ? "border-white/10 text-gray-300 bg-white/5" : "border-gray-200 text-gray-600 bg-gray-50"}`}>
              4 Options each
            </span>
          </div>

          {/* Info */}
          <div className={`${isDark ? "bg-blue-500/5 border-blue-500/15" : "bg-blue-50 border-blue-200"} border rounded-xl p-4 text-xs ${t.sub} space-y-1`}>
            <p>✅ Each question has one correct answer</p>
            <p>📖 You&apos;ll see an explanation after each answer</p>
            <p>🔥 Completing this quiz will update your streak!</p>
          </div>

          {/* Start */}
          <button
            onClick={() => setPhase("quiz")}
            className="shimmer-btn w-full bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-xl font-semibold text-sm transition-transform hover:scale-[1.02] shadow-lg shadow-blue-600/25 flex items-center justify-center gap-2"
          >
            <BookOpen size={16} /> Start Quiz
          </button>
        </div>
      </div>
    );
  }


  // QUIZ PHASE

  if (phase === "quiz") {
    const progress = ((current) / totalQ) * 100;

    return (
      <div className={`min-h-screen ${t.pageBg} flex items-center justify-center p-6 transition-colors`}>
        <div className={`${t.card} border rounded-2xl p-6 md:p-8 max-w-2xl w-full space-y-6`} style={{ animation: "fadeUp 0.3s ease both" }}>

          {/* Top bar */}
          <div className="flex items-center justify-between">
            <button onClick={() => router.push("/quiz")} className={`flex items-center gap-1.5 text-sm ${t.back} transition`}>
              <ChevronLeft size={15} /> Exit
            </button>
            <div className="flex items-center gap-2">
              <span className={`text-xl`}>{quiz.icon}</span>
              <span className={`text-sm font-semibold ${t.heading}`}>{quiz.title}</span>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${levelMeta.bg} ${levelMeta.color}`}>{levelMeta.label}</span>
            </div>
            <span className={`text-sm font-bold ${t.heading}`}>Q {current + 1} <span className={`font-normal ${t.sub}`}>/ {totalQ}</span></span>
          </div>

          {/* Progress bar */}
          <div className={`w-full h-1.5 rounded-full ${isDark ? "bg-white/5" : "bg-gray-100"} overflow-hidden`}>
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-full transition-all duration-500"
              style={{ width: `${progress + (revealed ? 100 / totalQ : 0)}%` }}
            />
          </div>

          {/* Question */}
          <div className="space-y-2">
            <p className={`text-[11px] font-bold uppercase tracking-widest ${t.sub}`}>Question {current + 1}</p>
            <h2 className={`text-lg md:text-xl font-bold ${t.heading} leading-snug`}>{q.text}</h2>
          </div>

          {/* Options */}
          <div className="space-y-3">
            {q.options.map((opt, idx) => (
              <button
                key={`${current}-${idx}`}
                onClick={() => handleChoose(idx)}
                className={`w-full text-left flex items-center gap-3 chip-hover ${optionStyle(idx)}`}
                style={{ animation: `fadeUp 0.3s ease ${idx * 60}ms both` }}
              >
                {/* Letter badge */}
                <span className={`w-7 h-7 rounded-lg flex-shrink-0 flex items-center justify-center text-xs font-bold ${
                  revealed && idx === q.correctIndex ? "bg-emerald-500/20 text-emerald-400"
                  : revealed && idx === chosen && idx !== q.correctIndex ? "bg-red-500/20 text-red-400"
                  : isDark ? "bg-white/5 text-gray-400" : "bg-gray-100 text-gray-500"
                }`}>
                  {["A","B","C","D"][idx]}
                </span>
                <span className="flex-1">{opt}</span>
                {revealed && idx === q.correctIndex && <CheckCircle2 size={16} className="text-emerald-400 flex-shrink-0" />}
                {revealed && idx === chosen && idx !== q.correctIndex && <XCircle size={16} className="text-red-400 flex-shrink-0" />}
              </button>
            ))}
          </div>

          {/* Explanation */}
          {revealed && (
            <div className={`${isDark ? "bg-blue-500/5 border-blue-500/15" : "bg-blue-50 border-blue-200"} border rounded-xl p-4 text-sm ${t.sub} leading-relaxed`}>
              <span className="font-semibold text-blue-400">Explanation: </span>{q.explanation}
            </div>
          )}

          {/* Next button */}
          {revealed && (
            <button
               onClick={handleNext}
               style={{ animation: "slideDown 0.3s ease both" }}
               className="shimmer-btn w-full bg-blue-600 text-white py-3 rounded-xl font-semibold text-sm transition-transform hover:scale-[1.02] shadow-lg shadow-blue-600/25 flex items-center justify-center gap-2"
            >
              {current + 1 < totalQ ? (<>Next Question <ChevronRight size={16} /></>) : (<>See Results <Trophy size={16} /></>)}
            </button>
          )}
        </div>
      </div>
    );
  }


  // RESULT PHASE

  const { label: gradeLabel, color: gradeColor } = grade(score, totalQ);
  const pct = Math.round((score / totalQ) * 100);

  return (
    <div className={`min-h-screen ${t.pageBg} flex items-start justify-center p-6 py-12 transition-colors`}>
      <div className="max-w-2xl w-full space-y-6">

        {/* Score card */}
        <div className={`${t.card} border rounded-2xl p-8 text-center space-y-4`} style={{ animation: "fadeUp 0.4s ease both" }}>
          <div className={`text-3xl font-bold ${gradeColor}`}>{gradeLabel}</div>

          {/* Circular score */}
          <div className="relative w-32 h-32 mx-auto">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="54" fill="none" stroke={isDark ? "rgba(255,255,255,0.05)" : "#e5e7eb"} strokeWidth="12" />
              <circle
                cx="60" cy="60" r="54" fill="none"
                stroke="url(#scoreGrad)" strokeWidth="12"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 54}`}
                strokeDashoffset={`${2 * Math.PI * 54 * (1 - pct / 100)}`}
                className="transition-all duration-1000"
              />
              <defs>
                <linearGradient id="scoreGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#3b82f6" />
                  <stop offset="100%" stopColor="#8b5cf6" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`text-3xl font-bold ${t.heading}`}>{score}/{totalQ}</span>
              <span className={`text-xs ${t.sub}`}>{pct}%</span>
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-4 pt-2">
            {[
              { label: "Correct",   value: score,         color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" },
              { label: "Incorrect", value: totalQ - score, color: "text-red-400",     bg: "bg-red-500/10    border-red-500/20"     },
              { label: "Score",     value: `${pct}%`,     color: "text-blue-400",    bg: "bg-blue-500/10   border-blue-500/20"    },
            ].map(({ label, value, color, bg }) => (
              <div key={label} className={`${bg} border rounded-xl p-3`}>
                <p className={`text-xl font-bold ${color}`}>{value}</p>
                <p className={`text-xs ${t.sub} mt-0.5`}>{label}</p>
              </div>
            ))}
          </div>

          {/* Streak notice */}
          <p className="text-xs text-orange-400 mt-2 flex items-center justify-center gap-1">
            🔥 Today&apos;s streak updated! Check your <a href="/dashboard/streaks" className="underline hover:text-orange-300">Streaks</a> page.
          </p>

          {/* CTA buttons */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={handleRetake}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold border transition-all ${isDark ? "border-white/10 text-gray-300 hover:bg-white/5" : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}
            >
              <RotateCcw size={15} /> Retake
            </button>
            <button
              onClick={() => router.push("/quiz")}
              className="shimmer-btn flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white py-3 rounded-xl text-sm font-semibold transition-transform hover:scale-[1.02] shadow-lg shadow-blue-600/25"
            >
              <LayoutGrid size={15} /> All Quizzes
            </button>
          </div>
        </div>

        {/* Per-question review */}
        <div className={`${t.card} border rounded-2xl p-6 space-y-4`} style={{ animation: "fadeUp 0.4s ease 200ms both" }}>
          <h2 className={`text-base font-bold ${t.heading}`}>Question Review</h2>
          {answers.map((ans, i) => (
            <div key={i} style={{ animation: `slideDown 0.3s ease ${300 + (i * 80)}ms both` }} className={`border rounded-xl p-4 space-y-2 ${ans.correct ? (isDark ? "border-emerald-500/20 bg-emerald-500/5" : "border-emerald-300 bg-emerald-50") : (isDark ? "border-red-500/20 bg-red-500/5" : "border-red-200 bg-red-50")}`}>
              <div className="flex items-start gap-2">
                {ans.correct
                  ? <CheckCircle2 size={16} className="text-emerald-400 flex-shrink-0 mt-0.5" />
                  : <XCircle size={16} className="text-red-400 flex-shrink-0 mt-0.5" />}
                <p className={`text-sm font-medium ${t.heading} leading-snug`}>{ans.question.text}</p>
              </div>

              <div className="ml-6 space-y-1 text-xs">
                <p className={`${ans.correct ? "text-emerald-400" : "text-red-400"}`}>
                  Your answer: <span className="font-semibold">{ans.chosen !== null ? ans.question.options[ans.chosen] : "—"}</span>
                </p>
                {!ans.correct && (
                  <p className="text-emerald-400">
                    Correct answer: <span className="font-semibold">{ans.question.options[ans.question.correctIndex]}</span>
                  </p>
                )}
                <p className={`${t.sub} leading-relaxed pt-0.5`}>💡 {ans.question.explanation}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function QuizSessionPage({ params }: { params: Promise<{ quizId: string }> }) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0f1629] flex items-center justify-center"><div className="w-8 h-8 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" /></div>}>
      <QuizSession params={params} />
    </Suspense>
  );
}
