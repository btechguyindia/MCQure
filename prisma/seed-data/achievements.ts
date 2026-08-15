// Achievement catalog (Phase 8 Motivation). `code` is the stable id used by the
// unlock evaluator; icons render on the motivation dashboard.

export interface AchievementSeed {
  code: string;
  name: string;
  description: string;
  icon: string;
}

export const ACHIEVEMENTS: AchievementSeed[] = [
  { code: "first_question", name: "First steps", description: "Answer your first practice question.", icon: "🌱" },
  { code: "first_correct", name: "First hit", description: "Get your first answer correct.", icon: "🎯" },
  { code: "questions_25", name: "Warm-up", description: "Answer 25 questions in total.", icon: "🔥" },
  { code: "questions_100", name: "Century", description: "Answer 100 questions in total.", icon: "💯" },
  { code: "questions_500", name: "Grinder", description: "Answer 500 questions in total.", icon: "⚙️" },
  { code: "questions_1000", name: "Iron will", description: "Answer 1,000 questions in total.", icon: "🧱" },
  { code: "streak_3", name: "Momentum", description: "Practice 3 days in a row.", icon: "📈" },
  { code: "streak_7", name: "One full week", description: "Practice 7 days in a row.", icon: "🗓️" },
  { code: "streak_30", name: "Unstoppable", description: "Practice 30 days in a row.", icon: "🚀" },
  { code: "accuracy_70", name: "Sharpshooter", description: "Reach 70%+ accuracy over at least 20 answers.", icon: "🎯" },
  { code: "study_10", name: "Bookworm", description: "Open study material for 10 different topics.", icon: "📚" },
  { code: "mock_first", name: "Mock debut", description: "Complete your first mock test.", icon: "📝" },
  { code: "mock_80", name: "Mock ace", description: "Score 80%+ in a mock test.", icon: "🏆" },
  { code: "weak_fixed", name: "Turnaround", description: "Raise a previously weak topic above 70% accuracy.", icon: "🔧" },
];
