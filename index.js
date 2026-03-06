#!/usr/bin/env node
'use strict';

const readline = require('readline');

// ─── ANSI Colours ─────────────────────────────────────────────────────────────
const C = {
  r: '\x1b[0m',   b: '\x1b[1m',   d: '\x1b[2m',
  G: '\x1b[92m',  R: '\x1b[91m',  Y: '\x1b[93m',
  B: '\x1b[94m',  N: '\x1b[96m',  M: '\x1b[95m',
};
const wrap  = (...c) => t => c.join('') + t + C.r;
const bold    = wrap(C.b);
const green   = wrap(C.G, C.b);
const red     = wrap(C.R, C.b);
const yellow  = wrap(C.Y);
const blue    = wrap(C.B, C.b);
const cyan    = wrap(C.N);
const magenta = wrap(C.M, C.b);
const dim     = wrap(C.d);

// ─── Helpers ──────────────────────────────────────────────────────────────────
const rand = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
const pick = arr => arr[Math.floor(Math.random() * arr.length)];

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ─── Core Question Builder ────────────────────────────────────────────────────
// Builds a multiple-choice question with 4 options (A–D).
function makeQ(text, correct, wrongs, unit, hint, category) {
  const fmt  = v => `${v}${unit ? ' ' + unit : ''}`;

  // Deduplicate, remove invalids, take up to 3 wrong answers
  const validWrongs = [...new Set(wrongs)].filter(w => w > 0 && w !== correct).slice(0, 3);
  const pool = shuffle([correct, ...validWrongs]);

  // Safety net: pad to 4 options if needed
  let seed = 1;
  while (pool.length < 4) {
    const extra = correct + seed * Math.max(1, Math.ceil(correct / 5));
    if (!pool.includes(extra)) pool.push(extra);
    seed++;
    if (seed > 50) break; // guard against infinite loop
  }

  const LETTERS  = ['A', 'B', 'C', 'D'];
  const answerIdx = pool.indexOf(correct);
  return {
    text,
    options: pool.map((v, i) => `  ${bold(LETTERS[i] + ')')} ${fmt(v)}`),
    answer:        LETTERS[answerIdx],
    correctDisplay: fmt(correct),
    hint,
    category,
  };
}

