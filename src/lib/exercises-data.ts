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
  {
    id: 'ex-069',
    name: 'Machine Chest Press',
    muscle_group: 'chest',
    description: 'Seated machine press; a stable way to push the chest hard close to failure.',
  },
  {
    id: 'ex-070',
    name: 'Incline Machine Press',
    muscle_group: 'chest',
    description: 'Plate-loaded or selectorised incline press for the upper chest, no balancing needed.',
  },
  {
    id: 'ex-071',
    name: 'Smith Machine Bench Press',
    muscle_group: 'chest',
    description: 'Flat press on the guided bar; easy to load heavy and train without a spotter.',
  },
  {
    id: 'ex-072',
    name: 'Incline Smith Machine Press',
    muscle_group: 'chest',
    description: 'Bench at 30–45° under the Smith bar; steady, heavy work for the upper chest.',
  },
  {
    id: 'ex-073',
    name: 'Low-to-High Cable Fly',
    muscle_group: 'chest',
    description: 'Cables set low, sweep the handles up and together to chin height; targets the upper chest.',
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
  {
    id: 'ex-074',
    name: 'Chin-ups',
    muscle_group: 'back',
    description: 'Underhand-grip pull-ups; more biceps involvement and a strong lat contraction.',
  },
  {
    id: 'ex-075',
    name: 'Close-Grip Lat Pulldown (V-Bar)',
    muscle_group: 'back',
    description: 'Pulldown with a V-handle and neutral grip; long range of motion for the lats.',
  },
  {
    id: 'ex-076',
    name: 'Machine Row',
    muscle_group: 'back',
    description: 'Chest-padded row machine; easy to load heavy and isolate the mid back.',
  },
  {
    id: 'ex-077',
    name: 'Pendlay Row',
    muscle_group: 'back',
    description: 'Barbell row from the floor on every rep with a flat back; explosive upper-back strength.',
  },
  {
    id: 'ex-078',
    name: 'Inverted Row',
    muscle_group: 'back',
    description: 'Bodyweight row under a bar or Smith machine; scale it by changing your body angle.',
  },
  {
    id: 'ex-079',
    name: 'Assisted Pull-up Machine',
    muscle_group: 'back',
    description: 'Pull-ups with a counterweight under your knees; build up to bodyweight reps.',
  },
  {
    id: 'ex-080',
    name: 'Dumbbell Pullover',
    muscle_group: 'back',
    description: 'Lying across a bench, lower one dumbbell behind your head and pull it back over your chest.',
  },
  {
    id: 'ex-081',
    name: 'Sumo Deadlift',
    muscle_group: 'back',
    description: 'Wide stance with hands inside the knees; more legs and glutes, a shorter pull.',
  },
  {
    id: 'ex-082',
    name: 'Rack Pull',
    muscle_group: 'back',
    description: 'Deadlift from pins around knee height; heavy work for the upper back and lockout.',
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
  {
    id: 'ex-083',
    name: 'Front Squat',
    muscle_group: 'quads',
    description: 'Bar racked on the front of your shoulders; upright torso, more quads, less lower back.',
  },
  {
    id: 'ex-084',
    name: 'Pendulum Squat',
    muscle_group: 'quads',
    description: 'Machine squat on a swinging arc; a deep knee bend and huge quad tension with your back supported.',
  },
  {
    id: 'ex-085',
    name: 'Smith Machine Squat',
    muscle_group: 'quads',
    description: 'Squat on the guided bar with your feet slightly forward to keep the quads working.',
  },
  {
    id: 'ex-086',
    name: 'Goblet Squat',
    muscle_group: 'quads',
    description: 'Hold a dumbbell or kettlebell at your chest and squat deep; great for learning the squat.',
  },
  {
    id: 'ex-087',
    name: 'Belt Squat',
    muscle_group: 'quads',
    description: 'The weight hangs from a hip belt, loading the legs without loading the spine.',
  },
  {
    id: 'ex-088',
    name: 'Safety Bar Squat',
    muscle_group: 'quads',
    description: 'Squat with the padded, cambered safety bar; easier on the shoulders, more upper back.',
  },
  {
    id: 'ex-089',
    name: 'Sissy Squat',
    muscle_group: 'quads',
    description: 'Lean back as your knees travel forward; quad isolation with a deep stretch.',
  },
  {
    id: 'ex-090',
    name: 'Step-ups',
    muscle_group: 'quads',
    description: 'Step onto a box or bench with dumbbells in hand; single-leg work for the quads and glutes.',
  },
  {
    id: 'ex-091',
    name: 'Stiff-Leg Deadlift',
    muscle_group: 'hamstrings',
    description: 'Near-straight knees with the bar lowered towards the floor; a long stretch for the hamstrings.',
  },
  {
    id: 'ex-092',
    name: 'Good Morning',
    muscle_group: 'hamstrings',
    description: 'Bar on your back, hinge forward with soft knees; hamstrings and lower back.',
  },
  {
    id: 'ex-093',
    name: 'Single-Leg Romanian Deadlift',
    muscle_group: 'hamstrings',
    description: 'Hinge on one leg holding a dumbbell; hamstrings, glutes and balance.',
  },
  {
    id: 'ex-094',
    name: 'Standing Leg Curl',
    muscle_group: 'hamstrings',
    description: 'One leg at a time on the standing curl machine; fixes left-right imbalances.',
  },
  {
    id: 'ex-095',
    name: 'Nordic Hamstring Curl',
    muscle_group: 'hamstrings',
    description: 'Kneel with your ankles held and lower your body forward slowly; eccentric hamstring strength.',
  },
  {
    id: 'ex-096',
    name: 'Glute-Ham Raise',
    muscle_group: 'hamstrings',
    description: 'On the GHD, curl your body up from horizontal using the hamstrings.',
  },
  {
    id: 'ex-097',
    name: 'Glute Bridge',
    muscle_group: 'glutes',
    description: 'A hip thrust with your back on the floor; bodyweight activation or loaded with a bar.',
  },
  {
    id: 'ex-098',
    name: 'Hip Thrust Machine',
    muscle_group: 'glutes',
    description: 'Plate- or pin-loaded hip thrust; quick to set up with the same glute squeeze.',
  },
  {
    id: 'ex-099',
    name: 'Cable Pull-Through',
    muscle_group: 'glutes',
    description: 'Facing away from a low cable, hinge and drive the hips forward; teaches the hip hinge.',
  },
  {
    id: 'ex-100',
    name: 'Reverse Lunge',
    muscle_group: 'glutes',
    description: 'Step back into each lunge; easier on the knees and heavy on the glutes.',
  },
  {
    id: 'ex-101',
    name: 'Hip Adduction Machine',
    muscle_group: 'glutes',
    description: 'Squeeze the pads together to train the inner thighs (adductors).',
  },
  {
    id: 'ex-102',
    name: 'Leg Press Calf Raise',
    muscle_group: 'calves',
    description: 'Calf raises on the leg press platform; easy to load heavy through a full range.',
  },
  {
    id: 'ex-103',
    name: 'Donkey Calf Raise',
    muscle_group: 'calves',
    description: 'Hinged at the hips, raise onto your toes; a deep stretch on the calves.',
  },
  {
    id: 'ex-104',
    name: 'Tibialis Raise',
    muscle_group: 'calves',
    description: 'Lean back against a wall and lift your toes; trains the shins for knee and ankle health.',
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
  {
    id: 'ex-105',
    name: 'Reverse Cable Fly',
    muscle_group: 'shoulders',
    description: 'Cross the cables at shoulder height and pull them apart with straight arms; isolates the rear delts.',
  },
  {
    id: 'ex-106',
    name: 'Bent-Over Dumbbell Reverse Fly',
    muscle_group: 'shoulders',
    description: 'Hinge forward and raise the dumbbells out to the sides; rear delts and upper back.',
  },
  {
    id: 'ex-107',
    name: 'Machine Shoulder Press',
    muscle_group: 'shoulders',
    description: 'Seated machine press; a stable way to load the front delts hard.',
  },
  {
    id: 'ex-108',
    name: 'Machine Lateral Raise',
    muscle_group: 'shoulders',
    description: 'Seated lateral raise machine; constant tension on the side delts.',
  },
  {
    id: 'ex-109',
    name: 'Dumbbell Front Raise',
    muscle_group: 'shoulders',
    description: 'Raise the dumbbells to eye level in front of you; isolates the front delts.',
  },
  {
    id: 'ex-110',
    name: 'Upright Row',
    muscle_group: 'shoulders',
    description: 'Pull a bar or cable up along your body to chest height, elbows high; side delts and traps.',
  },
  {
    id: 'ex-111',
    name: 'Landmine Press',
    muscle_group: 'shoulders',
    description: 'Press one end of a barbell up and forward; shoulder-friendly pressing.',
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
    id: 'ex-112',
    name: 'Dumbbell Curl',
    muscle_group: 'biceps',
    description: 'Standing or seated, curl both dumbbells together or alternating; the go-to biceps builder.',
  },
  {
    id: 'ex-113',
    name: 'Concentration Curl',
    muscle_group: 'biceps',
    description: 'Seated with your elbow braced on your inner thigh; a strict single-arm curl.',
  },
  {
    id: 'ex-114',
    name: 'Spider Curl',
    muscle_group: 'biceps',
    description: 'Chest down on an incline bench with your arms hanging; curls with no swing.',
  },
  {
    id: 'ex-115',
    name: 'Bayesian Cable Curl',
    muscle_group: 'biceps',
    description: 'Facing away from a low cable, curl with your arm behind you; biceps in a long stretch.',
  },
  {
    id: 'ex-116',
    name: 'Machine Bicep Curl',
    muscle_group: 'biceps',
    description: 'Selectorised curl machine with arms on a pad; easy to take close to failure.',
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
  {
    id: 'ex-117',
    name: 'Overhead Cable Triceps Extension',
    muscle_group: 'triceps',
    description: 'Facing away from the cable, extend the rope overhead; constant tension on the long head.',
  },
  {
    id: 'ex-118',
    name: 'Triceps Dips',
    muscle_group: 'triceps',
    description: 'Upright torso and elbows tucked on parallel bars or a bench; shifts the dip onto the triceps.',
  },
  {
    id: 'ex-119',
    name: 'Dumbbell Triceps Kickback',
    muscle_group: 'triceps',
    description: 'Hinged forward, extend the dumbbell back until your arm is straight and squeeze.',
  },
  {
    id: 'ex-120',
    name: 'Single-Arm Cable Pushdown',
    muscle_group: 'triceps',
    description: 'One-handed pushdown with a D-handle; fixes left-right imbalances.',
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
  {
    id: 'ex-121',
    name: 'Dead Hang',
    muscle_group: 'forearms',
    description: 'Hang from a pull-up bar for as long as you can; grip endurance and shoulder health.',
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
  {
    id: 'ex-122',
    name: 'Lying Leg Raise',
    muscle_group: 'core',
    description: 'On your back, raise straight legs to vertical without arching your lower back.',
  },
  {
    id: 'ex-123',
    name: 'Crunches',
    muscle_group: 'core',
    description: 'Curl your shoulders off the floor towards your hips; simple upper-abs work.',
  },
  {
    id: 'ex-124',
    name: 'Side Plank',
    muscle_group: 'core',
    description: 'Hold a straight line on one forearm; obliques and side core stability.',
  },
  {
    id: 'ex-125',
    name: 'Dead Bug',
    muscle_group: 'core',
    description: 'On your back, lower the opposite arm and leg while keeping your lower back flat.',
  },
  {
    id: 'ex-126',
    name: 'Pallof Press',
    muscle_group: 'core',
    description: 'Press a cable straight out from your chest and resist the twist; anti-rotation core work.',
  },
  {
    id: 'ex-127',
    name: 'Cable Woodchopper',
    muscle_group: 'core',
    description: 'Rotate a cable diagonally across your body; obliques and rotational power.',
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
  {
    id: 'ex-128',
    name: 'Elliptical',
    muscle_group: 'cardio',
    description: 'Low-impact, full-body cardio on the cross trainer.',
  },
  {
    id: 'ex-129',
    name: 'Air Bike',
    muscle_group: 'cardio',
    description: 'Fan bike driven by both arms and legs; brutal for intervals.',
  },
  {
    id: 'ex-130',
    name: 'Sled Push',
    muscle_group: 'cardio',
    description: 'Drive a loaded sled across the floor; leg power and conditioning.',
  },
  {
    id: 'ex-131',
    name: 'Burpees',
    muscle_group: 'cardio',
    description: 'Squat, plank, push-up and jump in one move; fast full-body conditioning.',
  },
  {
    id: 'ex-132',
    name: 'Swimming',
    muscle_group: 'cardio',
    description: 'Full-body, joint-friendly cardio in the pool.',
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
