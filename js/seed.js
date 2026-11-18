/* seed.js — starter content. Tricks, challenges and parks load on first run.
   Everything labelled "sample" is made-up demo content, not real-world information. */

const LEVELS = ['Beginner', 'Intermediate', 'Advanced', 'Expert'];
const TRICK_STATUSES = ['Not Started', 'Learning', 'Practicing', 'Landed', 'Mastered'];
const DIFFICULTY_LABEL = { Beginner: 'Easy', Intermediate: 'Medium', Advanced: 'Hard', Expert: 'Very hard' };

// [name, category, description, learning note]
const TRICK_DATA = [
  ['Ollie', 'Beginner', 'The base of most street tricks. Pop the tail, slide your front foot up, and level the board in the air.', 'Practice popping while standing on grass or carpet first so the board stays still.'],
  ['Shuvit', 'Beginner', 'The board spins 180 degrees under your feet while you stay facing the same way.', 'Scoop the tail backward with your back foot and keep your shoulders square.'],
  ['Manual', 'Beginner', 'Balance on the back wheels while rolling.', 'Find the balance point by rolling slowly and lifting the front wheels a little.'],
  ['Kickturn', 'Beginner', 'Lift the front wheels and turn by pivoting on the back wheels.', 'Press the tail down gently and look where you want to turn.'],
  ['Fakie', 'Beginner', 'Rolling backward on your board while staying in your normal stance.', 'Get comfortable rolling fakie on flat ground before trying tricks with it.'],
  ['Tic Tac', 'Beginner', 'Swing the nose side to side to gain speed or change direction.', 'Lift the front wheels slightly and swing your hips, not just your feet.'],
  ['Pop Shuvit', 'Intermediate', 'A shuvit with an extra pop so the board lifts off the ground as it spins.', 'Make your shuvit consistent first, then add the pop.'],
  ['Frontside 180', 'Intermediate', 'Turn your body and board 180 degrees with your chest opening to the front.', 'Wind up your shoulders and look over your lead shoulder.'],
  ['Backside 180', 'Intermediate', 'Turn 180 degrees with your back leading the rotation.', 'Keep your weight centered and land on the bolts.'],
  ['Kickflip', 'Intermediate', 'An ollie where your front foot flicks the board into a full flip.', 'Flick off the corner of the nose, not straight forward.'],
  ['Heelflip', 'Intermediate', 'The opposite of the kickflip. Your heel kicks the board to flip it.', 'Aim your front foot slightly off the edge and push out with your heel.'],
  ['Boardslide', 'Intermediate', 'Slide the middle of your board along a ledge or rail.', 'Start on a low, wide curb to build confidence.'],
  ['Varial Kickflip', 'Advanced', 'A kickflip combined with a pop shuvit.', 'Land kickflips and pop shuvits reliably before combining them.'],
  ['Hardflip', 'Advanced', 'A frontside pop shuvit combined with a kickflip so the board flips through your legs.', 'Let the board come to you. Do not chase it.'],
  ['360 Flip', 'Advanced', 'A kickflip plus a 360 degree board spin, also called a tre flip.', 'The back foot controls the spin, the front foot controls the flip.'],
  ['Frontside Boardslide', 'Advanced', 'Slide a ledge or rail with the board turned frontside over the obstacle.', 'Commit your shoulders and keep your weight over the board.'],
  ['Backside Tailslide', 'Advanced', 'Slide on the tail of the board with a backside approach.', 'Get your tail over the edge, then lock in with your back foot.'],
  ['Smith Grind', 'Advanced', 'Grind on the back truck while the front of the board hangs below the edge.', 'Practice on a low curb first.'],
  ['Laser Flip', 'Expert', 'A 360 shuvit combined with a heelflip.', 'Practice heelflips and 360 shuvits separately.'],
  ['Bigspin', 'Expert', 'A 360 shuvit with a 180 body rotation.', 'Turn your body with the board and stay balanced over it.'],
  ['Impossible', 'Expert', 'The board wraps around your back foot in a vertical flip.', 'Wrap the board with your back foot and keep it close.'],
  ['360 Hardflip', 'Expert', 'A hardflip with a full 360 board rotation.', 'Expect many tries. Break it into pieces.'],
  ['Advanced Grind Variations', 'Expert', 'Combinations of grinds such as feeble, nosegrind and crooked grind.', 'Pick one grind at a time and master it on a low obstacle.']
];

