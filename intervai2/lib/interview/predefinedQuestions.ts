export interface InterviewQuestion {
    id: number;
    question: string;
    category: string;
}

/**
 * 5 introduction questions — answers build the candidate profile.
 * Order is important (buildCandidateProfile reads by index):
 *   0 → name
 *   1 → role
 *   2 → years of experience
 *   3 → technologies / tools
 *   4 → target companies / work environment
 */
export const predefinedQuestions: InterviewQuestion[] = [
    {
        id: 1,
        question: "Let's begin. What is your name?",
        category: "Intro",
    },
    {
        id: 2,
        question: "What role are you applying for?",
        category: "Role",
    },
    {
        id: 3,
        question: "How many years of experience do you have in this field?",
        category: "Experience",
    },
    {
        id: 4,
        question: "What technologies and tools are you most comfortable with?",
        category: "Technical",
    },
    {
        id: 5,
        question: "What type of companies or work environments are you targeting?",
        category: "Goals",
    },
];