// ─── Length Question Generator ────────────────────────────────────────────────
// Covers: km↔m, m↔cm, cm↔mm, m→mm, plus word problems.
function qLength() {
  const t = rand(1, 9);

  if (t <= 2) {                        // km → m
    const km = rand(1, 20);
    return makeQ(
      `Convert ${cyan(km + ' km')} to metres.`,
      km * 1000, [km * 100, km * 10, km * 10000, (km + 2) * 1000],
      'm', '1 km = 1000 m', 'length'
    );
  }
  if (t <= 4) {                        // m → cm
    const m = rand(1, 20);
    return makeQ(
      `Convert ${cyan(m + ' m')} to centimetres.`,
      m * 100, [m * 10, m * 1000, m, (m + 3) * 100],
      'cm', '1 m = 100 cm', 'length'
    );
  }
  if (t === 5) {                       // cm → mm
    const cm = rand(2, 30);
    return makeQ(
      `Convert ${cyan(cm + ' cm')} to millimetres.`,
      cm * 10, [cm * 100, cm, cm * 1000, (cm + 5) * 10],
      'mm', '1 cm = 10 mm', 'length'
    );
  }
  if (t === 6) {                       // m → mm
    const m = rand(1, 10);
    return makeQ(
      `Convert ${cyan(m + ' m')} to millimetres.`,
      m * 1000, [m * 100, m * 10, m * 10000],
      'mm', '1 m = 1000 mm', 'length'
    );
  }
  if (t === 7) {                       // m → km
    const km = rand(2, 15);
    return makeQ(
      `Convert ${cyan(km * 1000 + ' m')} to kilometres.`,
      km, [km * 10, km * 100, km + 5, km - 1].filter(v => v > 0),
      'km', '1000 m = 1 km', 'length'
    );
  }
  if (t === 8) {                       // cm → m
    const m = rand(2, 20);
    return makeQ(
      `Convert ${cyan(m * 100 + ' cm')} to metres.`,
      m, [m * 10, m * 100, m + 5, m - 1].filter(v => v > 0),
      'm', '100 cm = 1 m', 'length'
    );
  }
  // t === 9: word problems
  const scenes = [
    { text: `A race track is ${cyan('5 km')} long. How many metres is that?`,
      correct: 5000,  wrongs: [500, 50000, 50],       unit: 'm',  hint: '1 km = 1000 m' },
    { text: `A ruler is ${cyan('30 cm')} long. How many millimetres is that?`,
      correct: 300,   wrongs: [30, 3000, 3],           unit: 'mm', hint: '1 cm = 10 mm' },
    { text: `A football pitch is ${cyan('100 m')} long. How many centimetres is that?`,
      correct: 10000, wrongs: [1000, 100, 100000],     unit: 'cm', hint: '1 m = 100 cm' },
    { text: `A road is ${cyan('12 km')} long. How many metres is that?`,
      correct: 12000, wrongs: [1200, 120, 120000],     unit: 'm',  hint: '1 km = 1000 m' },
    { text: `A worm is ${cyan('8 cm')} long. How many mm is that?`,
      correct: 80,    wrongs: [8, 800, 8000],           unit: 'mm', hint: '1 cm = 10 mm' },
    { text: `A swimming pool is ${cyan('25 m')} long. How many centimetres is that?`,
      correct: 2500,  wrongs: [250, 25000, 25],         unit: 'cm', hint: '1 m = 100 cm' },
    { text: `A bookshelf is ${cyan('200 cm')} wide. How many metres is that?`,
      correct: 2,     wrongs: [20, 200, 20],            unit: 'm',  hint: '100 cm = 1 m' },
    { text: `A marathon is ${cyan('42 km')} long. How many metres is that?`,
      correct: 42000, wrongs: [4200, 420, 420000],      unit: 'm',  hint: '1 km = 1000 m' },
    { text: `A garden fence is ${cyan('8 m')} long. How many centimetres is that?`,
      correct: 800,   wrongs: [80, 8000, 8],            unit: 'cm', hint: '1 m = 100 cm' },
    { text: `A pencil is ${cyan('18 cm')} long. How many millimetres is that?`,
      correct: 180,   wrongs: [18, 1800, 18],           unit: 'mm', hint: '1 cm = 10 mm' },
    { text: `A bridge is ${cyan('3 km')} long. How many metres is that?`,
      correct: 3000,  wrongs: [300, 30000, 30],         unit: 'm',  hint: '1 km = 1000 m' },
    { text: `A classroom is ${cyan('9 m')} wide. How many centimetres is that?`,
      correct: 900,   wrongs: [90, 9000, 9],            unit: 'cm', hint: '1 m = 100 cm' },
    { text: `A butterfly has a wingspan of ${cyan('6 cm')}. How many millimetres is that?`,
      correct: 60,    wrongs: [6, 600, 6000],           unit: 'mm', hint: '1 cm = 10 mm' },
    { text: `A highway is ${cyan('15 km')} long. How many metres is that?`,
      correct: 15000, wrongs: [1500, 150, 150000],      unit: 'm',  hint: '1 km = 1000 m' },
    { text: `A door is ${cyan('2 m')} tall. How many centimetres is that?`,
      correct: 200,   wrongs: [20, 2000, 2],            unit: 'cm', hint: '1 m = 100 cm' },
    { text: `A caterpillar is ${cyan('4 cm')} long. How many millimetres is that?`,
      correct: 40,    wrongs: [4, 400, 4000],           unit: 'mm', hint: '1 cm = 10 mm' },
    { text: `A train track is ${cyan('8 km')} long. How many metres is that?`,
      correct: 8000,  wrongs: [800, 80000, 80],         unit: 'm',  hint: '1 km = 1000 m' },
    { text: `A corridor is ${cyan('12 m')} long. How many centimetres is that?`,
      correct: 1200,  wrongs: [120, 12000, 12],         unit: 'cm', hint: '1 m = 100 cm' },
    { text: `A wristband is ${cyan('20 cm')} long. How many millimetres is that?`,
      correct: 200,   wrongs: [20, 2000, 20000],        unit: 'mm', hint: '1 cm = 10 mm' },
    { text: `A cycling route is ${cyan('6 km')} long. How many metres is that?`,
      correct: 6000,  wrongs: [600, 60000, 60],         unit: 'm',  hint: '1 km = 1000 m' },
    { text: `A curtain rail is ${cyan('300 cm')} long. How many metres is that?`,
      correct: 3,     wrongs: [30, 300, 30],            unit: 'm',  hint: '100 cm = 1 m' },
    { text: `A finger is ${cyan('7 cm')} long. How many millimetres is that?`,
      correct: 70,    wrongs: [7, 700, 7000],           unit: 'mm', hint: '1 cm = 10 mm' },
    { text: `A canal is ${cyan('10 km')} long. How many metres is that?`,
      correct: 10000, wrongs: [1000, 100000, 100],      unit: 'm',  hint: '1 km = 1000 m' },
    { text: `A rope is ${cyan('500 cm')} long. How many metres is that?`,
      correct: 5,     wrongs: [50, 500, 50],            unit: 'm',  hint: '100 cm = 1 m' },
    { text: `A pencil case is ${cyan('22 cm')} long. How many millimetres is that?`,
      correct: 220,   wrongs: [22, 2200, 2200],         unit: 'mm', hint: '1 cm = 10 mm' },
    { text: `A coast road is ${cyan('18 km')} long. How many metres is that?`,
      correct: 18000, wrongs: [1800, 180, 180000],      unit: 'm',  hint: '1 km = 1000 m' },
    { text: `A plank is ${cyan('400 cm')} long. How many metres is that?`,
      correct: 4,     wrongs: [40, 400, 40],            unit: 'm',  hint: '100 cm = 1 m' },
    { text: `A ribbon is ${cyan('25 cm')} long. How many millimetres is that?`,
      correct: 250,   wrongs: [25, 2500, 2500],         unit: 'mm', hint: '1 cm = 10 mm' },
    { text: `A motorway is ${cyan('25 km')} long. How many metres is that?`,
      correct: 25000, wrongs: [2500, 250, 250000],      unit: 'm',  hint: '1 km = 1000 m' },
    { text: `A wardrobe is ${cyan('200 cm')} tall. How many metres is that?`,
      correct: 2,     wrongs: [20, 2000, 200],          unit: 'm',  hint: '100 cm = 1 m' },
    { text: `A straw is ${cyan('19 cm')} long. How many millimetres is that?`,
      correct: 190,   wrongs: [19, 1900, 1900],         unit: 'mm', hint: '1 cm = 10 mm' },
    { text: `A tunnel is ${cyan('3000 m')} long. How many kilometres is that?`,
      correct: 3,     wrongs: [30, 300, 3000],          unit: 'km', hint: '1000 m = 1 km' },
    { text: `A pipe is ${cyan('600 cm')} long. How many metres is that?`,
      correct: 6,     wrongs: [60, 600, 60],            unit: 'm',  hint: '100 cm = 1 m' },
    { text: `A branch is ${cyan('35 cm')} long. How many millimetres is that?`,
      correct: 350,   wrongs: [35, 3500, 3500],         unit: 'mm', hint: '1 cm = 10 mm' },
    { text: `A canal is ${cyan('4000 m')} long. How many kilometres is that?`,
      correct: 4,     wrongs: [40, 400, 4000],          unit: 'km', hint: '1000 m = 1 km' },
    { text: `A driveway is ${cyan('900 cm')} long. How many metres is that?`,
      correct: 9,     wrongs: [90, 900, 90],            unit: 'm',  hint: '100 cm = 1 m' },
    { text: `A leaf is ${cyan('12 cm')} long. How many millimetres is that?`,
      correct: 120,   wrongs: [12, 1200, 1200],         unit: 'mm', hint: '1 cm = 10 mm' },
    { text: `A mountain path is ${cyan('2000 m')} long. How many kilometres is that?`,
      correct: 2,     wrongs: [20, 200, 2000],          unit: 'km', hint: '1000 m = 1 km' },
    { text: `A fence is ${cyan('700 cm')} long. How many metres is that?`,
      correct: 7,     wrongs: [70, 700, 70],            unit: 'm',  hint: '100 cm = 1 m' },
    { text: `An earthworm is ${cyan('9 cm')} long. How many millimetres is that?`,
      correct: 90,    wrongs: [9, 900, 9000],           unit: 'mm', hint: '1 cm = 10 mm' },
    { text: `A river is ${cyan('6000 m')} long. How many kilometres is that?`,
      correct: 6,     wrongs: [60, 600, 6000],          unit: 'km', hint: '1000 m = 1 km' },
    { text: `A nail is ${cyan('5 cm')} long. How many millimetres is that?`,
      correct: 50,    wrongs: [5, 500, 5000],           unit: 'mm', hint: '1 cm = 10 mm' },
    { text: `A runway is ${cyan('2 km')} long. How many metres is that?`,
      correct: 2000,  wrongs: [200, 20000, 20],         unit: 'm',  hint: '1 km = 1000 m' },
    { text: `A garden path is ${cyan('4 m')} long. How many centimetres is that?`,
      correct: 400,   wrongs: [40, 4000, 4],            unit: 'cm', hint: '1 m = 100 cm' },
    { text: `A snake is ${cyan('15 cm')} long. How many millimetres is that?`,
      correct: 150,   wrongs: [15, 1500, 1500],         unit: 'mm', hint: '1 cm = 10 mm' },
    { text: `A hiking trail is ${cyan('7 km')} long. How many metres is that?`,
      correct: 7000,  wrongs: [700, 70000, 70],         unit: 'm',  hint: '1 km = 1000 m' },
    { text: `A table is ${cyan('3 m')} long. How many centimetres is that?`,
      correct: 300,   wrongs: [30, 3000, 3],            unit: 'cm', hint: '1 m = 100 cm' },
    { text: `A hair clip is ${cyan('3 cm')} long. How many millimetres is that?`,
      correct: 30,    wrongs: [3, 300, 3000],           unit: 'mm', hint: '1 cm = 10 mm' },
    { text: `A sports track is ${cyan('400 m')} long. How many centimetres is that?`,
      correct: 40000, wrongs: [4000, 400000, 400],      unit: 'cm', hint: '1 m = 100 cm' },
    { text: `A city bypass is ${cyan('9 km')} long. How many metres is that?`,
      correct: 9000,  wrongs: [900, 90000, 90],         unit: 'm',  hint: '1 km = 1000 m' },
    { text: `A bookworm chews ${cyan('11 cm')} through a book. How many mm is that?`,
      correct: 110,   wrongs: [11, 1100, 1100],         unit: 'mm', hint: '1 cm = 10 mm' },
    { text: `A park trail is ${cyan('5000 m')} long. How many kilometres is that?`,
      correct: 5,     wrongs: [50, 500, 5000],          unit: 'km', hint: '1000 m = 1 km' },
    { text: `A window frame is ${cyan('100 cm')} wide. How many metres is that?`,
      correct: 1,     wrongs: [10, 100, 1000],          unit: 'm',  hint: '100 cm = 1 m' },
    { text: `A spider is ${cyan('2 cm')} long. How many millimetres is that?`,
      correct: 20,    wrongs: [2, 200, 2000],           unit: 'mm', hint: '1 cm = 10 mm' },
    { text: `A school field is ${cyan('11 km')} from town. How many metres is that?`,
      correct: 11000, wrongs: [1100, 110, 110000],      unit: 'm',  hint: '1 km = 1000 m' },
  ];
  const s = pick(scenes);
  return makeQ(s.text, s.correct, s.wrongs, s.unit, s.hint, 'length');
}

