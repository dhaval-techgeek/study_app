'use strict';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const rand = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
const pick = arr => arr[Math.floor(Math.random() * arr.length)];

/** Wrap a value in a highlighted <span> for rendering in question text */
const hl = val => `<span class="hl">${val}</span>`;

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Format a number – thousands commas for integers, up to 3 dp for decimals */
const fmtNum = n => n.toLocaleString('en-GB', { maximumFractionDigits: 3 });

// ─── Core Question Builder ────────────────────────────────────────────────────
/**
 * @param {string}   text     - HTML question string (may contain <span class="hl">)
 * @param {number}   correct  - The correct numeric answer
 * @param {number[]} wrongs   - Candidate wrong answers (will be filtered/deduped)
 * @param {string}   unit     - Display unit appended to each option value (e.g. 'm', 'kg')
 * @param {string}   hint     - Shown when the player gets it wrong
 * @param {string}   category - 'length' | 'weight' | 'capacity'
 */
function makeQ(text, correct, wrongs, unit, hint, category) {
  const fmt = v => `${fmtNum(v)}${unit ? ' ' + unit : ''}`;

  const validWrongs = [...new Set(wrongs)]
    .filter(w => w > 0 && w !== correct)
    .slice(0, 3);

  const pool = shuffle([correct, ...validWrongs]);

  // Safety net: pad to exactly 4 options
  let seed = 1;
  while (pool.length < 4) {
    const extra = correct + seed * Math.max(1, Math.ceil(correct / 5));
    if (!pool.includes(extra)) pool.push(extra);
    seed++;
    if (seed > 50) break;
  }

  const LETTERS   = ['A', 'B', 'C', 'D'];
  const answerIdx = pool.indexOf(correct);

  return {
    text,
    values: pool.map(fmt),          // display strings for each option
    answer: LETTERS[answerIdx],     // correct letter
    correctDisplay: fmt(correct),   // used in wrong-answer feedback
    correctValue: correct,          // raw number for rapid fire comparison
    hint,
    category,
  };
}

// ─── Length Questions ─────────────────────────────────────────────────────────
function qLength(difficulty = 'medium') {
  if (difficulty === 'easy') return qLengthEasy();
  if (difficulty === 'hard') return qLengthHard();
  const t = rand(1, 9);

  if (t <= 2) {                                       // km → m
    const km = rand(1, 20);
    return makeQ(
      `Convert ${hl(km + ' km')} to metres.`,
      km * 1000, [km * 100, km * 10, km * 10000, (km + 2) * 1000],
      'm', '1 km = 1,000 m', 'length'
    );
  }
  if (t <= 4) {                                       // m → cm
    const m = rand(1, 20);
    return makeQ(
      `Convert ${hl(m + ' m')} to centimetres.`,
      m * 100, [m * 10, m * 1000, m, (m + 3) * 100],
      'cm', '1 m = 100 cm', 'length'
    );
  }
  if (t === 5) {                                      // cm → mm
    const cm = rand(2, 30);
    return makeQ(
      `Convert ${hl(cm + ' cm')} to millimetres.`,
      cm * 10, [cm * 100, cm, cm * 1000, (cm + 5) * 10],
      'mm', '1 cm = 10 mm', 'length'
    );
  }
  if (t === 6) {                                      // m → mm
    const m = rand(1, 10);
    return makeQ(
      `Convert ${hl(m + ' m')} to millimetres.`,
      m * 1000, [m * 100, m * 10, m * 10000],
      'mm', '1 m = 1,000 mm', 'length'
    );
  }
  if (t === 7) {                                      // m → km
    const km = rand(2, 15);
    return makeQ(
      `Convert ${hl(fmtNum(km * 1000) + ' m')} to kilometres.`,
      km, [km * 10, km * 100, km + 5, km - 1].filter(v => v > 0),
      'km', '1,000 m = 1 km', 'length'
    );
  }
  if (t === 8) {                                      // cm → m
    const m = rand(2, 20);
    return makeQ(
      `Convert ${hl(m * 100 + ' cm')} to metres.`,
      m, [m * 10, m * 100, m + 5, m - 1].filter(v => v > 0),
      'm', '100 cm = 1 m', 'length'
    );
  }

  // t === 9: word problems
  const scenes = [
    { text: `A race track is ${hl('5 km')} long. How many metres is that?`,
      correct: 5000,  wrongs: [500, 50000, 50],    unit: 'm',  hint: '1 km = 1,000 m' },
    { text: `A ruler is ${hl('30 cm')} long. How many millimetres is that?`,
      correct: 300,   wrongs: [30, 3000, 3],        unit: 'mm', hint: '1 cm = 10 mm' },
    { text: `A football pitch is ${hl('100 m')} long. How many centimetres is that?`,
      correct: 10000, wrongs: [1000, 100, 100000],  unit: 'cm', hint: '1 m = 100 cm' },
    { text: `A road is ${hl('12 km')} long. How many metres is that?`,
      correct: 12000, wrongs: [1200, 120, 120000],  unit: 'm',  hint: '1 km = 1,000 m' },
    { text: `A worm is ${hl('8 cm')} long. How many mm is that?`,
      correct: 80,    wrongs: [8, 800, 8000],        unit: 'mm', hint: '1 cm = 10 mm' },
    { text: `A swimming pool is ${hl('25 m')} long. How many centimetres is that?`,
      correct: 2500,  wrongs: [250, 25000, 25],      unit: 'cm', hint: '1 m = 100 cm' },
    { text: `A bookshelf is ${hl('150 cm')} wide. How many metres is that?`,
      correct: 1,     wrongs: [15, 1500, 10],        unit: 'm',  hint: '100 cm = 1 m' },
    { text: `A marathon is ${hl('42 km')} long. How many metres is that?`,
      correct: 42000, wrongs: [4200, 420, 420000],   unit: 'm',  hint: '1 km = 1,000 m' },
  ];
  const s = pick(scenes);
  return makeQ(s.text, s.correct, s.wrongs, s.unit, s.hint, 'length');
}

