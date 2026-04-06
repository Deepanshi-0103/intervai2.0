import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import type { CandidateProfile } from "@/lib/interview/buildCandidateProfile";

// Supports both server-private key (preferred) and NEXT_PUBLIC_ fallback
function getGeminiKey(): string {
    return process.env.GEMINI_API_KEY ?? process.env.NEXT_PUBLIC_GEMINI_API_KEY ?? "";
}

const PREFERRED_MODELS = [
    "gemini-2.5-flash",
    "gemini-2.0-flash",
    "gemini-2.0-flash-lite",
    "gemini-1.5-flash-latest",
];

type ListModelsResponse = {
    models?: Array<{
        name?: string;
        supportedGenerationMethods?: string[];
    }>;
};

async function fetchGenerateContentModels(apiKey: string): Promise<Set<string>> {
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
    const response = await fetch(url, { method: "GET", cache: "no-store" });

    if (!response.ok) {
        throw new Error(`ListModels failed with ${response.status} ${response.statusText}`);
    }

    const data = (await response.json()) as ListModelsResponse;
    const modelNames = (data.models ?? [])
        .filter((m) => (m.supportedGenerationMethods ?? []).includes("generateContent"))
        .map((m) => (m.name ?? "").replace(/^models\//, ""))
        .filter(Boolean);

    return new Set(modelNames);
}

async function getGeminiModelCandidates(apiKey: string): Promise<string[]> {
    const preferredFromEnv = process.env.GEMINI_MODEL?.trim();
    const preferredOrder = Array.from(new Set([preferredFromEnv, ...PREFERRED_MODELS].filter(Boolean) as string[]));

    try {
        const availableModels = await fetchGenerateContentModels(apiKey);
        const prioritized = preferredOrder.filter((model) => availableModels.has(model));
        const remaining = Array.from(availableModels).filter((model) => !prioritized.includes(model));
        return [...prioritized, ...remaining];
    } catch (error) {
        console.warn("[generate-interview] ListModels failed, using static fallback list:", error);
        return preferredOrder;
    }
}

export async function POST(request: Request) {
    try {
        const { profile }: { profile: CandidateProfile } = await request.json();

        const apiKey = getGeminiKey();
        if (!apiKey) {
            console.error("[generate-interview] Neither GEMINI_API_KEY nor NEXT_PUBLIC_GEMINI_API_KEY is set in .env.local");
            return NextResponse.json(
                { error: "Gemini API key not configured" },
                { status: 500 }
            );
        }

        const genAI = new GoogleGenerativeAI(apiKey);

        // Determine difficulty tier from experience
        const tier = getDifficultyTier(profile.experience);

        const prompt = `You are an expert technical interviewer. Generate exactly 5 interview questions for the following candidate.

CANDIDATE:
- Role: ${profile.role}
- Experience: ${profile.experience}
- Tech Stack: ${profile.technologies}
- Target Companies: ${profile.targetCompanies}

DIFFICULTY TIER: ${tier}
${tier === "Easy-Medium"
                ? `• Easy-Medium means: test core fundamentals and basic practical knowledge. Questions should be answerable by a junior with 0-2 years experience. Avoid deep architecture or system-design questions.`
                : `• Medium-Hard means: test design decisions, system-level thinking, and real-world trade-offs. Questions should challenge a mid/senior engineer (3+ years). Include at least one system design or architectural question.`
            }

ROLE CLASSIFICATION GUIDE (pick the best match and ask accordingly):
• Full Stack → React/Vue/Angular + REST/GraphQL APIs + DB integration
• Frontend → DOM, state management, CSS architecture, performance, accessibility
• Backend → API design, SQL/NoSQL, caching, auth, microservices, scalability
• Data Analyst → SQL, pandas, data cleaning, visualization, business insights
• Data Scientist / ML Engineer → algorithms, model evaluation, numpy/sklearn/PyTorch, feature engineering
• DevOps / Cloud → CI/CD, Docker, Kubernetes, Terraform, cloud providers, monitoring
• Mobile → lifecycle, offline support, performance, platform APIs
• Project Manager → agile ceremonies, backlog prioritization, stakeholder management, delivery metrics
• QA / Test → test strategy, automation frameworks, coverage, bug lifecycle
• Security → OWASP, pen testing, zero-trust, threat modeling

RULES:
1. All 5 questions MUST match the classified role AND the candidate's exact tech stack (if they listed React — ask React; if NumPy — ask NumPy).
2. Questions must be at the ${tier} difficulty level.
3. Mix types: at least 1 conceptual, 1 practical/scenario, and 1 debugging/troubleshooting question.
4. Keep each question concise — 1 to 2 sentences max.
5. Do NOT ask "Tell me about yourself" or "Where do you see yourself" — focus on technical depth only.

Return ONLY valid JSON (no markdown, no explanation):
{"questions":["question 1","question 2","question 3","question 4","question 5"]}`;

        const modelCandidates = await getGeminiModelCandidates(apiKey);

        let result: Awaited<ReturnType<ReturnType<typeof genAI.getGenerativeModel>["generateContent"]>> | null = null;
        let lastError: unknown = null;

        for (const modelName of modelCandidates) {
            try {
                const model = genAI.getGenerativeModel({ model: modelName });
                result = await model.generateContent(prompt);
                console.log(`[generate-interview] Gemini model selected: ${modelName}`);
                break;
            } catch (err) {
                lastError = err;
                const message = err instanceof Error ? err.message : String(err);
                const status = typeof err === "object" && err !== null && "status" in err
                    ? String((err as { status?: number }).status)
                    : "";
                // Retry only for model-availability errors; bubble up other failures.
                if (!/not found|not supported|models\//i.test(message) && status !== "404") {
                    throw err;
                }
            }
        }

        if (!result) {
            throw lastError instanceof Error ? lastError : new Error("No compatible Gemini model found");
        }

        const rawText = result.response.text().trim();

        // Strip markdown code fences if Gemini wraps the JSON
        const jsonText = rawText
            .replace(/^```(?:json)?\s*/i, "")
            .replace(/\s*```$/, "")
            .trim();

        const parsed = JSON.parse(jsonText);

        if (!Array.isArray(parsed.questions) || parsed.questions.length === 0) {
            throw new Error("Invalid questions format from Gemini");
        }

        return NextResponse.json({ questions: parsed.questions.slice(0, 5) });
    } catch (error) {
        console.error("[/api/generate-interview] Error:", error);
        return NextResponse.json(
            { error: "Failed to generate questions" },
            { status: 500 }
        );
    }
}

/**
 * Maps a free-text experience string to one of two difficulty tiers.
 * Easy-Medium → 0-2 years / fresher / intern / junior
 * Medium-Hard → 3+ years / mid / senior / lead / principal
 */
type DifficultyTier = "Easy-Medium" | "Medium-Hard";
function getDifficultyTier(experience: string): DifficultyTier {
    const e = experience.toLowerCase();

    // Explicit seniority keywords → Medium–Hard
    if (/senior|lead|principal|staff|architect|manager|director|head/.test(e)) {
        return "Medium-Hard";
    }

    // Explicit junior keywords → Easy–Medium
    if (/fresher|intern|graduate|entry|junior|trainee|no experience|0 year|less than 1|< 1/.test(e)) {
        return "Easy-Medium";
    }

    // Try to extract the first number (e.g. "3 years", "2.5 yrs")
    const match = e.match(/(\d+(\.\d+)?)/);
    if (match) {
        const years = parseFloat(match[1]);
        return years >= 3 ? "Medium-Hard" : "Easy-Medium";
    }

    // Default: Medium-Hard (safer assumption for a tech interview)
    return "Medium-Hard";
}