// ─── Weight Question Generator ────────────────────────────────────────────────
// Covers: kg↔g, tonne↔kg, plus word problems.
function qWeight() {
  const t = rand(1, 9);

  if (t <= 3) {                        // kg → g
    const kg = rand(1, 20);
    return makeQ(
      `Convert ${cyan(kg + ' kg')} to grams.`,
      kg * 1000, [kg * 100, kg * 10, (kg + 3) * 1000, kg * 10000],
      'g', '1 kg = 1000 g', 'weight'
    );
  }
  if (t <= 5) {                        // g → kg
    const kg = rand(1, 10);
    return makeQ(
      `Convert ${cyan(kg * 1000 + ' g')} to kilograms.`,
      kg, [kg * 10, kg * 100, kg + 4, kg + 2],
      'kg', '1000 g = 1 kg', 'weight'
    );
  }
  if (t === 6) {                       // tonne(s) → kg
    const tn = rand(1, 10);
    return makeQ(
      `Convert ${cyan(tn + (tn === 1 ? ' tonne' : ' tonnes'))} to kilograms.`,
      tn * 1000, [tn * 100, tn * 10000, (tn + 2) * 1000],
      'kg', '1 tonne = 1000 kg', 'weight'
    );
  }
  if (t === 7) {                       // kg → tonnes
    const tn = rand(2, 8);
    return makeQ(
      `Convert ${cyan(tn * 1000 + ' kg')} to tonnes.`,
      tn, [tn * 10, tn * 100, tn + 3],
      'tonnes', '1000 kg = 1 tonne', 'weight'
    );
  }
  if (t === 8) {                       // mixed units addition (g + kg expressed in g)
    const kg = rand(1, 5);
    const g  = rand(1, 9) * 100;
    return makeQ(
      `What is ${cyan(kg + ' kg')} and ${cyan(g + ' g')} in grams?`,
      kg * 1000 + g, [kg * 100 + g, kg * 1000, kg * 1000 - g, kg * 10000 + g],
      'g', `${kg} kg = ${kg * 1000} g, then add ${g} g`, 'weight'
    );
  }
  // t === 9: word problems
  const scenes = [
    { text: `A bag of potatoes weighs ${cyan('3 kg')}. How many grams is that?`,
      correct: 3000,  wrongs: [300, 30000, 30],    unit: 'g',      hint: '1 kg = 1000 g' },
    { text: `A whale weighs ${cyan('5 tonnes')}. How many kg is that?`,
      correct: 5000,  wrongs: [500, 50000, 50],    unit: 'kg',     hint: '1 tonne = 1000 kg' },
    { text: `A parcel weighs ${cyan('2000 g')}. How many kilograms is that?`,
      correct: 2,     wrongs: [20, 200, 2000],     unit: 'kg',     hint: '1000 g = 1 kg' },
    { text: `A baby elephant weighs ${cyan('4000 kg')}. How many tonnes is that?`,
      correct: 4,     wrongs: [40, 400, 4000],     unit: 'tonnes', hint: '1000 kg = 1 tonne' },
    { text: `A loaf of bread weighs ${cyan('800 g')}. How many grams do ${cyan('3 loaves')} weigh?`,
      correct: 2400,  wrongs: [800, 1600, 3200],   unit: 'g',      hint: 'Multiply: 3 × 800 g' },
    { text: `A truck can carry ${cyan('7 tonnes')}. How many kg is that?`,
      correct: 7000,  wrongs: [700, 70000, 70],    unit: 'kg',     hint: '1 tonne = 1000 kg' },
    { text: `A dictionary weighs ${cyan('1500 g')}. How many grams in ${cyan('2 dictionaries')}?`,
      correct: 3000,  wrongs: [1500, 4500, 6000],  unit: 'g',      hint: 'Multiply: 2 × 1500 g' },
    { text: `A bag of sugar weighs ${cyan('2 kg')}. How many grams is that?`,
      correct: 2000,  wrongs: [200, 20000, 20],    unit: 'g',      hint: '1 kg = 1000 g' },
    { text: `A cat weighs ${cyan('4 kg')}. How many grams is that?`,
      correct: 4000,  wrongs: [400, 40000, 40],    unit: 'g',      hint: '1 kg = 1000 g' },
    { text: `A box of apples weighs ${cyan('5 kg')}. How many grams is that?`,
      correct: 5000,  wrongs: [500, 50000, 50],    unit: 'g',      hint: '1 kg = 1000 g' },
    { text: `A package weighs ${cyan('3000 g')}. How many kilograms is that?`,
      correct: 3,     wrongs: [30, 300, 3000],     unit: 'kg',     hint: '1000 g = 1 kg' },
    { text: `A suitcase weighs ${cyan('8000 g')}. How many kilograms is that?`,
      correct: 8,     wrongs: [80, 800, 8000],     unit: 'kg',     hint: '1000 g = 1 kg' },
    { text: `A ship weighs ${cyan('10 tonnes')}. How many kilograms is that?`,
      correct: 10000, wrongs: [1000, 100000, 100], unit: 'kg',     hint: '1 tonne = 1000 kg' },
    { text: `A heavy rock weighs ${cyan('6000 kg')}. How many tonnes is that?`,
      correct: 6,     wrongs: [60, 600, 6000],     unit: 'tonnes', hint: '1000 kg = 1 tonne' },
    { text: `A bag of rice weighs ${cyan('1 kg')}. How many grams is that?`,
      correct: 1000,  wrongs: [100, 10000, 10],    unit: 'g',      hint: '1 kg = 1000 g' },
    { text: `A bunch of grapes weighs ${cyan('500 g')}. How many grams do ${cyan('4 bunches')} weigh?`,
      correct: 2000,  wrongs: [500, 1000, 2500],   unit: 'g',      hint: 'Multiply: 4 × 500 g' },
    { text: `A brick weighs ${cyan('3 kg')}. How many grams is that?`,
      correct: 3000,  wrongs: [300, 30000, 30],    unit: 'g',      hint: '1 kg = 1000 g' },
    { text: `A pumpkin weighs ${cyan('6 kg')}. How many grams is that?`,
      correct: 6000,  wrongs: [600, 60000, 60],    unit: 'g',      hint: '1 kg = 1000 g' },
    { text: `A jar of jam weighs ${cyan('400 g')}. How many grams do ${cyan('3 jars')} weigh?`,
      correct: 1200,  wrongs: [400, 800, 1600],    unit: 'g',      hint: 'Multiply: 3 × 400 g' },
    { text: `A bicycle weighs ${cyan('9 kg')}. How many grams is that?`,
      correct: 9000,  wrongs: [900, 90000, 90],    unit: 'g',      hint: '1 kg = 1000 g' },
    { text: `A bag of flour weighs ${cyan('5000 g')}. How many kilograms is that?`,
      correct: 5,     wrongs: [50, 500, 5000],     unit: 'kg',     hint: '1000 g = 1 kg' },
    { text: `A train weighs ${cyan('3 tonnes')}. How many kilograms is that?`,
      correct: 3000,  wrongs: [300, 30000, 30],    unit: 'kg',     hint: '1 tonne = 1000 kg' },
    { text: `A statue weighs ${cyan('2000 kg')}. How many tonnes is that?`,
      correct: 2,     wrongs: [20, 200, 2000],     unit: 'tonnes', hint: '1000 kg = 1 tonne' },
    { text: `A chicken weighs ${cyan('2 kg')}. How many grams is that?`,
      correct: 2000,  wrongs: [200, 20000, 20],    unit: 'g',      hint: '1 kg = 1000 g' },
    { text: `A melon weighs ${cyan('1000 g')}. How many kilograms is that?`,
      correct: 1,     wrongs: [10, 100, 1000],     unit: 'kg',     hint: '1000 g = 1 kg' },
    { text: `A dumbbell weighs ${cyan('5 kg')}. How many grams is that?`,
      correct: 5000,  wrongs: [500, 50000, 50],    unit: 'g',      hint: '1 kg = 1000 g' },
    { text: `A tractor weighs ${cyan('4 tonnes')}. How many kilograms is that?`,
      correct: 4000,  wrongs: [400, 40000, 40],    unit: 'kg',     hint: '1 tonne = 1000 kg' },
    { text: `A large rock weighs ${cyan('3000 kg')}. How many tonnes is that?`,
      correct: 3,     wrongs: [30, 300, 3000],     unit: 'tonnes', hint: '1000 kg = 1 tonne' },
    { text: `A strawberry punnet weighs ${cyan('400 g')}. How many grams do ${cyan('5 punnets')} weigh?`,
      correct: 2000,  wrongs: [400, 1000, 2400],   unit: 'g',      hint: 'Multiply: 5 × 400 g' },
    { text: `A dog weighs ${cyan('8 kg')}. How many grams is that?`,
      correct: 8000,  wrongs: [800, 80000, 80],    unit: 'g',      hint: '1 kg = 1000 g' },
    { text: `A bag of carrots weighs ${cyan('6000 g')}. How many kilograms is that?`,
      correct: 6,     wrongs: [60, 600, 6000],     unit: 'kg',     hint: '1000 g = 1 kg' },
    { text: `A motorbike weighs ${cyan('2 tonnes')}. How many kilograms is that?`,
      correct: 2000,  wrongs: [200, 20000, 20],    unit: 'kg',     hint: '1 tonne = 1000 kg' },
    { text: `A pile of books weighs ${cyan('4000 kg')}. How many tonnes is that?`,
      correct: 4,     wrongs: [40, 400, 4000],     unit: 'tonnes', hint: '1000 kg = 1 tonne' },
    { text: `A carton of milk weighs ${cyan('1 kg')}. How many grams is that?`,
      correct: 1000,  wrongs: [100, 10000, 10],    unit: 'g',      hint: '1 kg = 1000 g' },
    { text: `A box of chocolates weighs ${cyan('600 g')}. How many grams do ${cyan('4 boxes')} weigh?`,
      correct: 2400,  wrongs: [600, 1200, 3000],   unit: 'g',      hint: 'Multiply: 4 × 600 g' },
    { text: `A watermelon weighs ${cyan('7 kg')}. How many grams is that?`,
      correct: 7000,  wrongs: [700, 70000, 70],    unit: 'g',      hint: '1 kg = 1000 g' },
    { text: `A parcel weighs ${cyan('9000 g')}. How many kilograms is that?`,
      correct: 9,     wrongs: [90, 900, 9000],     unit: 'kg',     hint: '1000 g = 1 kg' },
    { text: `A bus weighs ${cyan('8 tonnes')}. How many kilograms is that?`,
      correct: 8000,  wrongs: [800, 80000, 80],    unit: 'kg',     hint: '1 tonne = 1000 kg' },
    { text: `A yacht weighs ${cyan('5000 kg')}. How many tonnes is that?`,
      correct: 5,     wrongs: [50, 500, 5000],     unit: 'tonnes', hint: '1000 kg = 1 tonne' },
    { text: `A box of cereal weighs ${cyan('750 g')}. How many grams do ${cyan('2 boxes')} weigh?`,
      correct: 1500,  wrongs: [750, 1000, 2000],   unit: 'g',      hint: 'Multiply: 2 × 750 g' },
    { text: `A tin of beans weighs ${cyan('400 g')}. How many grams do ${cyan('5 tins')} weigh?`,
      correct: 2000,  wrongs: [400, 1000, 2400],   unit: 'g',      hint: 'Multiply: 5 × 400 g' },
    { text: `A coconut weighs ${cyan('500 g')}. How many grams do ${cyan('6 coconuts')} weigh?`,
      correct: 3000,  wrongs: [500, 1500, 4000],   unit: 'g',      hint: 'Multiply: 6 × 500 g' },
    { text: `A bag of oranges weighs ${cyan('500 g')}. How many grams do ${cyan('5 bags')} weigh?`,
      correct: 2500,  wrongs: [500, 1000, 3000],   unit: 'g',      hint: 'Multiply: 5 × 500 g' },
    { text: `A large van weighs ${cyan('9 tonnes')}. How many kilograms is that?`,
      correct: 9000,  wrongs: [900, 90000, 90],    unit: 'kg',     hint: '1 tonne = 1000 kg' },
    { text: `A shipment weighs ${cyan('7000 kg')}. How many tonnes is that?`,
      correct: 7,     wrongs: [70, 700, 7000],     unit: 'tonnes', hint: '1000 kg = 1 tonne' },
    { text: `A jar of peanut butter weighs ${cyan('300 g')}. How many grams do ${cyan('4 jars')} weigh?`,
      correct: 1200,  wrongs: [300, 600, 1500],    unit: 'g',      hint: 'Multiply: 4 × 300 g' },
    { text: `A sack of potatoes weighs ${cyan('10 kg')}. How many grams is that?`,
      correct: 10000, wrongs: [1000, 100000, 100], unit: 'g',      hint: '1 kg = 1000 g' },
    { text: `A lorry weighs ${cyan('12000 kg')}. How many tonnes is that?`,
      correct: 12,    wrongs: [120, 1200, 12000],  unit: 'tonnes', hint: '1000 kg = 1 tonne' },
    { text: `A sports car weighs ${cyan('6 tonnes')}. How many kilograms is that?`,
      correct: 6000,  wrongs: [600, 60000, 60],    unit: 'kg',     hint: '1 tonne = 1000 kg' },
  ];
  const s = pick(scenes);
  return makeQ(s.text, s.correct, s.wrongs, s.unit, s.hint, 'weight');
}