// ─── Weight Questions ─────────────────────────────────────────────────────────
function qWeight(difficulty = 'medium') {
  if (difficulty === 'easy') return qWeightEasy();
  if (difficulty === 'hard') return qWeightHard();
  const t = rand(1, 9);

  if (t <= 3) {                                       // kg → g
    const kg = rand(1, 20);
    return makeQ(
      `Convert ${hl(kg + ' kg')} to grams.`,
      kg * 1000, [kg * 100, kg * 10, (kg + 3) * 1000, kg * 10000],
      'g', '1 kg = 1,000 g', 'weight'
    );
  }
  if (t <= 5) {                                       // g → kg
    const kg = rand(1, 10);
    return makeQ(
      `Convert ${hl(fmtNum(kg * 1000) + ' g')} to kilograms.`,
      kg, [kg * 10, kg * 100, kg + 4, kg + 2],
      'kg', '1,000 g = 1 kg', 'weight'
    );
  }
  if (t === 6) {                                      // tonnes → kg
    const tn = rand(1, 10);
    return makeQ(
      `Convert ${hl(tn + (tn === 1 ? ' tonne' : ' tonnes'))} to kilograms.`,
      tn * 1000, [tn * 100, tn * 10000, (tn + 2) * 1000],
      'kg', '1 tonne = 1,000 kg', 'weight'
    );
  }
  if (t === 7) {                                      // kg → tonnes
    const tn = rand(2, 8);
    return makeQ(
      `Convert ${hl(fmtNum(tn * 1000) + ' kg')} to tonnes.`,
      tn, [tn * 10, tn * 100, tn + 3],
      'tonnes', '1,000 kg = 1 tonne', 'weight'
    );
  }
  if (t === 8) {                                      // kg + g → g
    const kg = rand(1, 5);
    const g  = rand(1, 9) * 100;
    return makeQ(
      `What is ${hl(kg + ' kg')} and ${hl(g + ' g')} in grams?`,
      kg * 1000 + g,
      [kg * 100 + g, kg * 1000, kg * 1000 - g, kg * 10000 + g],
      'g', `${kg} kg = ${fmtNum(kg * 1000)} g, then add ${g} g`, 'weight'
    );
  }

  // t === 9: word problems
  const scenes = [
    { text: `A bag of potatoes weighs ${hl('3 kg')}. How many grams is that?`,
      correct: 3000, wrongs: [300, 30000, 30],   unit: 'g',      hint: '1 kg = 1,000 g' },
    { text: `A whale weighs ${hl('5 tonnes')}. How many kg is that?`,
      correct: 5000, wrongs: [500, 50000, 50],   unit: 'kg',     hint: '1 tonne = 1,000 kg' },
    { text: `A parcel weighs ${hl('2,000 g')}. How many kilograms is that?`,
      correct: 2,    wrongs: [20, 200, 2000],    unit: 'kg',     hint: '1,000 g = 1 kg' },
    { text: `A baby elephant weighs ${hl('4,000 kg')}. How many tonnes is that?`,
      correct: 4,    wrongs: [40, 400, 4000],    unit: 'tonnes', hint: '1,000 kg = 1 tonne' },
    { text: `A loaf of bread weighs ${hl('800 g')}. How many grams do ${hl('3 loaves')} weigh?`,
      correct: 2400, wrongs: [800, 1600, 3200],  unit: 'g',      hint: 'Multiply: 3 × 800 g' },
    { text: `A truck can carry ${hl('7 tonnes')}. How many kilograms is that?`,
      correct: 7000, wrongs: [700, 70000, 70],   unit: 'kg',     hint: '1 tonne = 1,000 kg' },
    { text: `A dictionary weighs ${hl('1,500 g')}. How many grams in ${hl('2 dictionaries')}?`,
      correct: 3000, wrongs: [1500, 4500, 6000], unit: 'g',      hint: 'Multiply: 2 × 1,500 g' },
  ];
  const s = pick(scenes);
  return makeQ(s.text, s.correct, s.wrongs, s.unit, s.hint, 'weight');
}

// ─── Capacity Questions ───────────────────────────────────────────────────────
function qCapacity(difficulty = 'medium') {
  if (difficulty === 'easy') return qCapacityEasy();
  if (difficulty === 'hard') return qCapacityHard();
  const t = rand(1, 9);

  if (t <= 3) {                                       // litres → ml
    const l = rand(1, 15);
    return makeQ(
      `Convert ${hl(l + (l === 1 ? ' litre' : ' litres'))} to millilitres.`,
      l * 1000, [l * 100, l * 10, (l + 3) * 1000],
      'ml', '1 litre = 1,000 ml', 'capacity'
    );
  }
  if (t <= 5) {                                       // ml → litres
    const l = rand(1, 10);
    return makeQ(
      `Convert ${hl(fmtNum(l * 1000) + ' ml')} to litres.`,
      l, [l * 10, l * 100, l + 4],
      'litres', '1,000 ml = 1 litre', 'capacity'
    );
  }
  if (t === 6) {                                      // cl → ml
    const cl = rand(1, 20) * 5;
    return makeQ(
      `Convert ${hl(cl + ' cl')} to millilitres.`,
      cl * 10, [cl, cl * 100, cl * 1000, (cl + 5) * 10],
      'ml', '1 cl = 10 ml', 'capacity'
    );
  }
  if (t === 7) {                                      // repeated addition
    const bottles = rand(2, 6);
    const mlEach  = pick([200, 250, 330, 500]);
    const correct = bottles * mlEach;
    return makeQ(
      `${hl(bottles + ' bottles')}, each holding ${hl(mlEach + ' ml')}. How many ml altogether?`,
      correct,
      [correct - mlEach, correct + mlEach, mlEach, bottles * (mlEach / 2)],
      'ml', `Multiply: ${bottles} × ${mlEach}`, 'capacity'
    );
  }
  if (t === 8) {                                      // litres + ml → ml
    const l  = rand(1, 5);
    const ml = rand(1, 9) * 100;
    return makeQ(
      `What is ${hl(l + (l === 1 ? ' litre' : ' litres'))} and ${hl(ml + ' ml')} in millilitres?`,
      l * 1000 + ml,
      [l * 100 + ml, l * 1000, l * 1000 - ml, l * 10000 + ml],
      'ml', `${l} litre${l > 1 ? 's' : ''} = ${fmtNum(l * 1000)} ml, then add ${ml} ml`, 'capacity'
    );
  }

  // t === 9: word problems
  const scenes = [
    { text: `A fish tank holds ${hl('10 litres')} of water. How many ml is that?`,
      correct: 10000, wrongs: [1000, 100, 100000],  unit: 'ml',     hint: '1 litre = 1,000 ml' },
    { text: `A bottle has ${hl('2,000 ml')} of juice. How many litres is that?`,
      correct: 2,     wrongs: [20, 200, 2000],      unit: 'litres', hint: '1,000 ml = 1 litre' },
    { text: `A paddling pool holds ${hl('80 litres')}. How many ml is that?`,
      correct: 80000, wrongs: [8000, 800, 800000],  unit: 'ml',     hint: '1 litre = 1,000 ml' },
    { text: `A mug holds ${hl('300 ml')}. How many ml do ${hl('4 mugs')} hold?`,
      correct: 1200,  wrongs: [300, 600, 1500],     unit: 'ml',     hint: 'Multiply: 4 × 300' },
    { text: `A large bottle holds ${hl('3,000 ml')} of lemonade. How many litres is that?`,
      correct: 3,     wrongs: [30, 300, 3000],      unit: 'litres', hint: '1,000 ml = 1 litre' },
    { text: `A watering can holds ${hl('5 litres')}. How many ml is that?`,
      correct: 5000,  wrongs: [500, 50000, 50],     unit: 'ml',     hint: '1 litre = 1,000 ml' },
    { text: `A bath holds ${hl('150 litres')} of water. How many ml is that?`,
      correct: 150000, wrongs: [15000, 1500, 1500000], unit: 'ml', hint: '1 litre = 1,000 ml' },
  ];
  const s = pick(scenes);
  return makeQ(s.text, s.correct, s.wrongs, s.unit, s.hint, 'capacity');
}

