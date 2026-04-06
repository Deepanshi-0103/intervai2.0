/**
 * buildCandidateContext.ts
 *
 * Legacy alias kept for any imports that reference this file.
 * The primary implementation lives in buildCandidateProfile.ts —
 * this file re-exports everything from there for backward compatibility.
 */

export {
    buildCandidateProfile as buildCandidateContext,
    profileToText,
} from "@/lib/interview/buildCandidateProfile";

export type { CandidateProfile } from "@/lib/interview/buildCandidateProfile";

// Backwards-compatible text-only helper
import { buildCandidateProfile, profileToText } from "@/lib/interview/buildCandidateProfile";

/**
 * Builds a plain-text context string from raw intro answers.
 * Drop-in replacement for the old buildCandidateContext(answers) API.
 */
export function buildContextString(answers: string[]): string {
    const profile = buildCandidateProfile(answers);
    return profileToText(profile);
}