// ─── Capacity Question Generator ──────────────────────────────────────────────
// Covers: litres↔ml, cl→ml, plus word problems.
function qCapacity() {
  const t = rand(1, 9);

  if (t <= 3) {                        // litres → ml
    const l = rand(1, 15);
    return makeQ(
      `Convert ${cyan(l + (l === 1 ? ' litre' : ' litres'))} to millilitres.`,
      l * 1000, [l * 100, l * 10, (l + 3) * 1000],
      'ml', '1 litre = 1000 ml', 'capacity'
    );
  }
  if (t <= 5) {                        // ml → litres
    const l = rand(1, 10);
    return makeQ(
      `Convert ${cyan(l * 1000 + ' ml')} to litres.`,
      l, [l * 10, l * 100, l + 4],
      'litres', '1000 ml = 1 litre', 'capacity'
    );
  }
  if (t === 6) {                       // cl → ml
    const cl = rand(1, 20) * 5;
    return makeQ(
      `Convert ${cyan(cl + ' cl')} to millilitres.`,
      cl * 10, [cl, cl * 100, cl * 1000, (cl + 5) * 10],
      'ml', '1 cl = 10 ml', 'capacity'
    );
  }
  if (t === 7) {                       // repeated addition (bottles)
    const bottles = rand(2, 6);
    const mlEach  = pick([200, 250, 330, 500]);
    const correct = bottles * mlEach;
    return makeQ(
      `${cyan(bottles + ' bottles')}, each holding ${cyan(mlEach + ' ml')}. How many ml altogether?`,
      correct, [correct - mlEach, correct + mlEach, mlEach, bottles * (mlEach / 2)],
      'ml', `Multiply: ${bottles} × ${mlEach}`, 'capacity'
    );
  }
  if (t === 8) {                       // mixed units (litres + ml expressed in ml)
    const l  = rand(1, 5);
    const ml = rand(1, 9) * 100;
    return makeQ(
      `What is ${cyan(l + (l === 1 ? ' litre' : ' litres'))} and ${cyan(ml + ' ml')} in millilitres?`,
      l * 1000 + ml, [l * 100 + ml, l * 1000, l * 1000 - ml, l * 10000 + ml],
      'ml', `${l} litre${l > 1 ? 's' : ''} = ${l * 1000} ml, then add ${ml} ml`, 'capacity'
    );
  }
  // t === 9: word problems
  const scenes = [
    { text: `A fish tank holds ${cyan('10 litres')} of water. How many ml is that?`,
      correct: 10000,  wrongs: [1000, 100, 100000],     unit: 'ml',     hint: '1 litre = 1000 ml' },
    { text: `A bottle has ${cyan('2000 ml')} of juice. How many litres is that?`,
      correct: 2,      wrongs: [20, 200, 2000],         unit: 'litres', hint: '1000 ml = 1 litre' },
    { text: `A paddling pool holds ${cyan('80 litres')}. How many ml is that?`,
      correct: 80000,  wrongs: [8000, 800, 800000],     unit: 'ml',     hint: '1 litre = 1000 ml' },
    { text: `A mug holds ${cyan('300 ml')}. How many ml do ${cyan('4 mugs')} hold?`,
      correct: 1200,   wrongs: [300, 600, 1500],        unit: 'ml',     hint: 'Multiply: 4 × 300 ml' },
    { text: `A large bottle holds ${cyan('3000 ml')} of lemonade. How many litres is that?`,
      correct: 3,      wrongs: [30, 300, 3000],         unit: 'litres', hint: '1000 ml = 1 litre' },
    { text: `A watering can holds ${cyan('5 litres')}. How many ml is that?`,
      correct: 5000,   wrongs: [500, 50000, 50],        unit: 'ml',     hint: '1 litre = 1000 ml' },
    { text: `A bath holds ${cyan('150 litres')} of water. How many ml is that?`,
      correct: 150000, wrongs: [15000, 1500, 1500000],  unit: 'ml',     hint: '1 litre = 1000 ml' },
    { text: `A kettle holds ${cyan('2 litres')}. How many millilitres is that?`,
      correct: 2000,   wrongs: [200, 20000, 20],        unit: 'ml',     hint: '1 litre = 1000 ml' },
    { text: `A glass holds ${cyan('250 ml')}. How many ml do ${cyan('4 glasses')} hold?`,
      correct: 1000,   wrongs: [250, 500, 1250],        unit: 'ml',     hint: 'Multiply: 4 × 250 ml' },
    { text: `A bucket holds ${cyan('8 litres')}. How many millilitres is that?`,
      correct: 8000,   wrongs: [800, 80000, 80],        unit: 'ml',     hint: '1 litre = 1000 ml' },
    { text: `A carton holds ${cyan('4000 ml')}. How many litres is that?`,
      correct: 4,      wrongs: [40, 400, 4000],         unit: 'litres', hint: '1000 ml = 1 litre' },
    { text: `A paddling pool holds ${cyan('50 litres')}. How many millilitres is that?`,
      correct: 50000,  wrongs: [5000, 500000, 500],     unit: 'ml',     hint: '1 litre = 1000 ml' },
    { text: `A jug holds ${cyan('1 litre')} of water. How many millilitres is that?`,
      correct: 1000,   wrongs: [100, 10000, 10],        unit: 'ml',     hint: '1 litre = 1000 ml' },
    { text: `A pond holds ${cyan('6000 ml')}. How many litres is that?`,
      correct: 6,      wrongs: [60, 600, 6000],         unit: 'litres', hint: '1000 ml = 1 litre' },
    { text: `A soup bowl holds ${cyan('400 ml')}. How many ml do ${cyan('3 bowls')} hold?`,
      correct: 1200,   wrongs: [400, 800, 1600],        unit: 'ml',     hint: 'Multiply: 3 × 400 ml' },
    { text: `A garden pond holds ${cyan('12 litres')}. How many millilitres is that?`,
      correct: 12000,  wrongs: [1200, 120000, 120],     unit: 'ml',     hint: '1 litre = 1000 ml' },
    { text: `A barrel holds ${cyan('9000 ml')}. How many litres is that?`,
      correct: 9,      wrongs: [90, 900, 9000],         unit: 'litres', hint: '1000 ml = 1 litre' },
    { text: `A can of cola holds ${cyan('330 ml')}. How many ml do ${cyan('3 cans')} hold?`,
      correct: 990,    wrongs: [330, 660, 1320],        unit: 'ml',     hint: 'Multiply: 3 × 330 ml' },
    { text: `A smoothie bottle holds ${cyan('500 ml')}. How many ml do ${cyan('4 bottles')} hold?`,
      correct: 2000,   wrongs: [500, 1000, 2500],       unit: 'ml',     hint: 'Multiply: 4 × 500 ml' },
    { text: `A cooking pot holds ${cyan('7 litres')}. How many millilitres is that?`,
      correct: 7000,   wrongs: [700, 70000, 70],        unit: 'ml',     hint: '1 litre = 1000 ml' },
    { text: `A tank holds ${cyan('15000 ml')}. How many litres is that?`,
      correct: 15,     wrongs: [150, 1500, 15000],      unit: 'litres', hint: '1000 ml = 1 litre' },
    { text: `A coffee cup holds ${cyan('200 ml')}. How many ml do ${cyan('5 cups')} hold?`,
      correct: 1000,   wrongs: [200, 400, 1200],        unit: 'ml',     hint: 'Multiply: 5 × 200 ml' },
    { text: `A water butt holds ${cyan('100 litres')}. How many millilitres is that?`,
      correct: 100000, wrongs: [10000, 1000000, 1000],  unit: 'ml',     hint: '1 litre = 1000 ml' },
    { text: `A thermos holds ${cyan('1000 ml')}. How many litres is that?`,
      correct: 1,      wrongs: [10, 100, 1000],         unit: 'litres', hint: '1000 ml = 1 litre' },
    { text: `A bowl holds ${cyan('600 ml')}. How many ml do ${cyan('2 bowls')} hold?`,
      correct: 1200,   wrongs: [600, 900, 1800],        unit: 'ml',     hint: 'Multiply: 2 × 600 ml' },
    { text: `A rainwater tank holds ${cyan('30 litres')}. How many millilitres is that?`,
      correct: 30000,  wrongs: [3000, 300000, 300],     unit: 'ml',     hint: '1 litre = 1000 ml' },
    { text: `A carton of juice holds ${cyan('7000 ml')}. How many litres is that?`,
      correct: 7,      wrongs: [70, 700, 7000],         unit: 'litres', hint: '1000 ml = 1 litre' },
    { text: `A sports bottle holds ${cyan('750 ml')}. How many ml do ${cyan('2 bottles')} hold?`,
      correct: 1500,   wrongs: [750, 1000, 2000],       unit: 'ml',     hint: 'Multiply: 2 × 750 ml' },
    { text: `A water tower holds ${cyan('40 litres')}. How many millilitres is that?`,
      correct: 40000,  wrongs: [4000, 400000, 400],     unit: 'ml',     hint: '1 litre = 1000 ml' },
    { text: `A soup tin holds ${cyan('400 ml')}. How many ml do ${cyan('5 tins')} hold?`,
      correct: 2000,   wrongs: [400, 1000, 2400],       unit: 'ml',     hint: 'Multiply: 5 × 400 ml' },
    { text: `A milk carton holds ${cyan('2 litres')}. How many millilitres is that?`,
      correct: 2000,   wrongs: [200, 20000, 20],        unit: 'ml',     hint: '1 litre = 1000 ml' },
    { text: `A paddling pool needs ${cyan('25000 ml')} of water. How many litres is that?`,
      correct: 25,     wrongs: [250, 2500, 25000],      unit: 'litres', hint: '1000 ml = 1 litre' },
    { text: `A birdbath holds ${cyan('4 litres')}. How many millilitres is that?`,
      correct: 4000,   wrongs: [400, 40000, 40],        unit: 'ml',     hint: '1 litre = 1000 ml' },
    { text: `A drainpipe holds ${cyan('8000 ml')}. How many litres is that?`,
      correct: 8,      wrongs: [80, 800, 8000],         unit: 'litres', hint: '1000 ml = 1 litre' },
    { text: `A washing machine uses ${cyan('60 litres')}. How many millilitres is that?`,
      correct: 60000,  wrongs: [6000, 600000, 600],     unit: 'ml',     hint: '1 litre = 1000 ml' },
    { text: `A hot water bottle holds ${cyan('2000 ml')}. How many litres is that?`,
      correct: 2,      wrongs: [20, 200, 2000],         unit: 'litres', hint: '1000 ml = 1 litre' },
    { text: `A petrol tank holds ${cyan('45 litres')}. How many millilitres is that?`,
      correct: 45000,  wrongs: [4500, 450000, 450],     unit: 'ml',     hint: '1 litre = 1000 ml' },
    { text: `A saucepan holds ${cyan('3 litres')} of soup. How many millilitres is that?`,
      correct: 3000,   wrongs: [300, 30000, 30],        unit: 'ml',     hint: '1 litre = 1000 ml' },
    { text: `A water bottle holds ${cyan('500 ml')}. How many ml do ${cyan('6 bottles')} hold?`,
      correct: 3000,   wrongs: [500, 1500, 3500],       unit: 'ml',     hint: 'Multiply: 6 × 500 ml' },
    { text: `A fish bowl holds ${cyan('11 litres')}. How many millilitres is that?`,
      correct: 11000,  wrongs: [1100, 110000, 110],     unit: 'ml',     hint: '1 litre = 1000 ml' },
    { text: `A drinks dispenser holds ${cyan('20000 ml')}. How many litres is that?`,
      correct: 20,     wrongs: [200, 2000, 20000],      unit: 'litres', hint: '1000 ml = 1 litre' },
    { text: `A mop bucket holds ${cyan('6 litres')}. How many millilitres is that?`,
      correct: 6000,   wrongs: [600, 60000, 60],        unit: 'ml',     hint: '1 litre = 1000 ml' },
    { text: `A swimming lesson pool holds ${cyan('35000 ml')}. How many litres is that?`,
      correct: 35,     wrongs: [350, 3500, 35000],      unit: 'litres', hint: '1000 ml = 1 litre' },
    { text: `A large cooking pot holds ${cyan('13 litres')}. How many millilitres is that?`,
      correct: 13000,  wrongs: [1300, 130000, 130],     unit: 'ml',     hint: '1 litre = 1000 ml' },
    { text: `A garden watering can holds ${cyan('9 litres')}. How many millilitres is that?`,
      correct: 9000,   wrongs: [900, 90000, 90],        unit: 'ml',     hint: '1 litre = 1000 ml' },
    { text: `A barrel of juice holds ${cyan('25 litres')}. How many millilitres is that?`,
      correct: 25000,  wrongs: [2500, 250000, 250],     unit: 'ml',     hint: '1 litre = 1000 ml' },
    { text: `A punch bowl holds ${cyan('16000 ml')}. How many litres is that?`,
      correct: 16,     wrongs: [160, 1600, 16000],      unit: 'litres', hint: '1000 ml = 1 litre' },
    { text: `A teapot holds ${cyan('900 ml')}. How many ml do ${cyan('2 teapots')} hold?`,
      correct: 1800,   wrongs: [900, 1200, 2700],       unit: 'ml',     hint: 'Multiply: 2 × 900 ml' },
    { text: `A baby bath holds ${cyan('18 litres')}. How many millilitres is that?`,
      correct: 18000,  wrongs: [1800, 180000, 180],     unit: 'ml',     hint: '1 litre = 1000 ml' },
    { text: `A juice carton holds ${cyan('11000 ml')}. How many litres is that?`,
      correct: 11,     wrongs: [110, 1100, 11000],      unit: 'litres', hint: '1000 ml = 1 litre' },
    { text: `A sprinkler uses ${cyan('14 litres')}. How many millilitres is that?`,
      correct: 14000,  wrongs: [1400, 140000, 140],     unit: 'ml',     hint: '1 litre = 1000 ml' },
  ];
  const s = pick(scenes);
  return makeQ(s.text, s.correct, s.wrongs, s.unit, s.hint, 'capacity');
}

