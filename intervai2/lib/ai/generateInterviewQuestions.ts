import type { CandidateProfile } from "@/lib/interview/buildCandidateProfile";

export interface GeneratedQuestions {
    questions: string[];
}

/**
 * Calls the internal Next.js API route which calls Gemini to generate
 * 5 personalised technical interview questions for the candidate.
 */
export async function generateInterviewQuestions(
    profile: CandidateProfile
): Promise<string[]> {
    const response = await fetch("/api/generate-interview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile }),
    });

    if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        console.error("[generateInterviewQuestions] API error:", err);
        // Fallback questions so the interview always works
        return getFallbackQuestions(profile.role);
    }

    const data: GeneratedQuestions = await response.json();
    return data.questions?.length ? data.questions : getFallbackQuestions(profile.role);
}

function getFallbackQuestions(role: string): string[] {
    const r = role.toLowerCase();

    if (r.includes("full stack") || (r.includes("frontend") && r.includes("backend"))) {
        return [
            "How do you manage shared state between a React frontend and a Node.js backend in a real-time application?",
            "Explain the difference between server-side rendering, static site generation, and client-side rendering — when would you choose each?",
            "How would you design a RESTful API for a multi-tenant SaaS application, and what authentication strategy would you use?",
            "Describe how you would optimize the Time to First Byte (TTFB) and Largest Contentful Paint (LCP) for a Next.js application.",
            "Walk me through how you would implement database connection pooling and query caching in a high-traffic web app.",
        ];
    }

    if (r.includes("frontend") || r.includes("ui") || r.includes("react") || r.includes("vue") || r.includes("angular")) {
        return [
            "Explain the React reconciliation algorithm and how the virtual DOM diffing works under the hood.",
            "How would you implement code splitting and lazy loading in a large React application to improve initial load time?",
            "Describe your approach to managing global state — when would you use Context API vs. Zustand vs. Redux?",
            "How do you ensure your components are accessible (WCAG 2.1 AA) without sacrificing developer experience?",
            "Walk me through optimizing a React component that re-renders too frequently.",
        ];
    }

    if (r.includes("backend") || r.includes("server") || r.includes("api") || r.includes("node") || r.includes("django") || r.includes("spring")) {
        return [
            "How would you design a rate-limiting middleware for a public REST API and what data structures would you use?",
            "Explain the CAP theorem and describe a scenario where you had to make a trade-off between consistency and availability.",
            "How do you handle database migrations safely in a zero-downtime deployment environment?",
            "Describe the differences between JWT and session-based authentication, and when you'd prefer one over the other.",
            "How would you design a job queue system to handle 1 million background tasks per day reliably?",
        ];
    }

    if (r.includes("data analyst") || r.includes("data analysis") || r.includes("business analyst")) {
        return [
            "Given a pandas DataFrame with missing values and duplicates, walk me through your end-to-end data cleaning process.",
            "How would you write a SQL query to find the top 3 revenue-generating products per region for each month?",
            "Explain the difference between OLTP and OLAP systems and how this affects your query design.",
            "How do you determine which visualization type (bar, line, scatter, heatmap) is most appropriate for a given dataset?",
            "Describe how you would identify and communicate a statistically significant trend to a non-technical stakeholder.",
        ];
    }

    if (r.includes("data science") || r.includes("machine learning") || r.includes("ml") || r.includes("ai")) {
        return [
            "Explain the bias-variance trade-off and describe how you would diagnose and correct for overfitting in a classification model.",
            "How would you handle a highly imbalanced dataset where the positive class is only 1% of the data?",
            "Walk me through how you would engineer features from raw timestamp data for a churn prediction model.",
            "What is the difference between L1 and L2 regularization, and in what scenarios would you prefer each?",
            "How would you monitor a deployed machine learning model for data drift and model degradation in production?",
        ];
    }

    if (r.includes("devops") || r.includes("cloud") || r.includes("sre") || r.includes("infrastructure") || r.includes("platform")) {
        return [
            "Walk me through designing a CI/CD pipeline for a microservices application with zero-downtime deployments.",
            "How would you implement horizontal pod autoscaling in Kubernetes based on custom application metrics?",
            "Explain how you would structure Terraform modules for a multi-environment (dev/staging/prod) AWS infrastructure.",
            "Describe how you would build an alerting strategy to distinguish between noise and actionable incidents in a distributed system.",
            "How would you perform a blameless post-mortem after a production outage and what documentation would you produce?",
        ];
    }

    if (r.includes("mobile") || r.includes("ios") || r.includes("android") || r.includes("flutter") || r.includes("react native")) {
        return [
            "Explain the activity/fragment lifecycle in Android (or UIViewController lifecycle in iOS) and how it affects state management.",
            "How would you implement offline-first functionality in a mobile app with background sync when connectivity is restored?",
            "Describe how you optimize React Native (or Flutter) app startup time and reduce bundle size.",
            "How do you handle push notifications, deep linking, and background app refresh across iOS and Android?",
            "Walk me through your process for detecting and fixing memory leaks in a mobile application.",
        ];
    }

    if (r.includes("project manager") || r.includes("product manager") || r.includes("scrum master") || r.includes("agile")) {
        return [
            "How do you prioritize a product backlog when every stakeholder considers their item the highest priority?",
            "Describe how you would manage a critical feature that is 3 weeks behind schedule with an immovable release date.",
            "How do you measure the success of a sprint beyond just velocity, and what metrics do you track?",
            "Walk me through how you would run a sprint retrospective that actually drives process improvements.",
            "How would you manage scope creep from a high-influence stakeholder mid-sprint without derailing the team?",
        ];
    }

    if (r.includes("qa") || r.includes("quality") || r.includes("test") || r.includes("sdet")) {
        return [
            "How do you design a test strategy for a new microservice that has no existing test coverage?",
            "Explain the testing pyramid and how you decide the right balance of unit, integration, and end-to-end tests.",
            "How would you implement a data-driven test framework using Playwright or Selenium for a complex web application?",
            "Describe how you would perform API contract testing between microservices using tools like Pact.",
            "How do you measure and report test coverage in a way that is meaningful to both developers and management?",
        ];
    }

    // Generic fallback
    return [
        `Walk me through a recent challenging ${role} problem you solved and the decisions you made along the way.`,
        "How do you approach system design when starting a new feature that needs to scale to millions of users?",
        "Describe your process for debugging a performance bottleneck in a production system you've never seen before.",
        "How do you make informed trade-off decisions between technical debt and delivering new features quickly?",
        "Tell me about a time you disagreed with a technical decision in your team — how did you handle it?",
    ];
}