const DEFAULT_CHECKLIST = ['Learn the foot placement', 'Practice the motion while standing still', 'Try it rolling slowly', 'Land it with both feet and roll away', 'Land it 5 times in a row'];

function buildDefaultTricks() {
  return TRICK_DATA.map(([name, category, description, notes], i) => ({
    id: 'trick_' + (i + 1),
    name, category, description, notes,
    difficulty: DIFFICULTY_LABEL[category],
    status: 'Not Started',
    attempts: 0, landings: 0, firstLanded: '',
    checklist: DEFAULT_CHECKLIST.map(text => ({ text, done: false })),
    personalNotes: '',
    custom: false
  }));
}

function buildDefaultSkateparks() {
  const base = { image: '', rating: 0, notes: '', visited: false, visitedDate: '', favorite: false, bucket: false, sample: true };
  return [
    { name: 'Sample Street Plaza', parkType: 'Street Skatepark', difficulty: 'Intermediate', description: 'Sample entry. A street-style plaza with ledges and stairs. Replace with a real park near you.', facilities: 'Sample: ledges, stairs, manual pad' },
    { name: 'Sample Concrete Bowl', parkType: 'Concrete Skatepark', difficulty: 'Advanced', description: 'Sample entry. A smooth concrete bowl for flow and transition skating.', facilities: 'Sample: bowl, quarter pipes' },
    { name: 'Sample Indoor Hall', parkType: 'Indoor Skatepark', difficulty: 'Beginner', description: 'Sample entry. An indoor park for rainy days and learning basics.', facilities: 'Sample: flat ground, small ramps' },
    { name: 'Sample Neighborhood Park', parkType: 'Outdoor Skatepark', difficulty: 'Beginner', description: 'Sample entry. A relaxed outdoor spot with open space for cruising.', facilities: 'Sample: open flat area, small rail' },
    { name: 'Sample DIY Spot', parkType: 'DIY Skatepark', difficulty: 'Intermediate', description: 'Sample entry. A community-built DIY spot. Always ask before building or skating on private land.', facilities: 'Sample: hand-built banks' },
    { name: 'Sample Transition Park', parkType: 'Concrete Skatepark', difficulty: 'Expert', description: 'Sample entry. A bigger park with fast lines for experienced skaters.', facilities: 'Sample: pool coping, hips' }
  ].map((p, i) => Object.assign({ id: 'park_' + (i + 1), location: 'Add your own location' }, base, p));
}

function buildDefaultChallenges() {
  const mk = (id, name, description, difficulty, target, unit, metric, days, extra = {}) =>
    Object.assign({ id, name, description, difficulty, target, unit, metric, durationDays: days, status: 'available', progress: 0, startDate: '', endDate: '', completedDate: '', custom: false }, extra);
  return [
    mk('ch_1', 'Practice Ollies for 7 Days', 'Work on your ollie once a day for a week. Add +1 each day you practice.', 'Beginner', 7, 'days', 'manual', 7),
    mk('ch_2', 'Land 5 New Tricks', 'Land five tricks for the first time while this challenge is active.', 'Intermediate', 5, 'tricks', 'tricksLanded', 30),
    mk('ch_3', 'Skate 10 Hours This Month', 'Log 10 hours of sessions before the month ends.', 'Intermediate', 10, 'hours', 'hours', 30),
    mk('ch_4', 'Complete 5 Skate Sessions', 'Log five sessions in the Skate Sessions page.', 'Beginner', 5, 'sessions', 'sessions', 30),
    mk('ch_5', 'Learn Your First Kickflip', 'Mark the Kickflip as landed in the Trick Library.', 'Intermediate', 1, 'trick', 'trick', 60, { metricArg: 'Kickflip' }),
    mk('ch_6', 'Visit 3 Skateparks', 'Mark three skateparks as visited.', 'Beginner', 3, 'parks', 'parks', 60),
    mk('ch_7', 'Practice Every Day for One Week', 'Log a session seven days in a row.', 'Advanced', 7, 'days', 'streak', 14)
  ];
}