// ─── Easy Question Generators ─────────────────────────────────────────────────
function qLengthEasy() {
  const t = rand(1, 5);
  if (t === 1) {
    const km = rand(1, 5);
    return makeQ(`Convert ${hl(km + ' km')} to metres.`,
      km * 1000, [km * 100, km * 10, km * 10000], 'm', '1 km = 1,000 m', 'length');
  }
  if (t === 2) {
    const m = rand(1, 8);
    return makeQ(`Convert ${hl(m + ' m')} to centimetres.`,
      m * 100, [m * 10, m * 1000, (m + 2) * 100], 'cm', '1 m = 100 cm', 'length');
  }
  if (t === 3) {
    const cm = rand(1, 10);
    return makeQ(`Convert ${hl(cm + ' cm')} to millimetres.`,
      cm * 10, [cm * 100, cm, (cm + 2) * 10], 'mm', '1 cm = 10 mm', 'length');
  }
  if (t === 4) {
    const km = rand(1, 5);
    return makeQ(`${hl(fmtNum(km * 1000) + ' m')} is how many kilometres?`,
      km, [km * 10, km * 100, km + 2], 'km', '1,000 m = 1 km', 'length');
  }
  const scenes = [
    { text: `A path is ${hl('3 km')} long. How many metres?`,       correct: 3000, wrongs: [300, 30000, 30],   unit: 'm',  hint: '1 km = 1,000 m' },
    { text: `A desk is ${hl('2 m')} wide. How many centimetres?`,   correct: 200,  wrongs: [20, 2000, 20],    unit: 'cm', hint: '1 m = 100 cm' },
    { text: `A pencil is ${hl('15 cm')} long. How many mm?`,        correct: 150,  wrongs: [15, 1500, 1500],  unit: 'mm', hint: '1 cm = 10 mm' },
    { text: `A pool is ${hl('4 km')} long. How many metres?`,       correct: 4000, wrongs: [400, 40000, 40],  unit: 'm',  hint: '1 km = 1,000 m' },
    { text: `A shelf is ${hl('3 m')} wide. How many centimetres?`,  correct: 300,  wrongs: [30, 3000, 3],     unit: 'cm', hint: '1 m = 100 cm' },
  ];
  const s = pick(scenes);
  return makeQ(s.text, s.correct, s.wrongs, s.unit, s.hint, 'length');
}

function qWeightEasy() {
  const t = rand(1, 4);
  if (t === 1) {
    const kg = rand(1, 5);
    return makeQ(`Convert ${hl(kg + ' kg')} to grams.`,
      kg * 1000, [kg * 100, kg * 10, (kg + 2) * 1000], 'g', '1 kg = 1,000 g', 'weight');
  }
  if (t === 2) {
    const tn = rand(1, 5);
    return makeQ(`Convert ${hl(tn + (tn === 1 ? ' tonne' : ' tonnes'))} to kilograms.`,
      tn * 1000, [tn * 100, tn * 10000, (tn + 2) * 1000], 'kg', '1 tonne = 1,000 kg', 'weight');
  }
  if (t === 3) {
    const kg = rand(1, 5);
    return makeQ(`${hl(fmtNum(kg * 1000) + ' g')} is how many kilograms?`,
      kg, [kg * 10, kg * 100, kg + 2], 'kg', '1,000 g = 1 kg', 'weight');
  }
  const scenes = [
    { text: `A bag weighs ${hl('3 kg')}. How many grams?`,       correct: 3000, wrongs: [300, 30000, 30],   unit: 'g',  hint: '1 kg = 1,000 g' },
    { text: `A lorry weighs ${hl('4 tonnes')}. How many kg?`,    correct: 4000, wrongs: [400, 40000, 40],   unit: 'kg', hint: '1 tonne = 1,000 kg' },
    { text: `A parcel is ${hl('5,000 g')}. How many kilograms?`, correct: 5,    wrongs: [50, 500, 5000],    unit: 'kg', hint: '1,000 g = 1 kg' },
    { text: `A stone weighs ${hl('2 kg')}. How many grams?`,     correct: 2000, wrongs: [200, 20000, 20],   unit: 'g',  hint: '1 kg = 1,000 g' },
  ];
  const s = pick(scenes);
  return makeQ(s.text, s.correct, s.wrongs, s.unit, s.hint, 'weight');
}

function qCapacityEasy() {
  const t = rand(1, 4);
  if (t === 1) {
    const l = rand(1, 5);
    return makeQ(`Convert ${hl(l + (l === 1 ? ' litre' : ' litres'))} to millilitres.`,
      l * 1000, [l * 100, l * 10, (l + 2) * 1000], 'ml', '1 litre = 1,000 ml', 'capacity');
  }
  if (t === 2) {
    const cl = rand(1, 5) * 10;
    return makeQ(`Convert ${hl(cl + ' cl')} to millilitres.`,
      cl * 10, [cl, cl * 100, (cl + 10) * 10], 'ml', '1 cl = 10 ml', 'capacity');
  }
  if (t === 3) {
    const l = rand(1, 5);
    return makeQ(`${hl(fmtNum(l * 1000) + ' ml')} is how many litres?`,
      l, [l * 10, l * 100, l + 2], 'litres', '1,000 ml = 1 litre', 'capacity');
  }
  const scenes = [
    { text: `A bottle holds ${hl('2 litres')} of juice. How many ml?`,   correct: 2000, wrongs: [200, 20000, 20],   unit: 'ml',     hint: '1 litre = 1,000 ml' },
    { text: `A cup holds ${hl('30 cl')} of tea. How many ml?`,           correct: 300,  wrongs: [30, 3000, 3000],   unit: 'ml',     hint: '1 cl = 10 ml' },
    { text: `A jar has ${hl('4,000 ml')} of water. How many litres?`,    correct: 4,    wrongs: [40, 400, 4000],    unit: 'litres', hint: '1,000 ml = 1 litre' },
    { text: `A tank holds ${hl('3 litres')} of water. How many ml?`,     correct: 3000, wrongs: [300, 30000, 30],   unit: 'ml',     hint: '1 litre = 1,000 ml' },
  ];
  const s = pick(scenes);
  return makeQ(s.text, s.correct, s.wrongs, s.unit, s.hint, 'capacity');
}

