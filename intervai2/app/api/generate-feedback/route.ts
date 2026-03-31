import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

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
        console.warn("[generate-feedback] ListModels failed, using static fallback list:", error);
        return preferredOrder;
    }
}

/** Extracts the first JSON object found anywhere in a string */
function extractJson(text: string): string {
    const stripped = text
        .replace(/^```(?:json)?\s*/im, "")
        .replace(/\s*```\s*$/m, "")
        .trim();
    const match = stripped.match(/\{[\s\S]*\}/);
    return match ? match[0] : stripped;
}

export async function POST(request: Request) {
    try {
        const { role, questions, answers } = await request.json();

        if (!Array.isArray(questions) || questions.length === 0) {
            return NextResponse.json({ error: "No questions provided" }, { status: 400 });
        }

        const apiKey = getGeminiKey();
        if (!apiKey) {
            return NextResponse.json(
                { error: "Gemini API key is not configured. Set GEMINI_API_KEY in your .env.local file." },
                { status: 500 }
            );
        }

        const genAI = new GoogleGenerativeAI(apiKey);

        const qa = questions
            .map((q: string, i: number) =>
                `Q${i + 1}: ${q}\nA${i + 1}: ${answers[i]?.trim() || "(no answer provided)"}`
            )
            .join("\n\n");

        const prompt = `You are an expert technical interviewer. Review this completed mock interview for a "${role}" role and return a feedback report as a JSON object.

INTERVIEW TRANSCRIPT:
${qa}

Return ONLY a JSON object with exactly these fields:
- overallScore: integer 0-100
- summary: string (2-3 sentences assessing overall performance)
- strengths: array of 3 strings (what the candidate did well)
- improvements: array of 3 strings (areas needing work)
- questionFeedback: array of objects, one per question, each with:
    - question: string (repeat the question text)
    - rating: one of "Excellent", "Good", "Fair", "Needs Work"
    - feedback: string (1-2 sentences on that specific answer)
- nextSteps: string (1-2 sentences: what to study or practice next)`;

        const modelCandidates = await getGeminiModelCandidates(apiKey);

        let result: Awaited<ReturnType<ReturnType<typeof genAI.getGenerativeModel>["generateContent"]>> | null = null;
        let lastError: unknown = null;

        for (const modelName of modelCandidates) {
            try {
                const model = genAI.getGenerativeModel({ model: modelName });
                result = await model.generateContent(prompt);
                console.log(`[generate-feedback] Gemini model selected: ${modelName}`);
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

        console.log("[generate-feedback] Gemini raw (first 300 chars):", rawText.slice(0, 300));

        let feedback: unknown;
        try {
            feedback = JSON.parse(extractJson(rawText));
        } catch {
            console.error("[generate-feedback] JSON parse failed. Full response:\n", rawText);
            return NextResponse.json(
                { error: "Gemini returned malformed JSON", raw: rawText.slice(0, 500) },
                { status: 500 }
            );
        }

        return NextResponse.json({ feedback });

    } catch (error) {
        console.error("[/api/generate-feedback] Unexpected error:", error);
        return NextResponse.json({ error: "Failed to generate feedback" }, { status: 500 });
    }
}