// ─── Question Set Builder ─────────────────────────────────────────────────────
function buildSet(category, n = 10) {
  const gens = { length: qLength, weight: qWeight, capacity: qCapacity };
  const gen  = category === 'mixed'
    ? () => pick([qLength, qWeight, qCapacity])()
    : gens[category];
  return Array.from({ length: n }, gen);
}

// ─── UI Helpers ───────────────────────────────────────────────────────────────
const rl  = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = p => new Promise(res => rl.question(p, res));
const clear = () => process.stdout.write('\x1Bc');

function progressBar(done, total, w = 22) {
  const f = Math.round((done / total) * w);
  return cyan('[') + green('='.repeat(f)) + dim('.'.repeat(w - f)) + cyan(']');
}

function header(name, qIdx, total, score) {
  const pct = qIdx > 0 ? dim(` (${Math.round((score / qIdx) * 100)}%)`) : '';
  console.log();
  console.log(blue('╔══════════════════════════════════════════╗'));
  console.log(blue('║') + bold('   KS2 Unit Conversion Quiz               ') + blue('║'));
  console.log(blue('╚══════════════════════════════════════════╝'));
  console.log(`  ${dim('Player:')} ${magenta(name)}   ${dim('Score:')} ${yellow(score + '/' + qIdx)}${pct}`);
  console.log(`  ${progressBar(qIdx, total)}  ${cyan(qIdx + '/' + total)}`);
  console.log();
}