const QUOTES = [
  'Every skater has fallen. The good ones get back on the board.',
  'Progress is landing the trick you were scared of last week.',
  'Skate for fun first. The tricks will follow.',
  'Small sessions add up. Show up, roll around, try one more time.',
  'Fall seven times, land it on the eighth.',
  'Your board does not care how fast you learn. Keep rolling.',
  'The best session is the one where you lose track of time.'
];

const COMMUNITY_DEMO = {
  skaters: [
    { name: 'Mika R.', style: 'Street', level: 'Advanced', blurb: 'Loves ledge lines and filming clips with friends.' },
    { name: 'Theo B.', style: 'Park', level: 'Intermediate', blurb: 'Working on kickflips every weekend.' },
    { name: 'Lia S.', style: 'Cruising', level: 'Beginner', blurb: 'Started skating this year. Loves sunset sessions.' },
    { name: 'Dani K.', style: 'Freestyle', level: 'Expert', blurb: 'Flatground combos and creative lines.' }
  ],
  tips: [
    { id: 'tip_1', text: 'Warm up your ankles and wrists for 5 minutes before you skate.' },
    { id: 'tip_2', text: 'Learn how to fall: tuck, roll, and let go of the board.' },
    { id: 'tip_3', text: 'Film your attempts. Watching yourself shows what your feet are really doing.' },
    { id: 'tip_4', text: 'Practice one trick for 20 minutes, then move on. Short focus beats long frustration.' },
    { id: 'tip_5', text: 'Check your bolts and bearings once a month.' },
    { id: 'tip_6', text: 'Wear a helmet. Always.' }
  ],
  spotlights: [
    { trick: 'Ollie', text: 'Spotlight: the ollie is the foundation. Spend time on clean, high pops.' },
    { trick: 'Kickflip', text: 'Spotlight: the kickflip. Flick, catch, land bolts. Repeat.' },
    { trick: 'Manual', text: 'Spotlight: the manual. Balance and patience build style.' }
  ],
  ideas: [
    { name: 'Land 3 tricks in one session', description: 'A single session with three different landed tricks.', difficulty: 'Intermediate', target: 3, unit: 'tricks' },
    { name: 'Roll 20 km this month', description: 'Add up the distance you skate and aim for 20 km.', difficulty: 'Beginner', target: 20, unit: 'km' },
    { name: 'Film one clip a week for a month', description: 'Capture one clip of your best attempt each week.', difficulty: 'Beginner', target: 4, unit: 'clips' }
  ]
};

