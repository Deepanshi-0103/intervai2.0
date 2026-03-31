import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { CandidateProfile } from "@/lib/interview/buildCandidateProfile";

export interface ProfileDocument {
    userId: string;
    profile: CandidateProfile;
}

/**
 * Saves the candidate's intro profile to the `interviewProfiles` collection.
 * Returns the new document ID (profileId) used to link the session.
 */
export async function saveProfile(doc: ProfileDocument): Promise<string> {
    const ref = await addDoc(collection(db, "interviewProfiles"), {
        userId: doc.userId,
        name: doc.profile.name,
        role: doc.profile.role,
        experience: doc.profile.experience,
        technologies: doc.profile.technologies,
        targetCompanies: doc.profile.targetCompanies,
        createdAt: serverTimestamp(),
    });
    return ref.id;
}