// ─── Hard Question Generators ─────────────────────────────────────────────────
function qLengthHard() {
  const t = rand(1, 8);
  if (t <= 2) {
    // m → km (decimal result)
    const m = pick([500, 1500, 2500, 3500, 4500, 750, 250]);
    const km = m / 1000;
    return makeQ(`Convert ${hl(fmtNum(m) + ' m')} to kilometres.`,
      km, [km * 10, km * 100, km + 1], 'km', '1,000 m = 1 km', 'length');
  }
  if (t <= 4) {
    // cm → m (decimal result)
    const cm = pick([50, 150, 250, 350, 750]);
    const m = cm / 100;
    return makeQ(`Convert ${hl(cm + ' cm')} to metres.`,
      m, [m * 10, m * 100, m + 1], 'm', '100 cm = 1 m', 'length');
  }
  if (t === 5) {
    // Decimal km → m
    const km = pick([0.5, 1.5, 2.5, 3.5, 0.25, 0.75]);
    return makeQ(`Convert ${hl(km + ' km')} to metres.`,
      km * 1000, [km * 100, km * 10, (km + 1) * 1000], 'm', '1 km = 1,000 m', 'length');
  }
  if (t === 6) {
    // Decimal m → cm
    const m = pick([0.5, 1.5, 2.5, 0.25, 0.75, 3.5]);
    return makeQ(`Convert ${hl(m + ' m')} to centimetres.`,
      m * 100, [m * 10, m * 1000, (m + 1) * 100], 'cm', '1 m = 100 cm', 'length');
  }
  if (t === 7) {
    // Fraction → m
    const fracs = [
      { text: `${hl('½ km')} = how many metres?`,  correct: 500,  hint: '1 km = 1,000 m, so ½ km = 500 m' },
      { text: `${hl('¼ km')} = how many metres?`,  correct: 250,  hint: '1 km = 1,000 m, so ¼ km = 250 m' },
      { text: `${hl('¾ km')} = how many metres?`,  correct: 750,  hint: '1 km = 1,000 m, so ¾ km = 750 m' },
      { text: `${hl('1½ km')} = how many metres?`, correct: 1500, hint: '1 km = 1,000 m, so 1½ km = 1,500 m' },
      { text: `${hl('2½ km')} = how many metres?`, correct: 2500, hint: '1 km = 1,000 m, so 2½ km = 2,500 m' },
    ];
    const f = pick(fracs);
    return makeQ(f.text, f.correct, [f.correct / 2, f.correct * 2, f.correct * 10], 'm', f.hint, 'length');
  }
  // t === 8: Fraction → cm
  const fracs = [
    { text: `${hl('½ m')} = how many centimetres?`,  correct: 50,  hint: '1 m = 100 cm, so ½ m = 50 cm' },
    { text: `${hl('¼ m')} = how many centimetres?`,  correct: 25,  hint: '1 m = 100 cm, so ¼ m = 25 cm' },
    { text: `${hl('¾ m')} = how many centimetres?`,  correct: 75,  hint: '1 m = 100 cm, so ¾ m = 75 cm' },
    { text: `${hl('1½ m')} = how many centimetres?`, correct: 150, hint: '1 m = 100 cm, so 1½ m = 150 cm' },
    { text: `${hl('2½ m')} = how many centimetres?`, correct: 250, hint: '1 m = 100 cm, so 2½ m = 250 cm' },
  ];
  const f = pick(fracs);
  return makeQ(f.text, f.correct, [f.correct * 2, f.correct / 2, f.correct * 10], 'cm', f.hint, 'length');
}

function qWeightHard() {
  const t = rand(1, 7);
  if (t <= 2) {
    // g → kg (decimal result)
    const g = pick([500, 1500, 2500, 750, 250, 3500]);
    const kg = g / 1000;
    return makeQ(`Convert ${hl(fmtNum(g) + ' g')} to kilograms.`,
      kg, [kg * 10, kg * 100, kg + 1], 'kg', '1,000 g = 1 kg', 'weight');
  }
  if (t === 3) {
    // kg → tonnes (decimal result)
    const kg = pick([500, 1500, 2500, 750]);
    const tn = kg / 1000;
    return makeQ(`Convert ${hl(fmtNum(kg) + ' kg')} to tonnes.`,
      tn, [tn * 10, tn * 100, tn + 1], 'tonnes', '1,000 kg = 1 tonne', 'weight');
  }
  if (t === 4) {
    // Decimal kg → g
    const kg = pick([0.5, 1.5, 2.5, 0.25, 0.75, 3.5]);
    return makeQ(`Convert ${hl(kg + ' kg')} to grams.`,
      kg * 1000, [kg * 100, kg * 10, (kg + 1) * 1000], 'g', '1 kg = 1,000 g', 'weight');
  }
  if (t === 5) {
    // Fraction kg → g
    const fracs = [
      { text: `${hl('½ kg')} = how many grams?`,   correct: 500,  hint: '1 kg = 1,000 g, so ½ kg = 500 g' },
      { text: `${hl('¼ kg')} = how many grams?`,   correct: 250,  hint: '1 kg = 1,000 g, so ¼ kg = 250 g' },
      { text: `${hl('¾ kg')} = how many grams?`,   correct: 750,  hint: '1 kg = 1,000 g, so ¾ kg = 750 g' },
      { text: `${hl('1½ kg')} = how many grams?`,  correct: 1500, hint: '1 kg = 1,000 g, so 1½ kg = 1,500 g' },
      { text: `${hl('2½ kg')} = how many grams?`,  correct: 2500, hint: '1 kg = 1,000 g, so 2½ kg = 2,500 g' },
    ];
    const f = pick(fracs);
    return makeQ(f.text, f.correct, [f.correct / 2, f.correct * 2, f.correct / 10], 'g', f.hint, 'weight');
  }
  if (t === 6) {
    // Fraction tonne → kg
    const fracs = [
      { text: `${hl('½ tonne')} = how many kilograms?`,   correct: 500,  hint: '1 tonne = 1,000 kg, so ½ tonne = 500 kg' },
      { text: `${hl('¼ tonne')} = how many kilograms?`,   correct: 250,  hint: '1 tonne = 1,000 kg, so ¼ tonne = 250 kg' },
      { text: `${hl('¾ tonne')} = how many kilograms?`,   correct: 750,  hint: '1 tonne = 1,000 kg, so ¾ tonne = 750 kg' },
      { text: `${hl('1½ tonnes')} = how many kilograms?`, correct: 1500, hint: '1 tonne = 1,000 kg, so 1½ tonnes = 1,500 kg' },
    ];
    const f = pick(fracs);
    return makeQ(f.text, f.correct, [f.correct * 2, f.correct / 2, f.correct * 10], 'kg', f.hint, 'weight');
  }
  // t === 7: word problems
  const scenes = [
    { text: `A bag of flour weighs ${hl('500 g')}. How many kilograms?`,   correct: 0.5, wrongs: [5, 50, 0.05],   unit: 'kg',     hint: '500 g = 0.5 kg (half a kilogram)' },
    { text: `A parcel weighs ${hl('1,500 g')}. How many kilograms?`,       correct: 1.5, wrongs: [15, 150, 0.15], unit: 'kg',     hint: '1,500 g = 1.5 kg' },
    { text: `A box weighs ${hl('0.75 kg')}. How many grams?`,              correct: 750, wrongs: [75, 7500, 7.5], unit: 'g',      hint: '0.75 kg = 750 g' },
    { text: `A truck carries ${hl('2,500 kg')}. How many tonnes?`,         correct: 2.5, wrongs: [25, 250, 0.25], unit: 'tonnes', hint: '2,500 kg = 2.5 tonnes' },
    { text: `A sack weighs ${hl('750 g')}. How many kilograms is that?`,   correct: 0.75, wrongs: [7.5, 75, 0.075], unit: 'kg',   hint: '750 g = 0.75 kg (¾ kilogram)' },
  ];
  const s = pick(scenes);
  return makeQ(s.text, s.correct, s.wrongs, s.unit, s.hint, 'weight');
}

