"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { predefinedQuestions } from "@/lib/interview/predefinedQuestions";
import { buildCandidateProfile, profileToText } from "@/lib/interview/buildCandidateProfile";
import { generateInterviewQuestions } from "@/lib/ai/generateInterviewQuestions";
import { useSpeechRecognition } from "@/lib/speech/useSpeechRecognition";
import { useSpeechSynthesis } from "@/lib/speech/useSpeechSynthesis";
import { saveProfile } from "@/firebase/saveProfile";
import { saveSession } from "@/firebase/saveSession";
import type { CandidateProfile } from "@/lib/interview/buildCandidateProfile";
import type { TranscriptEntry } from "@/firebase/saveSession";

// ─── Stage type ───────────────────────────────────────────────────────────────
type Stage = "intro" | "loading" | "interview" | "finished";

// ─── Inline icons ─────────────────────────────────────────────────────────────
const MicIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7">
    <path d="M12 1a4 4 0 0 0-4 4v7a4 4 0 0 0 8 0V5a4 4 0 0 0-4-4Z" />
    <path d="M19 11a1 1 0 0 0-2 0 5 5 0 0 1-10 0 1 1 0 0 0-2 0 7 7 0 0 0 6 6.92V20H9a1 1 0 0 0 0 2h6a1 1 0 0 0 0-2h-2v-2.08A7 7 0 0 0 19 11Z" />
  </svg>
);
const MicOffIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7">
    <path d="M14.5 11.3 8 4.8A4 4 0 0 1 16 5v6a3.9 3.9 0 0 1-.5 1.9 1 1 0 0 0-.5-.6ZM5 3 3.71 1.71a1 1 0 0 0-1.42 1.42l1.28 1.28A6.93 6.93 0 0 0 5 11a1 1 0 0 0 2 0 4.94 4.94 0 0 1-.21-1.41l8.9 8.9A6.94 6.94 0 0 1 13 19.92V22h2a1 1 0 0 1 0 2H9a1 1 0 0 1 0-2h2v-2.08A7 7 0 0 1 5 11a1 1 0 0 1 2 0 4.93 4.93 0 0 0 .11 1L5 9.88V5.41l-.71-.7A3.91 3.91 0 0 1 8 5v.59l2 2V5a4 4 0 0 1 4 4v.59l1.71 1.71c.19-.41.29-.85.29-1.3ZM5.12 13.42A7 7 0 0 0 11 17.92V22H9a1 1 0 0 0 0 2h6a1 1 0 0 0 0-2h-2v-2.08a7 7 0 0 0 5.88-6.5 1 1 0 0 0-2-.18 5 5 0 0 1-9.47 1.68 1 1 0 1 0-1.79.9Z" />
  </svg>
);
const SunIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" />
  </svg>
);
const MoonIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
    <path d="M21 12.79A9 9 0 1 1 11.21 3a7 7 0 0 0 9.79 9.79Z" />
  </svg>
);
const BotIcon = ({ size = "lg" }: { size?: "sm" | "lg" }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={size === "lg" ? "w-12 h-12 text-blue-400" : "w-7 h-7 text-blue-400"}>
    <path d="M12 2a2 2 0 1 1 0 4 2 2 0 0 1 0-4ZM21 10H3a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1h1v5a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-5h1a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1Zm-3 8H6v-7h12v7Zm-6-5a1 1 0 1 0 0 2 1 1 0 0 0 0-2Z" />
  </svg>
);
const ArrowRightIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M12 5l7 7-7 7" />
  </svg>
);

