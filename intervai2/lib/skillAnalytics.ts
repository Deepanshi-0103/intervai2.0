import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "./firebase";
import { fetchUserSessions } from "@/firebase/fetchSessions";

export interface SkillScore {
  name: string;
  score: number;
  bar: string;
  badge: string;
  desc: string;
}

// Pre-defined skill categories
const SKILL_CATEGORIES = [
  {
    name: "System Design & Backend",
    keywords: ["backend", "node", "system", "database", "api"],
    quizDomains: ["nodejs", "databases", "system-design"],
    bar: "bg-blue-500", badge: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    desc: "Scalability, databases, APIs, and backend frameworks"
  },
  {
    name: "Algorithms & DSA",
    keywords: ["swe", "software", "algorithm", "data structure"],
    quizDomains: ["dsa"],
    bar: "bg-indigo-500", badge: "bg-indigo-500/10 text-indigo-500 border-indigo-500/20",
    desc: "Sorting, graphs, dynamic programming, complexity analysis"
  },
  {
    name: "Frontend & UI",
    keywords: ["frontend", "react", "ui", "web", "css"],
    quizDomains: ["react", "css-design"],
    bar: "bg-pink-500", badge: "bg-pink-500/10 text-pink-500 border-pink-500/20",
    desc: "React, State management, CSS, responsive design"
  },
  {
    name: "Programming Languages",
    keywords: ["javascript", "python", "java", "c++", "golang"],
    quizDomains: ["javascript", "python"],
    bar: "bg-yellow-500", badge: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
    desc: "Core syntax, data types, and language features"
  },
  {
    name: "DevOps & Cloud",
    keywords: ["devops", "cloud", "aws", "docker", "kubernetes", "ci/cd"],
    quizDomains: ["devops"],
    bar: "bg-cyan-500", badge: "bg-cyan-500/10 text-cyan-500 border-cyan-500/20",
    desc: "Deployment, containers, orchestration, CI/CD pipelines"
  },
  {
    name: "Interview & Communication",
    keywords: [], // Matches ALL interviews automatically
    quizDomains: [], // No quizzes for this
    bar: "bg-purple-500", badge: "bg-purple-500/10 text-purple-500 border-purple-500/20",
    desc: "Clarity, roleplay, STAR method, general communication"
  }
];

export async function computeUserSkills(userId: string): Promise<SkillScore[]> {
  try {
    // 1. Fetch Quiz Results
    const qQuizzes = query(collection(db, "quizResults"), where("userId", "==", userId));
    const quizSnap = await getDocs(qQuizzes);
    const quizzes = quizSnap.docs.map(d => d.data() as {
      domain: string;
      score: number;
      totalQuestions: number;
    });

    // 2. Fetch Interview Sessions
    const sessions = await fetchUserSessions(userId);

    // 3. Aggregate scores per category
    const categoryScores: Record<string, { totalPct: number, count: number }> = {};
    SKILL_CATEGORIES.forEach(c => categoryScores[c.name] = { totalPct: 0, count: 0 });

    // Process Quizzes
    quizzes.forEach(quiz => {
      const pct = (quiz.score / quiz.totalQuestions) * 100;
      // Find matching category
      for (const cat of SKILL_CATEGORIES) {
        if (cat.quizDomains.includes(quiz.domain)) {
          categoryScores[cat.name].totalPct += pct;
          categoryScores[cat.name].count += 1;
        }
      }
    });

    // Process Interviews (only those with feedback)
    sessions.forEach(session => {
      if (!session.feedback) return;
      const score = Math.max(0, Math.min(100, session.feedback.overallScore || 0));
      const roleLower = (session.role || "").toLowerCase();

      // All interviews count towards "Interview & Communication"
      categoryScores["Interview & Communication"].totalPct += score;
      categoryScores["Interview & Communication"].count += 1;

      // Check keyword mapping for other categories
      for (const cat of SKILL_CATEGORIES) {
        if (cat.name === "Interview & Communication") continue;
        if (cat.keywords.some(kw => roleLower.includes(kw))) {
          categoryScores[cat.name].totalPct += score;
          categoryScores[cat.name].count += 1;
        }
      }
    });

    // 4. Format into final array
    const result: SkillScore[] = SKILL_CATEGORIES.map(cat => {
      const agg = categoryScores[cat.name];
      // If no data, default to 0 so the chart still renders empty bars
      const finalScore = agg.count > 0 ? Math.round(agg.totalPct / agg.count) : 0;
      
      return {
        name: cat.name,
        score: finalScore,
        bar: cat.bar,
        badge: cat.badge,
        desc: cat.desc
      };
    });

    // Sort by score descending so the best skills are at top
    return result.sort((a, b) => b.score - a.score);

  } catch (error) {
    console.error("Error computing user skills:", error);
    // Return empty state template on failure
    return SKILL_CATEGORIES.map(cat => ({ ...cat, score: 0 }));
  }
}
