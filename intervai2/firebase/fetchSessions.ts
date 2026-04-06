import {
    collection,
    query,
    where,
    orderBy,
    getDocs,
    doc,
    getDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface SessionSummary {
    id: string;
    role: string;
    questions: string[];
    answers: string[];
    createdAt: Date;
    hasFeedback: boolean;
    feedback?: any; // The full feedback object
}

/**
 * Fetches all interviewSessions for a user, newest first.
 * Also looks up the matching interviewProfile to get the role name.
 */
export async function fetchUserSessions(userId: string): Promise<SessionSummary[]> {
    const q = query(
        collection(db, "interviewSessions"),
        where("userId", "==", userId),
        orderBy("createdAt", "desc")
    );

    const snap = await getDocs(q);

    const sessions: SessionSummary[] = await Promise.all(
        snap.docs.map(async (d) => {
            const data = d.data();

            // Resolve role from linked profile if available
            let role = "Interview Session";
            if (data.profileId) {
                try {
                    const profileSnap = await getDoc(doc(db, "interviewProfiles", data.profileId));
                    if (profileSnap.exists()) {
                        role = profileSnap.data().role ?? role;
                    }
                } catch {
                    // profile might not exist, use default
                }
            }

            return {
                id: d.id,
                role,
                questions: data.questions ?? [],
                answers: data.answers ?? [],
                createdAt: data.createdAt?.toDate?.() ?? new Date(),
                hasFeedback: !!data.feedback,
                feedback: data.feedback ?? undefined,
            };
        })
    );

    return sessions;
}
