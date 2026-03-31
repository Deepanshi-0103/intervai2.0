/**
 * useInterviewStore.ts
 * Zustand-style lightweight store for tracking the active interview session state.
 * Uses React useState pattern (no extra dependency needed) — exported as a
 * standalone helper so components can share interview state if needed.
 *
 * If you prefer a real Zustand store, install: npm install zustand
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TranscriptMessage {
    role: "ai" | "user";
    text: string;
    timestamp?: number;
}

export type InterviewStage = "idle" | "intro" | "loading" | "interview" | "finished";

export interface InterviewState {
    stage: InterviewStage;
    // Intro phase
    introAnswers: string[];
    // AI interview phase
    profileId: string;
    aiQuestions: string[];
    interviewAnswers: string[];
    transcript: TranscriptMessage[];
    // Result
    sessionId: string | null;
}

export const defaultInterviewState: InterviewState = {
    stage: "idle",
    introAnswers: [],
    profileId: "",
    aiQuestions: [],
    interviewAnswers: [],
    transcript: [],
    sessionId: null,
};

// ─────────────────────────────────────────────────────────────────────────────
// Simple helper to build an AI transcript entry
export function aiMessage(text: string): TranscriptMessage {
    return { role: "ai", text, timestamp: Date.now() };
}

// Simple helper to build a user transcript entry
export function userMessage(text: string): TranscriptMessage {
    return { role: "user", text, timestamp: Date.now() };
}