const CAT_ICON = { length: '[Length]', weight: '[Weight]', capacity: '[Capacity]', mixed: '[Mixed]' };

// ─── Run Quiz ─────────────────────────────────────────────────────────────────
async function runQuiz(name, category, total) {
  const qs = buildSet(category, total);
  let score = 0;

  for (let i = 0; i < qs.length; i++) {
    const q = qs[i];
    clear();
    header(name, i, total, score);

    const catLabel = q.category.charAt(0).toUpperCase() + q.category.slice(1);
    console.log(`  ${yellow('Question ' + (i + 1))} ${dim('of ' + total + '  ' + CAT_ICON[q.category])}`);
    console.log();
    console.log(`  ${bold(q.text)}`);
    console.log();
    q.options.forEach(o => console.log(o));
    console.log();

    let raw = '';
    while (!['A', 'B', 'C', 'D'].includes(raw)) {
      raw = (await ask(`  ${bold('Your answer (A/B/C/D):')} `)).trim().toUpperCase();
      if (!['A', 'B', 'C', 'D'].includes(raw))
        console.log(yellow('  Please type A, B, C or D.'));
    }

    if (raw === q.answer) {
      score++;
      console.log('\n' + green('  Correct! Well done, ' + name + '!'));
    } else {
      console.log('\n' + red('  Not quite!'));
      console.log(`  The correct answer was ${green(q.answer + ')')} ${bold(q.correctDisplay)}.`);
      console.log(dim(`  Remember: ${q.hint}`));
    }
    console.log();
    await ask(dim('  Press Enter to continue...'));
  }
  return score;
}

