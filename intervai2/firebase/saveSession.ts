import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { recordActivity } from "@/app/components/ui/StreakHeatmap";

export interface TranscriptEntry {
    role: "ai" | "user";
    text: string;
}

export interface InterviewSessionDocument {
    userId: string;
    profileId: string;
    questions: string[];
    answers: string[];
    transcript: TranscriptEntry[];
}

/**
 * Stores a completed interview session in the `interviewSessions` collection.
 * Returns the new Firestore document ID.
 *
 * Document shape:
 * {
 *   userId, profileId,
 *   questions[], answers[], transcript[],
 *   status: "completed",
 *   createdAt
 * }
 */
export async function saveSession(session: InterviewSessionDocument): Promise<string> {
    const ref = await addDoc(collection(db, "interviewSessions"), {
        userId: session.userId,
        profileId: session.profileId,
        questions: session.questions,
        answers: session.answers,
        transcript: session.transcript,
        status: "completed",
        createdAt: serverTimestamp(),
    });

    // Record activity for streak heatmap (non-fatal if it fails)
    try {
        await recordActivity(session.userId);
    } catch (e) {
        console.warn("[saveSession] recordActivity failed (non-fatal):", e);
    }

    return ref.id;
}