// ─── Main Component ───────────────────────────────────────────────────────────
export default function InterviewPage() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Auth
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // ── Stage state ──────────────────────────────────────────────────────────────
  const [stage, setStage] = useState<Stage>("intro");

  // ── STAGE 1: Intro ───────────────────────────────────────────────────────────
  const [introIndex, setIntroIndex] = useState(0);
  const [introAnswers, setIntroAnswers] = useState<string[]>([]);
  const [introChatLog, setIntroChatLog] = useState<TranscriptEntry[]>([]);
  const [introBuffer, setIntroBuffer] = useState("");

  // ── STAGE 2: Loading ─────────────────────────────────────────────────────────
  const [loadingStatus, setLoadingStatus] = useState("Analysing your profile…");

  // ── STAGE 3: Interview ───────────────────────────────────────────────────────
  const [profile, setProfile] = useState<CandidateProfile | null>(null);
  const [profileId, setProfileId] = useState<string>("");
  const [aiQuestions, setAiQuestions] = useState<string[]>([]);
  const [interviewIndex, setInterviewIndex] = useState(0);
  const [interviewAnswers, setInterviewAnswers] = useState<string[]>([]);
  const [interviewLog, setInterviewLog] = useState<TranscriptEntry[]>([]);
  const [interviewBuffer, setInterviewBuffer] = useState("");
  const [aiIsSpeaking, setAiIsSpeaking] = useState(false);

  // ── STAGE 4: Finished ────────────────────────────────────────────────────────
  const [isSaving, setIsSaving] = useState(false);
  const [savedSessionId, setSavedSessionId] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  // ── Timer ────────────────────────────────────────────────────────────────────
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Scroll refs ──────────────────────────────────────────────────────────────
  const introChatEndRef = useRef<HTMLDivElement>(null);
  const interviewChatEndRef = useRef<HTMLDivElement>(null);

  // ── Speech hooks ─────────────────────────────────────────────────────────────
  const {
    transcript: speechTranscript,
    interimTranscript,
    isListening,
    isSupported: speechInputSupported,
    startListening,
    stopListening,
    resetTranscript,
  } = useSpeechRecognition();

  const {
    isSpeaking,
    speak,
    cancel: cancelSpeech,
  } = useSpeechSynthesis();

  // ── Hydration guard ──────────────────────────────────────────────────────────
  useEffect(() => setMounted(true), []);

  // ── Auth guard ───────────────────────────────────────────────────────────────
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthLoading(false);
      if (!u) router.replace("/login");
    });
    return unsub;
  }, [router]);

  // ── Timer ────────────────────────────────────────────────────────────────────
  const startTimer = useCallback(() => {
    timerRef.current = setInterval(() => setElapsed((s) => s + 1), 1000);
  }, []);
  const stopTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
  }, []);
  const formatTime = (s: number) => {
    const m = Math.floor(s / 60).toString().padStart(2, "0");
    const sec = (s % 60).toString().padStart(2, "0");
    return `${m}:${sec}`;
  };

  // ── Kick off intro when authed ────────────────────────────────────────────────
  useEffect(() => {
    if (!authLoading && user) {
      setIntroChatLog([{ role: "ai", text: predefinedQuestions[0].question }]);
      startTimer();
      // Speak first question
      speak(predefinedQuestions[0].question);
    }
    return () => {
      stopTimer();
      cancelSpeech();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user]);

  // ── Sync speech transcript into current buffer ────────────────────────────────
  useEffect(() => {
    if (stage === "intro") setIntroBuffer(speechTranscript);
    if (stage === "interview") setInterviewBuffer(speechTranscript);
  }, [speechTranscript, stage]);

  // ── Scroll to bottom ─────────────────────────────────────────────────────────
  useEffect(() => {
    introChatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [introChatLog, interimTranscript]);
  useEffect(() => {
    interviewChatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [interviewLog, interimTranscript]);

  // ── Mic toggle ───────────────────────────────────────────────────────────────
  const handleMicToggle = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      cancelSpeech(); // stop AI speaking if mic pressed
      startListening();
    }
  }, [isListening, startListening, stopListening, cancelSpeech]);

  // ────────────────────────────────────────────────────────────────────────────
  // STAGE 1: Next intro question
  // ────────────────────────────────────────────────────────────────────────────
  const handleIntroNext = useCallback(async () => {
    if (isListening) stopListening();

    // Merge finalized transcript + any still-pending interim text.
    // Chrome only marks results as `isFinal` after a silence pause, so if the
    // user clicks Next mid-sentence the answer would otherwise be empty.
    const combined = [introBuffer, interimTranscript].filter(Boolean).join(" ");
    const answer = combined.trim() || "(no answer provided)";
    const newAnswers = [...introAnswers, answer];
    setIntroAnswers(newAnswers);

    const updatedLog: TranscriptEntry[] = [
      ...introChatLog,
      { role: "user", text: answer },
    ];
    setIntroChatLog(updatedLog);
    setIntroBuffer("");
    resetTranscript();

    const nextIndex = introIndex + 1;

    if (nextIndex >= predefinedQuestions.length) {
      // ── All intro questions done → move to loading stage ─────────────────────
      cancelSpeech();
      setStage("loading");
      await runLoadingStage(newAnswers);
    } else {
      setIntroIndex(nextIndex);
      const nextQ = predefinedQuestions[nextIndex].question;
      setIntroChatLog((prev) => [...prev, { role: "ai", text: nextQ }]);
      speak(nextQ);
    }
  }, [
    isListening, stopListening, introBuffer, interimTranscript, introAnswers,
    introChatLog, introIndex, cancelSpeech, speak, resetTranscript,
  ]);

  // ────────────────────────────────────────────────────────────────────────────
  // STAGE 2: Loading — build profile, save it, generate AI questions
  // ────────────────────────────────────────────────────────────────────────────
  const runLoadingStage = useCallback(
    async (answers: string[]) => {
      try {
        // Step 1: Build profile
        setLoadingStatus("Building your candidate profile…");
        const builtProfile = buildCandidateProfile(answers);
        setProfile(builtProfile);

        // Step 2: Save profile to Firestore
        setLoadingStatus("Saving your profile…");
        let pId = "";
        try {
          pId = await saveProfile({ userId: user!.uid, profile: builtProfile });
          setProfileId(pId);
        } catch (e) {
          console.warn("[Interview] Profile save failed, continuing:", e);
        }

        // Step 3: Generate AI questions via Gemini
        setLoadingStatus("Generating your personalised interview questions…");
        const profileText = profileToText(builtProfile);
        const questions = await generateInterviewQuestions(builtProfile);
        setAiQuestions(questions);

        // Step 4: Init interview log with first AI question
        const firstQ = questions[0];
        const initLog: TranscriptEntry[] = [{ role: "ai", text: firstQ }];
        setInterviewLog(initLog);

        // Step 5: Transition to interview stage
        setStage("interview");
        setAiIsSpeaking(true);
        speak(firstQ, () => {
          setAiIsSpeaking(false);
        });

        void profileText; // suppress unused var warning
      } catch (err) {
        console.error("[Interview] Loading stage error:", err);
        setLoadingStatus("Something went wrong. Please try again.");
      }
    },
    [user, speak]
  );

  // ────────────────────────────────────────────────────────────────────────────
  // STAGE 3: Next AI interview question
  // ────────────────────────────────────────────────────────────────────────────
  const handleInterviewNext = useCallback(async () => {
    if (isListening) stopListening();
    cancelSpeech();

    // Merge finalized transcript + any still-pending interim text.
    const combined = [interviewBuffer, interimTranscript].filter(Boolean).join(" ");
    const answer = combined.trim() || "(no answer provided)";
    const newAnswers = [...interviewAnswers, answer];
    setInterviewAnswers(newAnswers);

    const updatedLog: TranscriptEntry[] = [
      ...interviewLog,
      { role: "user", text: answer },
    ];
    setInterviewLog(updatedLog);
    setInterviewBuffer("");
    resetTranscript();

    const nextIndex = interviewIndex + 1;

    if (nextIndex >= aiQuestions.length) {
      // ── All AI questions answered → save and finish ────────────────────────
      stopTimer();
      setStage("finished");
      setIsSaving(true);

      try {
        const sessionId = await saveSession({
          userId: user!.uid,
          profileId,
          questions: aiQuestions,
          answers: newAnswers,
          transcript: updatedLog,
        });
        setSavedSessionId(sessionId);
      } catch (err: unknown) {
        const code = (err as { code?: string })?.code ?? "unknown";
        const msg =
          code === "permission-denied"
            ? "Firestore permission denied — check your security rules."
            : code === "not-found"
              ? "Firestore database not found — create it in Firebase Console."
              : `Save failed (${code}) — check the console for details.`;
        setSaveError(msg);
        console.error("[Interview] Session save failed:", err);
      } finally {
        setIsSaving(false);
      }
    } else {
      // ── Ask next AI question ──────────────────────────────────────────────
      setInterviewIndex(nextIndex);
      const nextQ = aiQuestions[nextIndex];
      setInterviewLog((prev) => [...prev, { role: "ai", text: nextQ }]);
      setAiIsSpeaking(true);
      speak(nextQ, () => setAiIsSpeaking(false));
    }
  }, [
    isListening, stopListening, cancelSpeech,
    interviewBuffer, interimTranscript, interviewAnswers, interviewLog,
    interviewIndex, aiQuestions,
    user, profileId, stopTimer, speak, resetTranscript,
  ]);

  // ── Render guard ─────────────────────────────────────────────────────────────
  if (!mounted || authLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#080d1a]">
        <div className="h-10 w-10 rounded-full border-4 border-blue-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  const isDark = theme === "dark";

  // ════════════════════════════════════════════════════════════════════════════
  // STAGE: LOADING
  // ════════════════════════════════════════════════════════════════════════════
  if (stage === "loading") {
    return (
      <div className={`flex h-screen flex-col items-center justify-center gap-10 px-6 ${isDark ? "bg-[#080d1a] text-white" : "bg-slate-50 text-slate-900"}`}>
        {/* Animated orb */}
        <div className="relative flex items-center justify-center">
          <div className="absolute h-40 w-40 animate-ping rounded-full bg-blue-500/10" />
          <div className="absolute h-28 w-28 animate-ping rounded-full bg-violet-500/15" style={{ animationDelay: "0.4s" }} />
          <div className={`relative flex h-24 w-24 items-center justify-center rounded-full border-4 border-blue-500/40 shadow-2xl ${isDark ? "bg-[#0e1829]" : "bg-white"}`}>
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
          </div>
        </div>

        <div className="text-center max-w-sm">
          <h1 className="text-2xl font-bold">Preparing Your Interview</h1>
          <p className="mt-3 text-slate-400 text-sm">{loadingStatus}</p>
          {/* Step dots */}
          <div className="mt-6 flex justify-center gap-2">
            {["Profile ready", "Generating questions", "Almost there!"].map((s, i) => (
              <div
                key={i}
                className="flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px]"
                style={{
                  background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)",
                  color: loadingStatus.toLowerCase().includes(["analy", "saving", "generat"][i] ?? "x") ? "#60a5fa" : "#64748b",
                }}
              >
                <span className="h-1.5 w-1.5 rounded-full bg-current" />
                {s}
              </div>
            ))}
          </div>
        </div>

        <p className={`text-xs ${isDark ? "text-slate-600" : "text-slate-400"}`}>
          All details confirmed. Generating your personalised interview session…
        </p>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════════════════════
  // STAGE: FINISHED
  // ════════════════════════════════════════════════════════════════════════════
  if (stage === "finished") {
    return (
      <div className={`flex h-screen flex-col items-center justify-center gap-8 px-6 ${isDark ? "bg-[#080d1a] text-white" : "bg-slate-50 text-slate-900"}`}>
        {/* Check animation */}
        <div className="relative flex h-32 w-32 items-center justify-center rounded-full bg-blue-600/20 ring-4 ring-blue-500/40">
          <div className="absolute inset-0 animate-ping rounded-full bg-blue-600/10" />
          <svg viewBox="0 0 24 24" fill="none" className="h-16 w-16 text-blue-400" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <div className="text-center">
          <h1 className="text-3xl font-bold">Interview Complete!</h1>
          <p className="mt-2 text-slate-400">
            {isSaving
              ? "Saving your session…"
              : savedSessionId
                ? "Your responses have been saved. The AI report is being generated."
                : ""}
          </p>
          {savedSessionId && (
            <p className="mt-1 text-xs text-slate-500">Session ID: {savedSessionId}</p>
          )}
          {saveError && (
            <div className="mt-3 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
              <p className="font-semibold">⚠ Save Failed</p>
              <p className="mt-1 text-xs">{saveError}</p>
            </div>
          )}
        </div>

        {/* Interview summary */}
        <div className={`w-full max-w-2xl rounded-2xl border p-6 overflow-y-auto max-h-60 ${isDark ? "border-white/10 bg-white/5" : "border-slate-200 bg-white"}`}>
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-widest text-blue-400">
            Interview Summary — {aiQuestions.length} Questions
          </h2>
          <div className="space-y-3 text-sm">
            {aiQuestions.map((q, i) => (
              <div key={i}>
                <p className="font-medium text-blue-300">Q{i + 1}: {q}</p>
                <p className="mt-0.5 text-slate-400">{interviewAnswers[i] ?? "(skipped)"}</p>
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={() => router.push("/dashboard")}
          className="rounded-full bg-blue-600 px-8 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-blue-500 active:scale-95"
        >
          Go to Dashboard
        </button>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════════════════════
  // SHARED LAYOUT (intro + interview stages)
  // ════════════════════════════════════════════════════════════════════════════
  const isIntro = stage === "intro";
  const currentIntroQ = predefinedQuestions[introIndex];
  const currentInterviewQ = aiQuestions[interviewIndex] ?? "";
  const currentQ = isIntro ? currentIntroQ?.question : currentInterviewQ;
  const currentCategory = isIntro ? (currentIntroQ?.category ?? "Intro") : "Technical";
  const totalQs = isIntro ? predefinedQuestions.length : aiQuestions.length;
  const currentIndex = isIntro ? introIndex : interviewIndex;
  const progress = Math.round((currentIndex / totalQs) * 100);
  const chatLog = isIntro ? introChatLog : interviewLog;
  const currentBuffer = isIntro ? introBuffer : interviewBuffer;
  const chatEndRef = isIntro ? introChatEndRef : interviewChatEndRef;
  const handleNext = isIntro ? handleIntroNext : handleInterviewNext;
  const isLastQ = currentIndex >= totalQs - 1;

  return (
    <div className={`flex h-screen flex-col transition-colors duration-300 ${isDark ? "bg-[#080d1a] text-white" : "bg-slate-100 text-slate-900"}`}>

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <header className={`flex h-14 shrink-0 items-center justify-between border-b px-5 ${isDark ? "border-white/10 bg-[#0b1120]" : "border-slate-200 bg-white"}`}>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5 text-blue-500">
              <path d="M3 9v6h4l5 5V4L7 9H3Zm13.5 3A4.5 4.5 0 0 0 14 7.97v8.05a4.48 4.48 0 0 0 2.5-4.02Z" />
            </svg>
            <span className="text-base font-bold tracking-tight">Intervai</span>
          </div>
          <span className="rounded-full bg-blue-600/20 px-2.5 py-0.5 text-[11px] font-semibold text-blue-400 ring-1 ring-blue-500/30">
            Live Session
          </span>
          {/* Stage badge */}
          <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1 ${isIntro
              ? "bg-emerald-600/20 text-emerald-400 ring-emerald-500/30"
              : "bg-violet-600/20 text-violet-400 ring-violet-500/30"
            }`}>
            {isIntro ? "Introduction" : "AI Interview"}
          </span>
        </div>

        <div className="flex items-center gap-4">
          <div className={`flex items-center gap-2 rounded-full px-3 py-1 text-sm font-mono font-semibold ${isDark ? "bg-white/5 text-slate-300" : "bg-slate-100 text-slate-700"}`}>
            <span className="h-2 w-2 animate-pulse rounded-full bg-blue-400" />
            {formatTime(elapsed)}
          </div>
          <button
            onClick={() => setTheme(isDark ? "light" : "dark")}
            className={`rounded-full p-2 transition hover:scale-110 ${isDark ? "bg-white/5 text-yellow-300 hover:bg-white/10" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
            aria-label="Toggle theme"
          >
            {isDark ? <SunIcon /> : <MoonIcon />}
          </button>
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-violet-500 text-xs font-bold text-white shadow-md">
            {user?.displayName?.[0]?.toUpperCase() ?? user?.email?.[0]?.toUpperCase() ?? "U"}
          </div>
        </div>
      </header>

      {/* ── Body ────────────────────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── LEFT PANEL ───────────────────────────────────────────────────── */}
        <div className={`flex w-5/12 flex-col items-center justify-center gap-8 px-8 ${isDark ? "bg-[#080d1a]" : "bg-slate-100"}`}>

          {/* Progress */}
          <div className="w-full max-w-xs">
            <div className="mb-1.5 flex justify-between text-[11px] text-slate-500">
              <span>Question {currentIndex + 1} of {totalQs}</span>
              <span className={`rounded px-1.5 ${isIntro ? "bg-emerald-600/20 text-emerald-400" : "bg-violet-600/20 text-violet-400"}`}>
                {currentCategory}
              </span>
            </div>
            <div className={`h-1 w-full overflow-hidden rounded-full ${isDark ? "bg-white/10" : "bg-slate-200"}`}>
              <div
                className={`h-full rounded-full transition-all duration-500 ${isIntro ? "bg-gradient-to-r from-emerald-500 to-blue-500" : "bg-gradient-to-r from-violet-500 to-blue-500"}`}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* AI Avatar */}
          <div className="relative flex items-center justify-center">
            {/* Rings when AI is speaking */}
            {(isSpeaking || aiIsSpeaking) && (
              <>
                <div className="absolute h-44 w-44 animate-ping rounded-full bg-violet-500/10" />
                <div className="absolute h-36 w-36 animate-ping rounded-full bg-blue-500/15" style={{ animationDelay: "0.3s" }} />
              </>
            )}
            {/* Rings when user is listening */}
            {isListening && (
              <>
                <div className="absolute h-44 w-44 animate-ping rounded-full bg-emerald-500/10" />
                <div className="absolute h-36 w-36 animate-ping rounded-full bg-emerald-500/20" style={{ animationDelay: "0.3s" }} />
              </>
            )}
            <div className="absolute h-36 w-36 rounded-full bg-blue-600/10 blur-xl" />
            <div className={`relative flex h-28 w-28 items-center justify-center rounded-full border-4 shadow-2xl transition-all duration-300 ${isSpeaking || aiIsSpeaking
                ? "border-violet-500/60 bg-violet-900/30"
                : isDark ? "border-blue-500/40 bg-[#0e1829]" : "border-blue-300 bg-white"
              }`}>
              <BotIcon size="lg" />
            </div>
          </div>

          {/* Status label */}
          <div className="flex items-center gap-2">
            {isSpeaking || aiIsSpeaking ? (
              <>
                <span className="flex gap-0.5">
                  {[0, 1, 2].map((i) => (
                    <span key={i} className="h-1 w-1 rounded-full bg-violet-400"
                      style={{ animation: `bounce 1s ${i * 0.2}s infinite` }} />
                  ))}
                </span>
                <span className="text-xs font-semibold uppercase tracking-widest text-violet-400">AI Speaking</span>
              </>
            ) : isListening ? (
              <>
                <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
                <span className="text-xs font-semibold uppercase tracking-widest text-emerald-400">Listening…</span>
              </>
            ) : (
              <>
                <span className="h-2 w-2 animate-pulse rounded-full bg-blue-400" />
                <span className="text-xs font-semibold uppercase tracking-widest text-blue-400">AI Interviewer</span>
              </>
            )}
          </div>

          {/* Current question */}
          <p className={`text-center text-xl font-bold leading-snug ${isDark ? "text-white" : "text-slate-800"}`}>
            &ldquo;{currentQ}&rdquo;
          </p>

          {/* Profile card (shown during AI interview stage) */}
          {!isIntro && profile && (
            <div className={`w-full max-w-xs rounded-xl border p-3 text-xs ${isDark ? "border-white/10 bg-white/5" : "border-slate-200 bg-white"}`}>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500 mb-2">Your Profile</p>
              <p className="text-blue-400 font-medium">{profile.role}</p>
              <p className="text-slate-400 mt-0.5">{profile.experience} · {profile.technologies}</p>
            </div>
          )}
        </div>

        {/* ── RIGHT PANEL ──────────────────────────────────────────────────── */}
        <div className={`flex w-7/12 flex-col border-l ${isDark ? "border-white/10 bg-[#0b1120]" : "border-slate-200 bg-white"}`}>

          {/* Camera placeholder */}
          <div className="relative shrink-0 overflow-hidden" style={{ height: "210px" }}>
            <div className="h-full w-full bg-gradient-to-br from-slate-700 via-slate-600 to-slate-800 flex items-end">
              <div className={`m-3 rounded-md px-3 py-1 text-xs font-semibold text-white shadow bg-black/50 backdrop-blur-sm`}>
                {user?.displayName ?? user?.email?.split("@")[0] ?? "You"}
              </div>
            </div>
            <div className="absolute right-3 top-3 flex items-center gap-1.5 rounded-full bg-black/60 px-2.5 py-1 text-xs font-bold text-white backdrop-blur-sm">
              <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
              REC
            </div>
          </div>

          {/* Transcript header */}
          <div className={`flex shrink-0 items-center justify-between border-b px-4 py-2.5 ${isDark ? "border-white/5" : "border-slate-100"}`}>
            <span className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">Live Transcript</span>
            {!speechInputSupported && (
              <span className="rounded bg-red-500/20 px-2 py-0.5 text-[11px] text-red-400">
                Speech not supported in this browser
              </span>
            )}
          </div>

          {/* Chat log */}
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3 text-sm">
            {chatLog.map((msg, i) => (
              <div key={i} className={`flex gap-2 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                {/* Avatar dot */}
                <div className={`shrink-0 flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold ${msg.role === "ai"
                    ? "bg-blue-600/20 text-blue-400"
                    : "bg-emerald-600/20 text-emerald-400"
                  }`}>
                  {msg.role === "ai" ? <BotIcon size="sm" /> : user?.displayName?.[0]?.toUpperCase() ?? "U"}
                </div>
                <div className={`max-w-[80%] rounded-2xl px-3 py-2 ${msg.role === "ai"
                    ? isDark ? "bg-white/5 text-slate-200" : "bg-slate-100 text-slate-800"
                    : isDark ? "bg-blue-600/20 text-blue-100" : "bg-blue-50 text-blue-900"
                  }`}>
                  {msg.text}
                </div>
              </div>
            ))}

            {/* Live interim transcript */}
            {isListening && (currentBuffer || interimTranscript) && (
              <div className="flex gap-2 flex-row-reverse">
                <div className="shrink-0 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600/20 text-[10px] font-bold text-emerald-400">
                  {user?.displayName?.[0]?.toUpperCase() ?? "U"}
                </div>
                <div className={`max-w-[80%] rounded-2xl px-3 py-2 italic ${isDark ? "bg-blue-600/10 text-blue-200" : "bg-blue-50 text-blue-700"}`}>
                  {currentBuffer}
                  <span className="opacity-60">{interimTranscript}</span>
                  <span className="ml-0.5 inline-block h-3 w-0.5 animate-pulse bg-blue-400 align-middle" />
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Controls */}
          <div className={`flex shrink-0 items-center justify-center gap-6 border-t px-6 py-4 ${isDark ? "border-white/10" : "border-slate-200"}`}>

            {/* Camera (decorative) */}
            <button disabled className={`flex h-12 w-12 items-center justify-center rounded-full ${isDark ? "bg-white/5 text-slate-400" : "bg-slate-100 text-slate-500"}`} aria-label="Camera (disabled)">
              <svg viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6">
                <path d="M15 8v8H5V8h10m1-2H4a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-3.5l4 4V6.5l-4 4V7a1 1 0 0 0-1-1Z" />
              </svg>
            </button>

            {/* Mic */}
            <button
              onClick={handleMicToggle}
              disabled={!speechInputSupported}
              aria-label={isListening ? "Stop recording" : "Start recording"}
              className={`relative flex h-16 w-16 items-center justify-center rounded-full shadow-lg transition-all duration-200 active:scale-95 ${isListening
                  ? "bg-red-500 text-white ring-4 ring-red-500/30 hover:bg-red-600"
                  : "bg-blue-600 text-white hover:bg-blue-500 ring-4 ring-blue-600/30"
                } disabled:opacity-40 disabled:cursor-not-allowed`}
            >
              {isListening && <span className="absolute inset-0 animate-ping rounded-full bg-red-500/40" />}
              {isListening ? <MicOffIcon /> : <MicIcon />}
            </button>

            {/* Next / End */}
            <button
              onClick={handleNext}
              className="flex items-center gap-2 rounded-full bg-blue-600/20 px-5 py-3 text-sm font-semibold text-blue-400 ring-1 ring-blue-500/30 transition hover:bg-blue-600/30 active:scale-95"
            >
              <ArrowRightIcon />
              {isLastQ ? "Finish Interview" : "Next Question"}
            </button>
          </div>
        </div>
      </div>

      {/* Bounce animation */}
      <style>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
          40% { transform: translateY(-4px); opacity: 1; }
        }
      `}</style>
    </div>
  );
}