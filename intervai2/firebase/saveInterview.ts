import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface InterviewSession {
    userId: string;
    questions: string[];
    answers: string[];
}

/**
 * Persists a completed interview session to the Firestore `interviews` collection.
 * Returns the new Firestore document ID.
 */
export async function saveInterview(session: InterviewSession): Promise<string> {
    const docRef = await addDoc(collection(db, "interviews"), {
        userId: session.userId,
        questions: session.questions,
        answers: session.answers,
        createdAt: serverTimestamp(),
    });

    return docRef.id;
}
