import type { Exercise, MuscleGroup } from './types'

/** Upper body to lower body, then cardio: the order filters and full lists use. */
export const MUSCLE_GROUPS: MuscleGroup[] = [
  'chest',
  'back',
  'shoulders',
  'biceps',
  'triceps',
  'forearms',
  'core',
  'glutes',
  'quads',
  'hamstrings',
  'calves',
  'cardio',
]

export const MUSCLE_GROUP_LABELS: Record<MuscleGroup, string> = {
  chest: 'Chest',
  back: 'Back',
  shoulders: 'Shoulders',
  biceps: 'Biceps',
  triceps: 'Triceps',
  forearms: 'Forearms',
  core: 'Abs & Core',
  glutes: 'Glutes',
  quads: 'Quads',
  hamstrings: 'Hamstrings',
  calves: 'Calves',
  cardio: 'Cardio',
}

export const MUSCLE_GROUP_EMOJIS: Record<MuscleGroup, string> = {
  chest: '🛡️',
  back: '🦅',
  shoulders: '🚀',
  biceps: '💪',
  triceps: '🦾',
  forearms: '✊',
  core: '🎯',
  glutes: '🍑',
  quads: '🦵',
  hamstrings: '🦿',
  calves: '🦶',
  cardio: '❤️',
}