function qCapacityHard() {
  const t = rand(1, 7);
  if (t <= 2) {
    // ml → litres (decimal result)
    const ml = pick([500, 1500, 2500, 750, 250, 3500]);
    const litres = ml / 1000;
    return makeQ(`Convert ${hl(fmtNum(ml) + ' ml')} to litres.`,
      litres, [litres * 10, litres * 100, litres + 1], 'litres', '1,000 ml = 1 litre', 'capacity');
  }
  if (t === 3) {
    // cl → litres (decimal result)
    const cl = pick([50, 25, 75, 150]);
    const litres = cl / 100;
    return makeQ(`Convert ${hl(cl + ' cl')} to litres.`,
      litres, [litres * 10, litres * 100, litres + 1], 'litres', '100 cl = 1 litre', 'capacity');
  }
  if (t === 4) {
    // Decimal litres → ml
    const lVal = pick([0.5, 1.5, 2.5, 0.25, 0.75, 3.5]);
    return makeQ(`Convert ${hl(lVal + ' litres')} to millilitres.`,
      lVal * 1000, [lVal * 100, lVal * 10000, (lVal + 1) * 1000], 'ml', '1 litre = 1,000 ml', 'capacity');
  }
  if (t === 5) {
    // Fraction litre → ml
    const fracs = [
      { text: `${hl('½ litre')} = how many millilitres?`,   correct: 500,  hint: '1 litre = 1,000 ml, so ½ litre = 500 ml' },
      { text: `${hl('¼ litre')} = how many millilitres?`,   correct: 250,  hint: '1 litre = 1,000 ml, so ¼ litre = 250 ml' },
      { text: `${hl('¾ litre')} = how many millilitres?`,   correct: 750,  hint: '1 litre = 1,000 ml, so ¾ litre = 750 ml' },
      { text: `${hl('1½ litres')} = how many millilitres?`, correct: 1500, hint: '1 litre = 1,000 ml, so 1½ litres = 1,500 ml' },
      { text: `${hl('2½ litres')} = how many millilitres?`, correct: 2500, hint: '1 litre = 1,000 ml, so 2½ litres = 2,500 ml' },
    ];
    const f = pick(fracs);
    return makeQ(f.text, f.correct, [f.correct / 2, f.correct * 2, f.correct / 10], 'ml', f.hint, 'capacity');
  }
  if (t === 6) {
    // ml → cl
    const ml = pick([50, 150, 250, 350, 500]);
    const cl = ml / 10;
    return makeQ(`Convert ${hl(ml + ' ml')} to centilitres.`,
      cl, [cl * 10, cl * 100, cl + 5], 'cl', '10 ml = 1 cl', 'capacity');
  }
  // t === 7: word problems
  const scenes = [
    { text: `A mug holds ${hl('250 ml')}. How many litres?`,                    correct: 0.25, wrongs: [2.5, 25, 0.025],  unit: 'litres', hint: '250 ml = 0.25 litres (¼ litre)' },
    { text: `A bottle has ${hl('1,500 ml')} of water. How many litres?`,        correct: 1.5,  wrongs: [15, 150, 0.15],   unit: 'litres', hint: '1,500 ml = 1.5 litres' },
    { text: `A jug holds ${hl('¾ litre')} of juice. How many ml?`,              correct: 750,  wrongs: [75, 7500, 250],   unit: 'ml',     hint: '¾ litre = 750 ml' },
    { text: `A glass holds ${hl('0.5 litres')} of water. How many ml?`,         correct: 500,  wrongs: [50, 5000, 5],     unit: 'ml',     hint: '0.5 litres = 500 ml' },
    { text: `A bottle contains ${hl('50 cl')}. How many litres is that?`,       correct: 0.5,  wrongs: [5, 50, 0.05],     unit: 'litres', hint: '50 cl = ½ litre = 0.5 litres' },
    { text: `A bowl has ${hl('750 ml')} of soup. How many litres?`,             correct: 0.75, wrongs: [7.5, 75, 0.075],  unit: 'litres', hint: '750 ml = 0.75 litres (¾ litre)' },
  ];
  const s = pick(scenes);
  return makeQ(s.text, s.correct, s.wrongs, s.unit, s.hint, 'capacity');
}

// ─── Question Set Builder ─────────────────────────────────────────────────────
function buildSet(category, n = 10, difficulty = 'medium') {
  const qL = () => qLength(difficulty);
  const qW = () => qWeight(difficulty);
  const qC = () => qCapacity(difficulty);
  const gens = { length: qL, weight: qW, capacity: qC };
  const gen  = category === 'mixed'
    ? () => pick([qL, qW, qC])()
    : gens[category];
  return Array.from({ length: n }, gen);
}

// ─── Quiz State ───────────────────────────────────────────────────────────────
const state = {
  userId:     null,
  name:       '',
  email:      '',
  name:       '',
  category:   '',
  mode:       'standard',
  difficulty: 'medium',
  total:      10,
  questions: [],
  idx:      0,
  score:    0,
  skipped:  0,
  answered: false,
  quizStart:   0,
  qStart:      0,
  qTimes:      [],
  timerInterval: null,
};

// ─── Timer ────────────────────────────────────────────────────────────────────
function fmtTime(ms, decimals = false) {
  const totalSec = ms / 1000;
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  if (decimals) return s.toFixed(1) + 's';
  return `${m}:${String(Math.floor(s)).padStart(2, '0')}`;
}

function startTimer() {
  state.quizStart = Date.now();
  const el = document.getElementById('hdr-timer');
  state.timerInterval = setInterval(() => {
    if (el) el.textContent = fmtTime(Date.now() - state.quizStart);
  }, 500); // update every half-second for smoother display
}

function stopTimer() {
  clearInterval(state.timerInterval);
  state.timerInterval = null;
}

// ─── DOM Helpers ──────────────────────────────────────────────────────────────
const $ = id => document.getElementById(id);

function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('screen-active'));
  $(id).classList.add('screen-active');
}

function animateEl(el, cls) {
  el.classList.remove(cls);
  void el.offsetWidth; // reflow
  el.classList.add(cls);
}

// ─── Auth ─────────────────────────────────────────────────────────────────────
function updateNav() {
  const loggedIn = !!state.userId;
  $('nav-username').textContent      = loggedIn ? state.name : '';
  $('nav-username').style.display    = loggedIn ? '' : 'none';
  $('nav-logout-btn').style.display  = loggedIn ? '' : 'none';
}

function doLogout() {
  localStorage.removeItem('ks2_auth');
  state.userId   = null;
  state.name  = '';
  state.email = '';
  stopTimer();
  updateNav();
  showScreen('screen-login');
  initLoginScreen();
}

