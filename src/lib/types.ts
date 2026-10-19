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

// ==========================================
// Routine Templates & Master Splits
// ==========================================
export type RoutineTemplatesMap = Record<string, PlannedExerciseItem[]>;

export const DEFAULT_ROUTINE_TEMPLATES: RoutineTemplatesMap = {
  Push: [
    { id: "ex-002", name: "Incline Dumbbell Press", muscle_group: "chest" },
    { id: "ex-001", name: "Barbell Bench Press", muscle_group: "chest" },
    { id: "ex-006", name: "Cable Flyes (Cross-over)", muscle_group: "chest" },
    { id: "ex-032", name: "Dumbbell Shoulder Press", muscle_group: "shoulders" },
    { id: "ex-033", name: "Dumbbell Lateral Raises", muscle_group: "shoulders" },
    { id: "ex-047", name: "Tricep Rope Pushdown", muscle_group: "arms" },
  ],
  Pull: [
    { id: "ex-012", name: "Lat Pulldown (Tracțiuni la scripete)", muscle_group: "back" },
    { id: "ex-013", name: "Barbell Bent-Over Row", muscle_group: "back" },
    { id: "ex-015", name: "Seated Cable Row", muscle_group: "back" },
    { id: "ex-034", name: "Face Pulls", muscle_group: "shoulders" },
    { id: "ex-041", name: "Barbell Bicep Curl", muscle_group: "arms" },
    { id: "ex-043", name: "Hammer Curls", muscle_group: "arms" },
  ],
  Legs: [
    { id: "ex-021", name: "Barbell Back Squat", muscle_group: "legs" },
    { id: "ex-022", name: "Romanian Deadlift (RDL)", muscle_group: "legs" },
    { id: "ex-023", name: "Leg Press (Presa de picioare)", muscle_group: "legs" },
    { id: "ex-025", name: "Lying Leg Curl (Flexia picioarelor)", muscle_group: "legs" },
    { id: "ex-026", name: "Leg Extension (Extensia picioarelor)", muscle_group: "legs" },
    { id: "ex-028", name: "Standing Calf Raises", muscle_group: "legs" },
  ],
  Upper: [
    { id: "ex-001", name: "Barbell Bench Press", muscle_group: "chest" },
    { id: "ex-012", name: "Lat Pulldown (Tracțiuni la scripete)", muscle_group: "back" },
    { id: "ex-032", name: "Dumbbell Shoulder Press", muscle_group: "shoulders" },
    { id: "ex-015", name: "Seated Cable Row", muscle_group: "back" },
    { id: "ex-042", name: "Incline Dumbbell Curl", muscle_group: "arms" },
    { id: "ex-047", name: "Tricep Rope Pushdown", muscle_group: "arms" },
  ],
  Lower: [
    { id: "ex-021", name: "Barbell Back Squat", muscle_group: "legs" },
    { id: "ex-022", name: "Romanian Deadlift (RDL)", muscle_group: "legs" },
    { id: "ex-024", name: "Bulgarian Split Squat", muscle_group: "legs" },
    { id: "ex-025", name: "Lying Leg Curl (Flexia picioarelor)", muscle_group: "legs" },
    { id: "ex-051", name: "Hanging Leg Raises", muscle_group: "core" },
    { id: "ex-028", name: "Standing Calf Raises", muscle_group: "legs" },
  ],
  Arms: [
    { id: "ex-041", name: "Barbell Bicep Curl", muscle_group: "arms" },
    { id: "ex-042", name: "Incline Dumbbell Curl", muscle_group: "arms" },
    { id: "ex-045", name: "Preacher Curl", muscle_group: "arms" },
    { id: "ex-049", name: "Close-Grip Bench Press", muscle_group: "arms" },
    { id: "ex-048", name: "Skull Crushers (Extensii franceze)", muscle_group: "arms" },
    { id: "ex-047", name: "Tricep Rope Pushdown", muscle_group: "arms" },
  ],
  Chest: [
    { id: "ex-001", name: "Barbell Bench Press", muscle_group: "chest" },
    { id: "ex-002", name: "Incline Dumbbell Press", muscle_group: "chest" },
    { id: "ex-008", name: "Chest Dips (Flotări la paralele)", muscle_group: "chest" },
    { id: "ex-006", name: "Cable Flyes (Cross-over)", muscle_group: "chest" },
    { id: "ex-010", name: "Push-ups (Flotări la sol)", muscle_group: "chest" },
  ],
  Back: [
    { id: "ex-011", name: "Conventional Deadlift", muscle_group: "back" },
    { id: "ex-013", name: "Barbell Bent-Over Row", muscle_group: "back" },
    { id: "ex-012", name: "Lat Pulldown (Tracțiuni la scripete)", muscle_group: "back" },
    { id: "ex-015", name: "Seated Cable Row", muscle_group: "back" },
    { id: "ex-016", name: "Dumbbell Single-Arm Row", muscle_group: "back" },
  ],
  Shoulders: [
    { id: "ex-031", name: "Overhead Barbell Press (OHP)", muscle_group: "shoulders" },
    { id: "ex-032", name: "Dumbbell Shoulder Press", muscle_group: "shoulders" },
    { id: "ex-033", name: "Dumbbell Lateral Raises", muscle_group: "shoulders" },
    { id: "ex-034", name: "Face Pulls", muscle_group: "shoulders" },
    { id: "ex-037", name: "Dumbbell Rear Delt Fly", muscle_group: "shoulders" },
  ],
  "Cardio & Core": [
    { id: "ex-061", name: "Treadmill Incline Walk / Run", muscle_group: "cardio" },
    { id: "ex-053", name: "Plank (Scândura)", muscle_group: "core" },
    { id: "ex-051", name: "Hanging Leg Raises", muscle_group: "core" },
    { id: "ex-052", name: "Cable Woodchoppers", muscle_group: "core" },
    { id: "ex-054", name: "Abdominal Crunches", muscle_group: "core" },
  ],
  "Full Body": [
    { id: "ex-021", name: "Barbell Back Squat", muscle_group: "legs" },
    { id: "ex-001", name: "Barbell Bench Press", muscle_group: "chest" },
    { id: "ex-013", name: "Barbell Bent-Over Row", muscle_group: "back" },
    { id: "ex-032", name: "Dumbbell Shoulder Press", muscle_group: "shoulders" },
    { id: "ex-022", name: "Romanian Deadlift (RDL)", muscle_group: "legs" },
    { id: "ex-051", name: "Hanging Leg Raises", muscle_group: "core" },
  ],
  "Rest Day": [],
};