// ─── Results Screen ───────────────────────────────────────────────────────────
function resultsScreen(name, score, total) {
  clear();
  const pct = Math.round((score / total) * 100);
  const [stars, msg] =
    pct === 100 ? ['*** PERFECT!',        "Incredible! A flawless score! You're a unit conversion superstar!"] :
    pct >= 80   ? ['**  EXCELLENT!',       "Brilliant! You really know your units. Keep it up!"]              :
    pct >= 60   ? ['*   GOOD WORK!',       "Well done! A bit more practice and you'll be a pro!"]             :
    pct >= 40   ? ['    KEEP TRYING!',     "Good effort! Review your conversion tables and try again."]        :
                  ['    KEEP PRACTISING!', "Don't give up! You'll get there with more practice."];

  console.log();
  console.log(blue('╔══════════════════════════════════════════╗'));
  console.log(blue('║') + bold('         QUIZ COMPLETE!                   ') + blue('║'));
  console.log(blue('╚══════════════════════════════════════════╝'));
  console.log();
  console.log(`  Great effort, ${magenta(name)}!`);
  console.log();
  console.log(`  Final Score : ${yellow(score + ' / ' + total)}  (${pct}%)`);
  console.log(`  Grade       : ${green(stars)}`);
  console.log();
  console.log(`  ${msg}`);
  console.log();
  console.log(dim('  ── Conversion Facts to Remember ─────────────────────'));
  console.log(dim('  Length  : 1 km = 1000 m  |  1 m = 100 cm  |  1 cm = 10 mm'));
  console.log(dim('  Weight  : 1 kg = 1000 g  |  1 tonne = 1000 kg'));
  console.log(dim('  Capacity: 1 litre = 1000 ml  |  1 cl = 10 ml'));
  console.log(dim('  ──────────────────────────────────────────────────────'));
  console.log();
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  clear();
  console.log();
  console.log(blue('╔══════════════════════════════════════════╗'));
  console.log(blue('║') + bold('   KS2 Unit Conversion Quiz               ') + blue('║'));
  console.log(blue('║') + dim('      Weight  *  Length  *  Capacity      ') + blue('║'));
  console.log(blue('╚══════════════════════════════════════════╝'));
  console.log();

  const name = (await ask(`  ${bold('What is your name?')} `)).trim() || 'Champion';
  console.log(`\n  Hello, ${magenta(name)}! Let's test your unit conversion skills!\n`);

  let playing = true;
  while (playing) {
    console.log('  Choose a category:\n');
    console.log(`  ${bold('1)')} Length   ${dim('(km, m, cm, mm)')}`);
    console.log(`  ${bold('2)')} Weight   ${dim('(kg, g, tonnes)')}`);
    console.log(`  ${bold('3)')} Capacity ${dim('(litres, ml, cl)')}`);
    console.log(`  ${bold('4)')} Mixed    ${dim('(all categories)')}`);
    console.log();

    let category = '';
    while (!category) {
      const ch = (await ask(`  ${bold('Enter 1, 2, 3 or 4:')} `)).trim();
      category = { '1': 'length', '2': 'weight', '3': 'capacity', '4': 'mixed' }[ch] || '';
      if (!category) console.log(yellow('  Please enter 1, 2, 3 or 4.'));
    }

    console.log(`\n  Great! Starting the ${cyan(category)} quiz.`);
    console.log(`  Answer each question by typing ${bold('A')}, ${bold('B')}, ${bold('C')} or ${bold('D')}.\n`);
    await ask(dim('  Press Enter when you\'re ready...'));

    const score = await runQuiz(name, category, 10);
    resultsScreen(name, score, 10);

    const again = (await ask(`  ${bold('Play again? (Y/N):')} `)).trim().toUpperCase();
    playing = again === 'Y';
    if (playing) {
      console.log(`\n  Great, let's go again, ${magenta(name)}!\n`);
    }
  }

  console.log(`\n  Thanks for playing, ${magenta(name)}! Keep up the great maths work!\n`);
  rl.close();
}

main().catch(err => {
  console.error('Error:', err.message);
  rl.close();
  process.exit(1);
});