function initApp() {
  document.querySelectorAll('.logout-btn').forEach(btn => { btn.onclick = doLogout; });

  const saved = localStorage.getItem('ks2_auth');
  if (saved) {
    try {
      const auth = JSON.parse(saved);
      state.userId = auth.userId;
      state.name   = auth.name;
      state.email  = auth.email;
      updateNav();
      showScreen('screen-welcome');
      initWelcome();
      return;
    } catch { /* invalid — fall through to login */ }
  }
  updateNav();
  showScreen('screen-login');
  initLoginScreen();
}

function initLoginScreen() {
  const nameInput     = $('login-name');
  const emailInput    = $('login-email');
  const passwordInput = $('login-password');
  const nameGroup     = $('reg-name-group');
  const submitBtn     = $('login-submit');
  const errorEl       = $('login-error');
  const tabs          = document.querySelectorAll('.tab-btn');
  let mode = 'login';

  nameInput.value     = '';
  emailInput.value    = '';
  passwordInput.value = '';
  errorEl.hidden      = true;
  submitBtn.disabled  = false;
  submitBtn.textContent = 'Log In';
  nameGroup.style.display = 'none';
  tabs.forEach(t => t.classList.toggle('active', t.dataset.tab === 'login'));

  tabs.forEach(tab => {
    tab.onclick = () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      mode = tab.dataset.tab;
      const isRegister = mode === 'register';
      submitBtn.textContent   = isRegister ? 'Register' : 'Log In';
      nameGroup.style.display = isRegister ? '' : 'none';
      errorEl.hidden = true;
    };
  });

  async function doSubmit() {
    const email    = emailInput.value.trim();
    const password = passwordInput.value;
    const name     = nameInput.value.trim();

    if (mode === 'register' && !name) {
      errorEl.textContent = 'Please enter your name.';
      errorEl.hidden = false; return;
    }
    if (!email || !password) {
      errorEl.textContent = 'Please enter your email address and password.';
      errorEl.hidden = false; return;
    }

    submitBtn.disabled = true;
    errorEl.hidden     = true;
    try {
      const body = mode === 'register' ? { name, email, password } : { email, password };
      const res  = await fetch(`/api/${mode}`, {
        method : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body   : JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        errorEl.textContent = data.error || 'Something went wrong.';
        errorEl.hidden      = false;
        submitBtn.disabled  = false;
        return;
      }
      state.userId = data.userId;
      state.name   = data.name;
      state.email  = data.email;
      localStorage.setItem('ks2_auth', JSON.stringify({ userId: data.userId, name: data.name, email: data.email }));
      updateNav();
      showScreen('screen-welcome');
      initWelcome();
    } catch {
      errorEl.textContent = 'Could not reach the server. Is it running?';
      errorEl.hidden      = false;
      submitBtn.disabled  = false;
    }
  }

  submitBtn.onclick = doSubmit;
  [nameInput, emailInput, passwordInput].forEach(el => {
    el.onkeydown = e => { if (e.key === 'Enter') doSubmit(); };
  });
}

// ─── Welcome Screen ───────────────────────────────────────────────────────────
function initWelcome() {
  const nameInput = $('name-input');
  const startBtn  = $('start-btn');
  let selectedCat   = '';
  let selectedMode  = 'standard';
  let selectedDiff  = 'medium';
  let selectedTotal = 10;

  // Reset state
  nameInput.value = state.name || '';
  startBtn.disabled = true;
  document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('selected'));
  document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('selected'));
  document.querySelector('[data-mode="standard"]').classList.add('selected');
  document.querySelectorAll('.diff-btn').forEach(b => b.classList.remove('selected'));
  document.querySelector('[data-diff="medium"]').classList.add('selected');
  document.querySelectorAll('.qcount-btn').forEach(b => b.classList.remove('selected'));
  document.querySelector('[data-count="10"]').classList.add('selected');

  function updateStartBtn() {
    startBtn.disabled = !nameInput.value.trim() || !selectedCat;
  }

  nameInput.oninput = updateStartBtn;

  document.querySelectorAll('.cat-btn').forEach(btn => {
    btn.onclick = () => {
      document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      selectedCat = btn.dataset.cat;
      updateStartBtn();
    };
  });

  document.querySelectorAll('.mode-btn').forEach(btn => {
    btn.onclick = () => {
      document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      selectedMode = btn.dataset.mode;
    };
  });

  document.querySelectorAll('.diff-btn').forEach(btn => {
    btn.onclick = () => {
      document.querySelectorAll('.diff-btn').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      selectedDiff = btn.dataset.diff;
    };
  });

  document.querySelectorAll('.qcount-btn').forEach(btn => {
    btn.onclick = () => {
      document.querySelectorAll('.qcount-btn').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      selectedTotal = parseInt(btn.dataset.count, 10);
    };
  });

  startBtn.onclick = () => {
    state.name       = nameInput.value.trim() || 'Champion';
    state.category   = selectedCat;
    state.mode       = selectedMode;
    state.difficulty = selectedDiff;
    state.total      = selectedTotal;
    startQuiz();
  };

  // Allow Enter key to start (if form is valid)
  nameInput.onkeydown = e => {
    if (e.key === 'Enter' && !startBtn.disabled) startBtn.click();
  };

  $('history-btn').onclick = () => showHistory();
}

// ─── Start Quiz ───────────────────────────────────────────────────────────────
function startQuiz() {
  state.questions = buildSet(state.category, state.total, state.difficulty);
  state.idx     = 0;
  state.score   = 0;
  state.skipped = 0;
  state.qTimes  = [];
  state.answered = false;

  showScreen('screen-quiz');
  $('hdr-name').textContent = state.name;

  $('quiz-quit-btn').onclick = () => {
    if (confirm('Quit the quiz? Your progress won\'t be saved.')) {
      stopTimer();
      showScreen('screen-welcome');
      initWelcome();
    }
  };

  startTimer();
  showQuestion();
}