export function getExercisesForSplit(
  split: string,
  userTemplates?: RoutineTemplatesMap | null
): PlannedExerciseItem[] {
  if (!split || split.toLowerCase().includes("rest") || split.toLowerCase().includes("odihn") || split.toLowerCase().includes("pauz")) {
    return [];
  }

  // Find matching key (e.g. "Push Day" or "Push")
  const normalizedKey = Object.keys(DEFAULT_ROUTINE_TEMPLATES).find(
    (k) => k.toLowerCase() === split.toLowerCase() || split.toLowerCase().startsWith(k.toLowerCase())
  );

  if (userTemplates && normalizedKey && userTemplates[normalizedKey]) {
    return userTemplates[normalizedKey];
  }

  if (normalizedKey && DEFAULT_ROUTINE_TEMPLATES[normalizedKey]) {
    return DEFAULT_ROUTINE_TEMPLATES[normalizedKey];
  }

  return [];
}

export const SPLIT_INDEX_MAP: Record<string, number> = {
  Push: 100,
  Pull: 101,
  Legs: 102,
  Upper: 103,
  Lower: 104,
  Arms: 105,
  Chest: 106,
  Back: 107,
  Shoulders: 108,
  "Cardio & Core": 109,
  "Full Body": 110,
};

// ==========================================
// Flexible Monthly Calendar Plans
// ==========================================
export type WorkStatus = "work" | "off" | "none";

export interface CalendarDayPlan {
  date: string; // YYYY-MM-DD
  workStatus: WorkStatus;
  split: SplitType | null; // null = follow weekly schedule
}

export type CalendarPlansMap = Record<string, CalendarDayPlan>;

export function serializeCalendarWorkout(
  split: SplitType | null,
  workStatus: WorkStatus
): string {
  return JSON.stringify({
    split: split ?? null,
    workStatus: workStatus ?? "none",
  });
}

export function parseCalendarWorkout(raw: string | null | undefined): {
  split: SplitType | null;
  workStatus: WorkStatus;
} {
  if (!raw) return { split: null, workStatus: "none" };
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object") {
      return {
        split: parsed.split ?? null,
        workStatus: parsed.workStatus ?? "none",
      };
    }
  } catch {
    // Plain text split (e.g. legacy logs)
    return {
      split: raw as SplitType,
      workStatus: "none",
    };
  }
  return { split: raw as SplitType, workStatus: "none" };
}