// Ids are stored in workout history and routines: never renumber or reuse them.
export const EXERCISES: Exercise[] = [
  // Chest
  {
    id: 'ex-001',
    name: 'Barbell Bench Press',
    muscle_group: 'chest',
    description: 'Lying on a flat bench, lower the bar under control to mid-chest and press explosively.',
  },
  {
    id: 'ex-002',
    name: 'Incline Dumbbell Press',
    muscle_group: 'chest',
    description: 'Bench at 30–45°, press the dumbbells over your upper chest and focus on the squeeze.',
  },
  {
    id: 'ex-003',
    name: 'Incline Barbell Bench Press',
    muscle_group: 'chest',
    description: 'Barbell press on an incline bench to build the upper (clavicular) chest.',
  },
  {
    id: 'ex-004',
    name: 'Flat Dumbbell Press',
    muscle_group: 'chest',
    description: 'Dumbbell press on a flat bench; longer range of motion and a deeper stretch.',
  },
  {
    id: 'ex-005',
    name: 'Decline Bench Press',
    muscle_group: 'chest',
    description: 'Press on a decline bench to emphasise the lower chest.',
  },
  {
    id: 'ex-006',
    name: 'Cable Flyes (Cross-over)',
    muscle_group: 'chest',
    description: 'High-to-low or low-to-high cable flyes for constant tension on the chest.',
  },
  {
    id: 'ex-007',
    name: 'Pec Deck / Machine Fly',
    muscle_group: 'chest',
    description: 'Fly machine that isolates the chest without loading the shoulder stabilisers.',
  },
  {
    id: 'ex-008',
    name: 'Chest Dips',
    muscle_group: 'chest',
    description: 'Lean forward on parallel bars to bias the lower chest and triceps.',
  },
  {
    id: 'ex-009',
    name: 'Dumbbell Flyes',
    muscle_group: 'chest',
    description: 'Flat or incline dumbbell flyes for a maximal stretch of the chest fibres.',
  },
  {
    id: 'ex-010',
    name: 'Push-ups',
    muscle_group: 'chest',
    description: 'The classic bodyweight move for chest, shoulders and core stability.',
  },

  // Back
  {
    id: 'ex-011',
    name: 'Conventional Deadlift',
    muscle_group: 'back',
    description: 'The strongest compound lift for the posterior chain: back, glutes and hamstrings.',
  },
  {
    id: 'ex-012',
    name: 'Lat Pulldown',
    muscle_group: 'back',
    description: 'Wide or medium grip, pull the bar to your collarbone and squeeze the shoulder blades.',
  },
  {
    id: 'ex-013',
    name: 'Barbell Bent-Over Row',
    muscle_group: 'back',
    description: 'Bent-over barbell row that builds thickness in the mid back and lats.',
  },
  {
    id: 'ex-014',
    name: 'Pull-ups',
    muscle_group: 'back',
    description: 'Overhand grip; pull your chin over the bar and lower slowly to a full hang.',
  },
  {
    id: 'ex-015',
    name: 'Seated Cable Row',
    muscle_group: 'back',
    description: 'Seated row with a V-handle; drive the elbows back and squeeze at the end.',
  },
  {
    id: 'ex-016',
    name: 'Dumbbell Single-Arm Row',
    muscle_group: 'back',
    description: 'One-arm row braced on a bench; full range of motion and fixes imbalances.',
  },
  {
    id: 'ex-017',
    name: 'T-Bar Row',
    muscle_group: 'back',
    description: 'T-bar row that targets the middle of the back and allows heavy loads.',
  },
  {
    id: 'ex-018',
    name: 'Chest-Supported Row',
    muscle_group: 'back',
    description: 'Row lying face down on an incline bench; takes the load off the lower back.',
  },
  {
    id: 'ex-019',
    name: 'Straight-Arm Lat Pulldown',
    muscle_group: 'back',
    description: 'Pull the cable down with straight arms for pure lat isolation.',
  },
  {
    id: 'ex-020',
    name: 'Back Extension',
    muscle_group: 'back',
    description: 'Extensions on a 45° bench; strengthens the lower back, glutes and hamstrings.',
  },

  // Legs
  {
    id: 'ex-021',
    name: 'Barbell Back Squat',
    muscle_group: 'quads',
    description: 'The classic squat with the bar on your traps; the king of leg exercises.',
  },
  {
    id: 'ex-022',
    name: 'Leg Press',
    muscle_group: 'quads',
    description: 'Machine press that loads the quads heavily without stressing the spine.',
  },
  {
    id: 'ex-023',
    name: 'Romanian Deadlift (RDL)',
    muscle_group: 'hamstrings',
    description: 'Barbell or dumbbell hip hinge focused on the hamstrings and glutes.',
  },
  {
    id: 'ex-024',
    name: 'Bulgarian Split Squat',
    muscle_group: 'quads',
    description: 'Single-leg squat with the rear foot on a bench; builds strength and stability.',
  },
  {
    id: 'ex-025',
    name: 'Leg Extension',
    muscle_group: 'quads',
    description: 'Seated machine extension for direct quad isolation and pump.',
  },
  {
    id: 'ex-026',
    name: 'Lying Leg Curl',
    muscle_group: 'hamstrings',
    description: 'Lying machine curl; excellent isolation for the hamstrings.',
  },
  {
    id: 'ex-027',
    name: 'Seated Leg Curl',
    muscle_group: 'hamstrings',
    description: 'Seated machine curl that trains the hamstrings in a stretched position.',
  },
  {
    id: 'ex-028',
    name: 'Barbell Hip Thrust',
    muscle_group: 'glutes',
    description: 'Hip thrust with your back on a bench; the most effective glute builder.',
  },
  {
    id: 'ex-029',
    name: 'Walking Lunges',
    muscle_group: 'glutes',
    description: 'Lunges with dumbbells in hand; works the quads, glutes and balance.',
  },
  {
    id: 'ex-030',
    name: 'Standing Calf Raises',
    muscle_group: 'calves',
    description: 'Raise onto your toes on a machine or weighted step; builds the gastrocnemius.',
  },
  {
    id: 'ex-031',
    name: 'Seated Calf Raises',
    muscle_group: 'calves',
    description: 'Seated calf raises that target the soleus for thicker calves.',
  },
  {
    id: 'ex-032',
    name: 'Hack Squat',
    muscle_group: 'quads',
    description: 'Guided squat on the hack machine; isolates the quads safely.',
  },
  {
    id: 'ex-067',
    name: 'Cable Glute Kickback',
    muscle_group: 'glutes',
    description: 'Ankle strap on a low cable; kick the leg back and squeeze the glute at the top.',
  },
  {
    id: 'ex-068',
    name: 'Hip Abduction Machine',
    muscle_group: 'glutes',
    description: 'Push the pads apart against resistance to build the side glutes (gluteus medius).',
  },

  // Shoulders
  {
    id: 'ex-033',
    name: 'Overhead Press (OHP)',
    muscle_group: 'shoulders',
    description: 'Standing barbell press overhead; raw strength for shoulders and triceps.',
  },
  {
    id: 'ex-034',
    name: 'Seated Dumbbell Shoulder Press',
    muscle_group: 'shoulders',
    description: 'Seated dumbbell press; a natural path for the front and side delts.',
  },
  {
    id: 'ex-035',
    name: 'Dumbbell Lateral Raises',
    muscle_group: 'shoulders',
    description: 'Lateral raises with dumbbells; the key to wide, round shoulders.',
  },
  {
    id: 'ex-036',
    name: 'Cable Lateral Raises',
    muscle_group: 'shoulders',
    description: 'Cable lateral raises that keep tension from the start to the end of the rep.',
  },
  {
    id: 'ex-037',
    name: 'Face Pulls',
    muscle_group: 'shoulders',
    description: 'Rope pulls to eye level; essential for shoulder health, rear delts and traps.',
  },
  {
    id: 'ex-038',
    name: 'Reverse Pec Deck',
    muscle_group: 'shoulders',
    description: 'Reverse fly machine for the rear delts.',
  },
  {
    id: 'ex-039',
    name: 'Arnold Press',
    muscle_group: 'shoulders',
    description: 'Press with a wrist rotation that works all three heads of the delts.',
  },
  {
    id: 'ex-040',
    name: 'Shrugs (Barbell / Dumbbell)',
    muscle_group: 'shoulders',
    description: 'Shrug the weight towards your ears to build the upper traps.',
  },

  // Biceps and triceps
  {
    id: 'ex-041',
    name: 'Barbell Bicep Curl',
    muscle_group: 'biceps',
    description: 'Straight or EZ-bar curls; the foundation of bicep mass.',
  },
  {
    id: 'ex-042',
    name: 'Incline Dumbbell Curl',
    muscle_group: 'biceps',
    description: 'Curls on a 60° incline bench that fully stretch the long head of the biceps.',
  },
  {
    id: 'ex-043',
    name: 'Hammer Curl',
    muscle_group: 'biceps',
    description: 'Neutral grip curls for the brachialis and brachioradialis.',
  },
  {
    id: 'ex-044',
    name: 'Preacher Curl',
    muscle_group: 'biceps',
    description: 'Arms braced on a preacher bench, removing momentum to isolate the biceps.',
  },
  {
    id: 'ex-045',
    name: 'Cable Bicep Curl',
    muscle_group: 'biceps',
    description: 'Cable curls with a short bar or rope for even tension.',
  },
  {
    id: 'ex-046',
    name: 'Triceps Rope Pushdown',
    muscle_group: 'triceps',
    description: 'Rope pushdowns; spread the rope at the bottom to hit the lateral head.',
  },
  {
    id: 'ex-047',
    name: 'Straight Bar Triceps Pushdown',
    muscle_group: 'triceps',
    description: 'Pushdowns with a straight or V-bar for maximum pressing strength.',
  },
  {
    id: 'ex-048',
    name: 'Skull Crushers',
    muscle_group: 'triceps',
    description: 'Lying on a bench, lower an EZ bar towards your forehead; great for the long head.',
  },
  {
    id: 'ex-049',
    name: 'Close-Grip Bench Press',
    muscle_group: 'triceps',
    description: 'Shoulder-width bench press; heavy compound work for triceps and inner chest.',
  },
  {
    id: 'ex-050',
    name: 'Overhead Dumbbell Triceps Extension',
    muscle_group: 'triceps',
    description: 'One dumbbell held overhead with both hands; deep stretch on the long head.',
  },

  // Forearms
  {
    id: 'ex-063',
    name: 'Wrist Curl',
    muscle_group: 'forearms',
    description: 'Forearms resting on a bench, palms up; curl the weight using only your wrists.',
  },
  {
    id: 'ex-064',
    name: 'Reverse Wrist Curl',
    muscle_group: 'forearms',
    description: 'Same as the wrist curl with palms down, for the top of the forearm.',
  },
  {
    id: 'ex-065',
    name: 'Reverse Barbell Curl',
    muscle_group: 'forearms',
    description: 'Overhand-grip curls that build the brachioradialis and grip strength.',
  },
  {
    id: 'ex-066',
    name: "Farmer's Walk",
    muscle_group: 'forearms',
    description: 'Walk with heavy dumbbells or handles at your sides; brutal for grip and traps.',
  },

  // Core
  {
    id: 'ex-051',
    name: 'Hanging Leg Raise',
    muscle_group: 'core',
    description: 'Hang from a bar and raise your legs or knees towards your chest; lower abs.',
  },
  {
    id: 'ex-052',
    name: 'Cable Crunch',
    muscle_group: 'core',
    description: 'Kneel at a cable with the rope behind your head and crunch against resistance.',
  },
  {
    id: 'ex-053',
    name: 'Ab Wheel Rollout',
    muscle_group: 'core',
    description: 'Roll the wheel forward from your knees; brutal work for the whole abdominal wall.',
  },
  {
    id: 'ex-054',
    name: 'Plank',
    muscle_group: 'core',
    description: 'Forearm hold that builds endurance, spinal stability and deep core strength.',
  },
  {
    id: 'ex-055',
    name: 'Russian Twist',
    muscle_group: 'core',
    description: 'Seated torso rotations, with or without a weight, for the obliques.',
  },
  {
    id: 'ex-056',
    name: 'Decline Bench Sit-ups',
    muscle_group: 'core',
    description: 'Sit-ups on a decline bench with full range and a held squeeze.',
  },

  // Cardio
  {
    id: 'ex-057',
    name: 'Incline Treadmill Walk',
    muscle_group: 'cardio',
    description: 'Brisk walk on a steep incline (10–15%); burns fat while sparing muscle.',
  },
  {
    id: 'ex-058',
    name: 'Treadmill Running / Sprints',
    muscle_group: 'cardio',
    description: 'Tempo runs or HIIT intervals for intense conditioning.',
  },
  {
    id: 'ex-059',
    name: 'Stairmaster',
    muscle_group: 'cardio',
    description: 'Stair climbing; burns a lot of calories and works glutes and legs.',
  },
  {
    id: 'ex-060',
    name: 'Stationary Bike',
    muscle_group: 'cardio',
    description: 'Steady-state or interval cycling with low impact on the joints.',
  },
  {
    id: 'ex-061',
    name: 'Rowing Machine',
    muscle_group: 'cardio',
    description: 'Full-body cardio that uses the back, legs and arms.',
  },
  {
    id: 'ex-062',
    name: 'Jump Rope',
    muscle_group: 'cardio',
    description: 'Skipping for agility, coordination and a fast calorie burn.',
  },
]

const EXERCISE_BY_ID = new Map(EXERCISES.map((e) => [e.id, e]))

export function getExercise(id: string): Exercise | undefined {
  return EXERCISE_BY_ID.get(id)
}

/**
 * Exercises matching the query and filter, grouped by muscle group in `groupOrder`
 * (groups missing from it go last).
 */
export function searchExercises(
  query: string,
  filter: (e: Exercise) => boolean = () => true,
  groupOrder: MuscleGroup[] = MUSCLE_GROUPS
): Exercise[] {
  const q = query.trim().toLowerCase()
  const rank = (e: Exercise) => {
    const index = groupOrder.indexOf(e.muscle_group)
    return index === -1 ? groupOrder.length : index
  }
  return EXERCISES.filter(
    (e) => filter(e) && (!q || e.name.toLowerCase().includes(q) || e.description.toLowerCase().includes(q))
  ).sort((a, b) => rank(a) - rank(b))
}