// ─── Show Question ────────────────────────────────────────────────────────────
function showQuestion() {
  const q = state.questions[state.idx];
  state.qStart   = Date.now();
  state.answered = false;

  const catLabel = {
    length:   '📏 Length',
    weight:   '⚖️ Weight',
    capacity: '🧴 Capacity',
  }[q.category] || q.category;

  $('q-meta').textContent     = `Question ${state.idx + 1} of ${state.total}  ·  ${catLabel}`;
  $('q-text').innerHTML       = q.text;
  $('hdr-score').textContent  = `Score: ${state.score} / ${state.total}`;
  $('progress-fill').style.width    = `${(state.idx / state.total) * 100}%`;
  $('progress-label').textContent   = `${state.idx} / ${state.total}`;

  // Show the correct input mode
  const isRF = state.mode === 'rapidfire';
  $('options-grid').style.display         = isRF ? 'none' : '';
  $('rapidfire-input-wrap').style.display = isRF ? 'flex' : 'none';
  $('next-btn').hidden                    = false;

  if (isRF) {
    const rfInput  = $('rf-input');
    const rfSubmit = $('rf-submit');
    rfInput.value     = '';
    rfInput.disabled  = false;
    rfInput.className = 'rf-input';
    rfSubmit.disabled = false;
    const doSubmit = () => handleRapidFireAnswer(rfInput.value.trim(), q);
    rfInput.onkeydown = e => { if (e.key === 'Enter') doSubmit(); };
    rfSubmit.onclick  = doSubmit;
    setTimeout(() => rfInput.focus(), 50);
  } else {
    const grid    = $('options-grid');
    grid.innerHTML = '';
    const LETTERS = ['A', 'B', 'C', 'D'];
    q.values.forEach((val, i) => {
      const btn = document.createElement('button');
      btn.className = 'option-btn';
      btn.innerHTML =
        `<span class="option-letter">${LETTERS[i]}</span><span>${val}</span>`;
      btn.addEventListener('click', () => handleAnswer(LETTERS[i], q));
      grid.appendChild(btn);
    });
  }

  // Skip button
  $('skip-wrap').style.display = '';
  const skipBtn = $('skip-btn');
  skipBtn.disabled = false;
  skipBtn.onclick  = () => handleSkip(q);

  // Hide feedback
  $('feedback-box').hidden = true;

  // Animate card in
  animateEl(document.querySelector('.question-card'), 'anim-fade');
}

// ─── Handle Answer ────────────────────────────────────────────────────────────
function handleAnswer(chosen, q) {
  if (state.answered) return;
  state.answered = true;
  $('skip-wrap').style.display = 'none';

  const elapsed   = Date.now() - state.qStart;
  state.qTimes.push(elapsed);

  const isCorrect = chosen === q.answer;
  if (isCorrect) state.score++;

  // Style all buttons
  const btns    = document.querySelectorAll('.option-btn');
  const LETTERS = ['A', 'B', 'C', 'D'];

  btns.forEach((btn, i) => {
    btn.disabled = true;
    const letter = LETTERS[i];
    if (letter === q.answer) {
      btn.classList.add('correct');
      if (isCorrect) animateEl(btn, 'anim-pulse');
    } else if (letter === chosen) {
      btn.classList.add('wrong');
      // Shake the wrong button, then remove class after animation
      btn.classList.add('anim-shake');
      btn.addEventListener('animationend', () => btn.classList.remove('anim-shake'), { once: true });
    } else {
      btn.classList.add('dimmed');
    }
  });

  // Populate feedback
  const feedbackMsg  = $('feedback-msg');
  const feedbackHint = $('feedback-hint');
  const qTimeDisplay = $('q-time-display');
  const nextBtn      = $('next-btn');

  if (isCorrect) {
    feedbackMsg.textContent  = `✅ Correct! Well done, ${state.name}!`;
    feedbackMsg.className    = 'feedback-msg correct';
    feedbackHint.hidden      = true;
  } else {
    feedbackMsg.innerHTML =
      `❌ Not quite! The answer was <strong>${q.answer}) ${q.correctDisplay}</strong>.`;
    feedbackMsg.className    = 'feedback-msg wrong';
    feedbackHint.textContent = `💡 Remember: ${q.hint}`;
    feedbackHint.hidden      = false;
  }

  qTimeDisplay.textContent = fmtTime(elapsed, true);

  // Last question → change button label
  const isLast = state.idx === state.total - 1;
  nextBtn.textContent = isLast ? 'See My Results 🎉' : 'Next Question →';

  $('feedback-box').hidden = false;

  // Update score in header
  $('hdr-score').textContent = `Score: ${state.score} / ${state.total}`;

  nextBtn.onclick = () => {
    state.idx++;
    if (state.idx >= state.total) {
      showResults();
    } else {
      showQuestion();
    }
  };
}

// ─── Rapid Fire Answer Handler ────────────────────────────────────────────────
function handleRapidFireAnswer(val, q) {
  if (state.answered) return;
  state.answered = true;
  $('skip-wrap').style.display = 'none';

  const rfInput  = $('rf-input');
  const rfSubmit = $('rf-submit');
  rfInput.disabled  = true;
  rfSubmit.disabled = true;

  const elapsed   = Date.now() - state.qStart;
  state.qTimes.push(elapsed);

  const parsed    = parseFloat(val.replace(/,/g, ''));
  const isCorrect = !isNaN(parsed) && parsed === q.correctValue;
  if (isCorrect) state.score++;

  rfInput.classList.add(isCorrect ? 'rf-correct' : 'rf-wrong');

  const feedbackMsg  = $('feedback-msg');
  const feedbackHint = $('feedback-hint');
  if (isCorrect) {
    feedbackMsg.textContent  = `✅ Correct! Well done, ${state.name}!`;
    feedbackMsg.className    = 'feedback-msg correct';
    feedbackHint.hidden      = true;
  } else {
    feedbackMsg.innerHTML    = `❌ Not quite! The answer was <strong>${q.correctDisplay}</strong>.`;
    feedbackMsg.className    = 'feedback-msg wrong';
    feedbackHint.textContent = `💡 Remember: ${q.hint}`;
    feedbackHint.hidden      = false;
  }

  $('q-time-display').textContent = fmtTime(elapsed, true);
  $('hdr-score').textContent      = `Score: ${state.score} / ${state.total}`;
  $('next-btn').hidden            = true;
  $('feedback-box').hidden        = false;

  // Auto-advance: immediately on correct, pause on wrong to read the hint
  setTimeout(() => {
    state.idx++;
    if (state.idx >= state.total) showResults();
    else showQuestion();
  }, isCorrect ? 0 : 2200);
}

// ─── Skip Handler ─────────────────────────────────────────────────────────────
function handleSkip(q) {
  if (state.answered) return;
  state.answered = true;
  state.skipped++;
  $('skip-wrap').style.display = 'none';

  const elapsed = Date.now() - state.qStart;
  state.qTimes.push(elapsed);

  const isRF = state.mode === 'rapidfire';

  if (isRF) {
    const rfInput  = $('rf-input');
    const rfSubmit = $('rf-submit');
    rfInput.disabled  = true;
    rfSubmit.disabled = true;
    rfInput.classList.add('rf-skipped');
  } else {
    const btns    = document.querySelectorAll('.option-btn');
    const LETTERS = ['A', 'B', 'C', 'D'];
    btns.forEach((btn, i) => {
      btn.disabled = true;
      if (LETTERS[i] === q.answer) btn.classList.add('correct');
      else btn.classList.add('dimmed');
    });
  }

  const feedbackMsg  = $('feedback-msg');
  const feedbackHint = $('feedback-hint');
  feedbackMsg.innerHTML = isRF
    ? `⏭ Skipped! The answer was <strong>${q.correctDisplay}</strong>.`
    : `⏭ Skipped! The answer was <strong>${q.answer}) ${q.correctDisplay}</strong>.`;
  feedbackMsg.className    = 'feedback-msg skipped';
  feedbackHint.textContent = `💡 Remember: ${q.hint}`;
  feedbackHint.hidden      = false;
  $('q-time-display').textContent = fmtTime(elapsed, true);
  $('feedback-box').hidden = false;

  if (isRF) {
    $('next-btn').hidden = true;
    setTimeout(() => {
      state.idx++;
      if (state.idx >= state.total) showResults();
      else showQuestion();
    }, 2200);
  } else {
    const isLast = state.idx === state.total - 1;
    const nextBtn = $('next-btn');
    nextBtn.textContent = isLast ? 'See My Results 🎉' : 'Next Question →';
    nextBtn.hidden = false;
    nextBtn.onclick = () => {
      state.idx++;
      if (state.idx >= state.total) showResults();
      else showQuestion();
    };
  }
}

