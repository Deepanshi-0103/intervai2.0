import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

function getGeminiKey(): string {
    return process.env.GEMINI_API_KEY ?? "";
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
    if (!response.ok) throw new Error(`ListModels failed: ${response.status}`);
    const data = (await response.json()) as ListModelsResponse;
    const modelNames = (data.models ?? [])
        .filter((m) => (m.supportedGenerationMethods ?? []).includes("generateContent"))
        .map((m) => (m.name ?? "").replace(/^models\//, ""))
        .filter(Boolean);
    return new Set(modelNames);
}

async function getModelCandidates(apiKey: string): Promise<string[]> {
    const preferredFromEnv = process.env.GEMINI_MODEL?.trim();
    const preferredOrder = Array.from(
        new Set([preferredFromEnv, ...PREFERRED_MODELS].filter(Boolean) as string[])
    );
    try {
        const available = await fetchGenerateContentModels(apiKey);
        const prioritized = preferredOrder.filter((m) => available.has(m));
        const remaining = Array.from(available).filter((m) => !prioritized.includes(m));
        return [...prioritized, ...remaining];
    } catch {
        return preferredOrder;
    }
}

function extractJson(text: string): string {
    const stripped = text
        .replace(/^```(?:json)?\s*/im, "")
        .replace(/\s*```\s*$/m, "")
        .trim();
    const match = stripped.match(/\{[\s\S]*\}/);
    return match ? match[0] : stripped;
}

async function extractTextFromPdf(buffer: Buffer): Promise<string> {
    // Require the internal lib file directly to bypass pdf-parse's
    // top-level index.js which auto-runs a test that opens a local
    // file path and crashes in Next.js API routes (ENOENT bug).
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const pdfParse = require("pdf-parse/lib/pdf-parse.js");
    const parsed = await pdfParse(buffer);
    return parsed.text as string;
}

// Sanitize: ensure scores are plain integers, not strings or ranges like "70-75"
function toInt(v: unknown): number {
    if (typeof v === "number") return Math.round(Math.max(0, Math.min(100, v)));
    if (typeof v === "string") {
        const rangeMatch = v.match(/(\d+)\s*[-–]\s*(\d+)/);
        if (rangeMatch) {
            const avg = Math.round((parseInt(rangeMatch[1]) + parseInt(rangeMatch[2])) / 2);
            return Math.max(0, Math.min(100, avg));
        }
        const num = parseInt(v, 10);
        return isNaN(num) ? 0 : Math.max(0, Math.min(100, num));
    }
    return 0;
}

export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const file = formData.get("file") as File | null;
        const jobRole = (formData.get("jobRole") as string | null) ?? "Software Engineer";

        if (!file) {
            return NextResponse.json({ error: "No file provided" }, { status: 400 });
        }

        const apiKey = getGeminiKey();
        if (!apiKey) {
            return NextResponse.json({ error: "Gemini API key not configured" }, { status: 500 });
        }

        let resumeText = "";

        if (file.type === "application/pdf") {
            const buffer = Buffer.from(await file.arrayBuffer());
            try {
                resumeText = await extractTextFromPdf(buffer);
            } catch (pdfError) {
                console.error("[/api/analyze-resume] PDF parse error:", pdfError);
                return NextResponse.json(
                    { error: "Failed to parse PDF. Please ensure the file is a valid, non-scanned PDF." },
                    { status: 400 }
                );
            }
        } else {
            resumeText = await file.text();
        }

        if (!resumeText.trim()) {
            return NextResponse.json(
                { error: "Could not extract text from file. If this is a scanned PDF, please upload a text-based version." },
                { status: 400 }
            );
        }

        // Inject today's real date so the model never flags legitimate
        // past/present dates as "future" due to a stale training cutoff.
        const todayStr = new Date().toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
        });

        const prompt = `You are an expert ATS (Applicant Tracking System) and career coach.

IMPORTANT — Today's date is ${todayStr}. Use this as your authoritative reference for evaluating all dates in the resume. Any date that falls on or before ${todayStr} is a PAST or PRESENT date, not a future date. Do NOT flag such dates as errors.

Analyze the following resume for a "${jobRole}" role and return a JSON feedback report.

RESUME:
${resumeText.slice(0, 8000)}

Strict output rules:
1. atsScore MUST be a plain integer between 0 and 100 (e.g. 72). Never a string, never a range.
2. formattingScore MUST be a plain integer between 0 and 100 (e.g. 85). Never a string, never a range.
3. Do NOT mention or flag dates that are on or before ${todayStr} as future or invalid.
4. strengths MUST be an array of exactly 3 strings.
5. improvements MUST be an array of exactly 4 strings.
6. keywordGaps MUST be an array of strings, maximum 8 items.

Return ONLY a valid JSON object with exactly these fields and no other text:
{
  "atsScore": <integer 0-100>,
  "formattingScore": <integer 0-100>,
  "summary": "<2-3 sentences about overall resume quality>",
  "strengths": ["<strength 1>", "<strength 2>", "<strength 3>"],
  "improvements": ["<improvement 1>", "<improvement 2>", "<improvement 3>", "<improvement 4>"],
  "keywordGaps": ["<keyword 1>", ...],
  "nextSteps": "<1-2 sentences: the single most impactful thing to do next>"
}`;

        const genAI = new GoogleGenerativeAI(apiKey);
        const candidates = await getModelCandidates(apiKey);

        if (candidates.length === 0) {
            return NextResponse.json({ error: "No Gemini models available" }, { status: 500 });
        }

        let result: Awaited<
            ReturnType<ReturnType<typeof genAI.getGenerativeModel>["generateContent"]>
        > | null = null;
        let lastError: unknown = null;

        for (const modelName of candidates) {
            try {
                const model = genAI.getGenerativeModel({ model: modelName });
                result = await model.generateContent(prompt);
                break;
            } catch (err) {
                lastError = err;
                const message = err instanceof Error ? err.message : String(err);
                const status =
                    typeof err === "object" && err !== null && "status" in err
                        ? String((err as { status?: number }).status)
                        : "";
                if (!/not found|not supported|models\//i.test(message) && status !== "404") {
                    throw err;
                }
            }
        }

        if (!result) {
            throw lastError instanceof Error
                ? lastError
                : new Error("No compatible Gemini model found");
        }

        const rawText = result.response.text().trim();

        let analysis: Record<string, unknown>;
        try {
            analysis = JSON.parse(extractJson(rawText)) as Record<string, unknown>;
        } catch {
            return NextResponse.json(
                { error: "Gemini returned malformed JSON", raw: rawText.slice(0, 500) },
                { status: 500 }
            );
        }

        // Always sanitize scores to guaranteed integers regardless of model output
        analysis.atsScore = toInt(analysis.atsScore);
        analysis.formattingScore = toInt(analysis.formattingScore);

        return NextResponse.json({ analysis });
    } catch (error) {
        console.error("[/api/analyze-resume] Error:", error);
        return NextResponse.json({ error: "Failed to analyze resume" }, { status: 500 });
    }
}