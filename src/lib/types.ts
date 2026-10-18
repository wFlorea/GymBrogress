// ==========================================
// GymBrogress — TypeScript Types
// ==========================================

export interface User {
  id: string;
  email: string;
  name: string;
  created_at: string;
}

// Muscle Groups
export type MuscleGroup =
  | "chest"
  | "back"
  | "legs"
  | "arms"
  | "shoulders"
  | "core"
  | "cardio"
  | "full_body";

export const MUSCLE_GROUP_LABELS: Record<MuscleGroup, string> = {
  chest: "Piept",
  back: "Spate",
  legs: "Picioare",
  arms: "Brațe",
  shoulders: "Umeri",
  core: "Abdomen & Core",
  cardio: "Cardio",
  full_body: "Full Body",
};

export const MUSCLE_GROUP_EMOJIS: Record<MuscleGroup, string> = {
  chest: "🛡️",
  back: "🦅",
  legs: "🦵",
  arms: "💪",
  shoulders: "🚀",
  core: "🎯",
  cardio: "❤️",
  full_body: "🏋️",
};

// Splits / Workout Categories
export type SplitType =
  | "Upper"
  | "Lower"
  | "Push"
  | "Pull"
  | "Legs"
  | "Arms"
  | "Chest"
  | "Back"
  | "Shoulders"
  | "Cardio & Core"
  | "Full Body"
  | "Rest Day";

export interface SplitOption {
  id: SplitType;
  name: string;
  emoji: string;
  description: string;
  targetMuscleGroups: MuscleGroup[];
}

export const SPLIT_OPTIONS: SplitOption[] = [
  {
    id: "Push",
    name: "Push Day",
    emoji: "🔥",
    description: "Piept, Umeri și Triceps",
    targetMuscleGroups: ["chest", "shoulders", "arms"],
  },
  {
    id: "Pull",
    name: "Pull Day",
    emoji: "⚡",
    description: "Spate, Biceps și Deltoid posterior",
    targetMuscleGroups: ["back", "arms", "shoulders"],
  },
  {
    id: "Legs",
    name: "Leg Day",
    emoji: "🦵",
    description: "Cvadriceps, Ischiogambieri, Fesieri și Gambe",
    targetMuscleGroups: ["legs", "core"],
  },
  {
    id: "Upper",
    name: "Upper Body",
    emoji: "💪",
    description: "Partea superioară completă (Piept, Spate, Umeri, Brațe)",
    targetMuscleGroups: ["chest", "back", "shoulders", "arms"],
  },
  {
    id: "Lower",
    name: "Lower Body",
    emoji: "🏋️",
    description: "Partea inferioară + Lombar / Core",
    targetMuscleGroups: ["legs", "core", "back"],
  },
  {
    id: "Chest",
    name: "Chest Day",
    emoji: "🛡️",
    description: "Focus pe Piept și Triceps",
    targetMuscleGroups: ["chest", "arms"],
  },
  {
    id: "Back",
    name: "Back Day",
    emoji: "🦅",
    description: "Focus pe Spate și Biceps",
    targetMuscleGroups: ["back", "arms"],
  },
  {
    id: "Arms",
    name: "Arms Day",
    emoji: "💪",
    description: "Biceps, Triceps și Antebrațe",
    targetMuscleGroups: ["arms"],
  },
  {
    id: "Shoulders",
    name: "Shoulders Day",
    emoji: "🚀",
    description: "Deltoizi anteriori, laterali, posteriori & Trapez",
    targetMuscleGroups: ["shoulders"],
  },
  {
    id: "Cardio & Core",
    name: "Cardio & Core",
    emoji: "🏃",
    description: "Antrenament cardiovascular și Abdomen",
    targetMuscleGroups: ["cardio", "core"],
  },
  {
    id: "Full Body",
    name: "Full Body",
    emoji: "🌟",
    description: "Toate grupele principale într-o singură sesiune",
    targetMuscleGroups: ["chest", "back", "legs", "shoulders", "arms", "core"],
  },
  {
    id: "Rest Day",
    name: "Rest Day",
    emoji: "🧘‍♂️",
    description: "Odihnă, refacere musculară și recuperare",
    targetMuscleGroups: [],
  },
];

// Exercise Model
export interface Exercise {
  id: string;
  name: string;
  muscle_group: MuscleGroup;
  description: string;
  video_url: string | null;
  thumbnail_url: string | null;
}

export interface PlannedExerciseItem {
  id: string; // exercise_id (e.g., 'ex-001')
  name: string;
  muscle_group: MuscleGroup;
}

export interface ParsedWeeklyPlan {
  split: string;
  exercises: PlannedExerciseItem[];
}

export function parseWeeklyPlan(raw: string | null | undefined): ParsedWeeklyPlan {
  if (!raw) {
    return { split: "Rest Day", exercises: [] };
  }

  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object") {
      return {
        split: parsed.split || "Rest Day",
        exercises: Array.isArray(parsed.exercises) ? parsed.exercises : [],
      };
    }
  } catch {
    // Legacy plain text format fallback
    return {
      split: raw,
      exercises: [],
    };
  }

  return { split: raw, exercises: [] };
}

export function serializeWeeklyPlan(split: string, exercises: PlannedExerciseItem[]): string {
  return JSON.stringify({
    split,
    exercises,
  });
}

// Days of the week (0 = Monday, 6 = Sunday)
export const DAYS_OF_WEEK = [
  "Luni",
  "Marți",
  "Miercuri",
  "Joi",
  "Vineri",
  "Sâmbătă",
  "Duminică",
] as const;

export type DayOfWeek = (typeof DAYS_OF_WEEK)[number];

// Workout Log and Sets
export interface WorkoutSet {
  id: string;
  workout_log_id: string;
  exercise_id: string;
  exercise_name: string;
  set_number: number;
  actual_reps: number;
  actual_weight: number;
  is_completed: boolean;
}