// Demo data a user can load from Settings to see charts and stats filled in.
function buildDemoData() {
  const day = n => toISO(addDays(new Date(), -n));
  const mk = (n, title, location, type, start, end, duration, practiced, landed, difficulty, mood, notes, distance = '') => ({
    id: uid('ses'), title, date: day(n), startTime: start, endTime: end, duration, location, type, weather: '', distance,
    tricksPracticed: practiced, tricksLanded: landed, difficulty, mood, notes, demo: true
  });
  return {
    sessions: [
      mk(0, 'Morning ollie practice', 'Neighborhood street', 'Casual Session', '07:00', '08:15', 75, 'Ollie, Shuvit', 'Ollie', 'Easy', 'Good', 'Popping higher today.', 3),
      mk(1, 'After-school cruise', 'Local park', 'Cruising', '16:00', '17:00', 60, 'Kickturn, Tic Tac', 'Kickturn', 'Easy', 'Stoked', 'Chill roll with friends.', 5),
      mk(2, 'Kickflip grind', 'Skatepark', 'Training', '15:30', '17:30', 120, 'Kickflip, Pop Shuvit', 'Pop Shuvit', 'Hard', 'Frustrated', 'Kickflip still not landing but getting closer.'),
      mk(4, 'Street spot hunt', 'Downtown', 'Street Skating', '10:00', '11:30', 90, 'Manual, Ollie', 'Manual, Ollie', 'Medium', 'Good', 'Found a smooth manual pad.', 4),
      mk(6, 'Weekend session', 'Skatepark', 'Skatepark', '14:00', '16:00', 120, 'Frontside 180, Shuvit', 'Shuvit', 'Medium', 'Stoked', 'Frontside 180 felt good.'),
      mk(9, 'Short warm-up', 'Driveway', 'Casual Session', '18:00', '18:40', 40, 'Ollie', 'Ollie', 'Easy', 'Okay', ''),
      mk(12, 'Long practice day', 'Skatepark', 'Training', '09:00', '12:00', 180, 'Ollie, Shuvit, Fakie', 'Fakie', 'Medium', 'Tired', 'Worked on fakie rolling.'),
      mk(16, 'Sunset roll', 'Neighborhood street', 'Cruising', '17:30', '18:30', 60, 'Tic Tac', 'Tic Tac', 'Easy', 'Stoked', '', 6)
    ],
    journal: [
      { id: uid('jnl'), title: 'First clean ollie', date: day(10), mood: 'Stoked', description: 'After weeks of trying, I rolled away clean on an ollie today. My feet finally clicked.', tags: ['ollie', 'milestone'], image: '', sessionId: '' },
      { id: uid('jnl'), title: 'Rough day, good lesson', date: day(2), mood: 'Frustrated', description: 'Kickflips went everywhere except under my feet. Tomorrow I will slow down and focus on the flick.', tags: ['kickflip', 'practice'], image: '', sessionId: '' }
    ],
    goals: [
      { id: uid('goal'), name: 'Land a Kickflip', description: 'Roll away clean five times.', category: 'Tricks', target: 5, current: 0, startDate: day(14), targetDate: toISO(addDays(new Date(), 30)), priority: 'High', status: 'active' },
      { id: uid('goal'), name: 'Skate 20 hours this month', description: '', category: 'Hours', target: 20, current: 8, startDate: day(14), targetDate: toISO(addDays(new Date(), 16)), priority: 'Medium', status: 'active' },
      { id: uid('goal'), name: 'Complete 15 sessions', description: '', category: 'Sessions', target: 15, current: 8, startDate: day(30), targetDate: toISO(addDays(new Date(), 30)), priority: 'Low', status: 'active' }
    ],
    equipment: [
      { id: uid('eq'), name: 'Maple deck 8.0"', brand: 'Sample Brand', category: 'Skateboard Deck', image: '', purchaseDate: day(60), price: 59.99, condition: 'Good', reminderDate: toISO(addDays(new Date(), 45)), notes: '' },
      { id: uid('eq'), name: 'Street wheels 52mm', brand: 'Sample Brand', category: 'Wheels', image: '', purchaseDate: day(60), price: 34.5, condition: 'Fair', reminderDate: '', notes: '' },
      { id: uid('eq'), name: 'Skate helmet', brand: 'Sample Brand', category: 'Helmet', image: '', purchaseDate: day(120), price: 42, condition: 'Good', reminderDate: '', notes: '' }
    ],
    trickUpdates: { 'Ollie': { status: 'Mastered', attempts: 120, landings: 80, firstLanded: day(10) }, 'Shuvit': { status: 'Landed', attempts: 40, landings: 12, firstLanded: day(6) }, 'Kickturn': { status: 'Landed', attempts: 15, landings: 10, firstLanded: day(1) }, 'Kickflip': { status: 'Learning', attempts: 60, landings: 0, firstLanded: '' }, 'Manual': { status: 'Practicing', attempts: 25, landings: 6, firstLanded: day(4) } }
  };
}
