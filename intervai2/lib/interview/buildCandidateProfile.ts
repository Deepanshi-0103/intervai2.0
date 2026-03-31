export interface CandidateProfile {
    name: string;
    role: string;
    experience: string;
    technologies: string;
    targetCompanies: string;
}

/**
 * Builds a structured candidate profile from the 5 intro question answers.
 * Answer indices map to:
 *   0 → name
 *   1 → role
 *   2 → years of experience
 *   3 → technologies
 *   4 → target companies
 */
export function buildCandidateProfile(answers: string[]): CandidateProfile {
    return {
        name: answers[0]?.trim() || "Candidate",
        role: answers[1]?.trim() || "Software Engineer",
        experience: answers[2]?.trim() || "Not specified",
        technologies: answers[3]?.trim() || "Not specified",
        targetCompanies: answers[4]?.trim() || "Not specified",
    };
}

/** Returns the profile as a plain-text string for Gemini prompts */
export function profileToText(p: CandidateProfile): string {
    return `Name: ${p.name}
Role: ${p.role}
Experience: ${p.experience}
Technologies: ${p.technologies}
Target Companies: ${p.targetCompanies}`;
}