// ─── Progress persistence ─────────────────────────────────────────────────────
async function saveAttempt(totalMs) {
  if (!state.userId) return;
  try {
    await fetch('/api/attempt', {
      method : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body   : JSON.stringify({
        userId     : state.userId,
        category   : state.category,
        mode       : state.mode,
        score      : state.score,
        total      : state.total,
        timeTakenMs: totalMs,
      }),
    });
  } catch { /* silently ignore – quiz still works without DB */ }
}

async function loadHistory() {
  if (!state.userId) return;
  const wrap = $('history-wrap');
  const list = $('history-list');
  try {
    const res  = await fetch(`/api/history?userId=${state.userId}`);
    const data = await res.json();
    if (!res.ok || !data.attempts.length) return;
    list.innerHTML = data.attempts.map(a => {
      const date    = new Date(a.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' });
      const pctCls  = a.percentage >= 80 ? 'pct-high' : a.percentage >= 60 ? 'pct-mid' : 'pct-low';
      const modeIco = a.mode === 'rapidfire' ? '⚡' : '🎯';
      return `
        <div class="history-row">
          <span class="h-date">${date}</span>
          <span class="h-cat">${a.category}</span>
          <span class="h-mode">${modeIco}</span>
          <span class="h-score">${a.score}/${a.total}</span>
          <span class="h-pct ${pctCls}">${a.percentage}%</span>
          <span class="h-time">${fmtTime(a.timeTakenMs)}</span>
        </div>`;
    }).join('');
    wrap.hidden = false;
  } catch { /* silently ignore */ }
}

// ─── History Screen ───────────────────────────────────────────────────────────
async function showHistory() {
  showScreen('screen-history');

  $('hist-username').textContent = state.name || '';
  $('hist-summary').hidden = true;
  $('hist-list').innerHTML = '<p class="hist-empty">Loading your history…</p>';

  $('hist-back-btn').onclick = () => {
    showScreen('screen-welcome');
    initWelcome();
  };

  if (!state.userId) {
    $('hist-list').innerHTML = '<p class="hist-empty">Please log in to see your history.</p>';
    return;
  }

  try {
    const res  = await fetch(`/api/history?userId=${state.userId}&limit=50`);
    const data = await res.json();

    if (!res.ok || !data.attempts || !data.attempts.length) {
      $('hist-list').innerHTML = '<p class="hist-empty">No quiz attempts yet. Complete a quiz to see your history here!</p>';
      return;
    }

    const attempts = data.attempts;

    // Compute summary stats
    const total   = attempts.length;
    const bestPct = Math.max(...attempts.map(a => a.percentage));
    const avgPct  = Math.round(attempts.reduce((s, a) => s + a.percentage, 0) / total);
    const highCount = attempts.filter(a => a.percentage >= 80).length;

    $('hs-total').textContent  = total;
    $('hs-best').textContent   = bestPct + '%';
    $('hs-avg').textContent    = avgPct  + '%';
    $('hs-streak').textContent = highCount;
    $('hist-summary').hidden   = false;

    // Render rows
    $('hist-list').innerHTML = attempts.map((a, i) => {
      const date    = new Date(a.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' });
      const time    = new Date(a.date).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
      const pctCls  = a.percentage >= 80 ? 'pct-high' : a.percentage >= 60 ? 'pct-mid' : 'pct-low';
      const modeIco = a.mode === 'rapidfire' ? '⚡ Rapid' : '🎯 Standard';
      const catIco  = { length: '📏', weight: '⚖️', capacity: '🧴', mixed: '🎲' }[a.category] || '';
      return `
        <div class="hist-row${i % 2 === 0 ? '' : ' hist-row-alt'}">
          <span class="h-date">${date}<br><span class="h-time-sm">${time}</span></span>
          <span class="h-cat">${catIco} ${a.category}</span>
          <span class="h-mode">${modeIco}</span>
          <span class="h-score">${a.score}/${a.total}</span>
          <span class="h-pct ${pctCls}">${a.percentage}%</span>
          <span class="h-time">${fmtTime(a.timeTakenMs)}</span>
        </div>`;
    }).join('');

  } catch {
    $('hist-list').innerHTML = '<p class="hist-empty">Could not load history. Is the server running?</p>';
  }
}

// ─── Results Screen ───────────────────────────────────────────────────────────
function showResults() {
  stopTimer();

  const totalMs = Date.now() - state.quizStart;
  saveAttempt(totalMs);

  // Reset history section while new data loads
  $('history-wrap').hidden = true;
  $('history-list').innerHTML = '';
  const pct     = Math.round((state.score / state.total) * 100);
  const avgMs   = state.qTimes.length
    ? state.qTimes.reduce((a, b) => a + b, 0) / state.qTimes.length
    : 0;

  const [emoji, grade, msg] =
    pct === 100 ? ['🌟', '★★★ Perfect!',       "Incredible! A flawless score! You're a unit conversion superstar!"]  :
    pct >= 80   ? ['🎉', '★★  Excellent!',       "Brilliant! You really know your units. Keep it up!"]                :
    pct >= 60   ? ['👍', '★   Good Work!',        "Well done! A bit more practice and you'll be a pro!"]              :
    pct >= 40   ? ['🙂', '    Keep Trying!',      "Good effort! Review your conversion tables and try again."]        :
                  ['📚', '    Keep Practising!',  "Don't give up! You'll get there with more practice."];

  showScreen('screen-results');

  $('result-emoji').textContent    = emoji;
  $('result-greeting').textContent = `Great effort, ${state.name}!`;
  $('big-score').textContent       = `${state.score} / ${state.total}`;
  $('grade-badge').textContent     = grade;
  $('stat-total-time').textContent = fmtTime(totalMs);
  $('stat-avg-time').textContent   = fmtTime(avgMs, true);
  $('stat-pct').textContent        = pct + '%';
  $('stat-skipped').textContent    = state.skipped;
  $('result-msg').textContent      = msg;

  // Update final progress bar to 100 %
  $('progress-fill').style.width   = '100%';
  $('progress-label').textContent  = `${state.total} / ${state.total}`;

  // Animate card
  animateEl(document.querySelector('.results-card'), 'anim-pop');

  loadHistory();

  $('play-again-btn').onclick = () => {
    showScreen('screen-welcome');
    initWelcome();
  };
}

// ─── Bootstrap ────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initApp();
});
