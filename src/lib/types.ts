// ==========================================
// GymBrogress — TypeScript Types
// ==========================================

export interface User {
  id: string;
  email: string;
  name: string;
  created_at: string;
}

// Weekly Planner
export interface WeeklyPlan {
  id: string;
  user_id: string;
  day_of_week: number; // 0 = Monday, 6 = Sunday
  workout_name: string;
  exercises: PlannedExercise[];
}

export interface PlannedExercise {
  exercise_id: string;
  name: string;
  target_sets: number;
  target_reps: number;
  target_weight: number;
}

// Workout Tracker
export interface WorkoutLog {
  id: string;
  user_id: string;
  date: string; // ISO date string
  workout_name: string;
  sets: WorkoutSet[];
  created_at: string;
}

export interface WorkoutSet {
  id: string;
  workout_log_id: string;
  exercise_name: string;
  set_number: number;
  reps: number;
  weight: number;
  is_completed: boolean;
}

// Exercise Library
export interface Exercise {
  id: string;
  name: string;
  muscle_group: MuscleGroup;
  description: string;
  video_url: string | null;
  thumbnail_url: string | null;
}

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
  chest: "Chest",
  back: "Back",
  legs: "Legs",
  arms: "Arms",
  shoulders: "Shoulders",
  core: "Core",
  cardio: "Cardio",
  full_body: "Full Body",
};

export const MUSCLE_GROUP_EMOJIS: Record<MuscleGroup, string> = {
  chest: "🫁",
  back: "🔙",
  legs: "🦵",
  arms: "💪",
  shoulders: "🤷",
  core: "🎯",
  cardio: "❤️",
  full_body: "🏋️",
};

// Days of the week
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

// Notification settings
export interface NotificationSettings {
  enabled: boolean;
  hour: number;
  minute: number;
}
