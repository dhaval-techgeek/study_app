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

// ─── Sound Effects ────────────────────────────────────────────────────────────
let _audioCtx = null;
function getAudioCtx() {
  if (!_audioCtx) _audioCtx = new (window.AudioContext || window['webkitAudioContext'])();
  return _audioCtx;
}

function playSound(type) {
  try {
    const ctx = getAudioCtx();
    if (type === 'correct') {
      // Two ascending notes: a cheerful "ding-ding"
      [[523.25, 0, 0.12], [659.25, 0.13, 0.2]].forEach(([freq, start, dur]) => {
        const osc  = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + start);
        gain.gain.setValueAtTime(0.35, ctx.currentTime + start);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + dur);
        osc.start(ctx.currentTime + start);
        osc.stop(ctx.currentTime + start + dur);
      });
    } else {
      // Low descending buzz for wrong
      [[220, 0, 0.08], [180, 0.08, 0.18]].forEach(([freq, start, dur]) => {
        const osc  = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + start);
        gain.gain.setValueAtTime(0.2, ctx.currentTime + start);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + dur);
        osc.start(ctx.currentTime + start);
        osc.stop(ctx.currentTime + start + dur);
      });
    }
  } catch (_) { /* AudioContext not available — silently skip */ }
}

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
      correct: 5000,  wrongs: [500, 50000, 50],       unit: 'm',  hint: '1 km = 1,000 m' },
    { text: `A ruler is ${hl('30 cm')} long. How many millimetres is that?`,
      correct: 300,   wrongs: [30, 3000, 3],           unit: 'mm', hint: '1 cm = 10 mm' },
    { text: `A football pitch is ${hl('100 m')} long. How many centimetres is that?`,
      correct: 10000, wrongs: [1000, 100, 100000],     unit: 'cm', hint: '1 m = 100 cm' },
    { text: `A road is ${hl('12 km')} long. How many metres is that?`,
      correct: 12000, wrongs: [1200, 120, 120000],     unit: 'm',  hint: '1 km = 1,000 m' },
    { text: `A worm is ${hl('8 cm')} long. How many mm is that?`,
      correct: 80,    wrongs: [8, 800, 8000],           unit: 'mm', hint: '1 cm = 10 mm' },
    { text: `A swimming pool is ${hl('25 m')} long. How many centimetres is that?`,
      correct: 2500,  wrongs: [250, 25000, 25],         unit: 'cm', hint: '1 m = 100 cm' },
    { text: `A bookshelf is ${hl('200 cm')} wide. How many metres is that?`,
      correct: 2,     wrongs: [20, 200, 20],            unit: 'm',  hint: '100 cm = 1 m' },
    { text: `A marathon is ${hl('42 km')} long. How many metres is that?`,
      correct: 42000, wrongs: [4200, 420, 420000],      unit: 'm',  hint: '1 km = 1,000 m' },
    { text: `A garden fence is ${hl('8 m')} long. How many centimetres is that?`,
      correct: 800,   wrongs: [80, 8000, 8],            unit: 'cm', hint: '1 m = 100 cm' },
    { text: `A pencil is ${hl('18 cm')} long. How many millimetres is that?`,
      correct: 180,   wrongs: [18, 1800, 18],           unit: 'mm', hint: '1 cm = 10 mm' },
    { text: `A bridge is ${hl('3 km')} long. How many metres is that?`,
      correct: 3000,  wrongs: [300, 30000, 30],         unit: 'm',  hint: '1 km = 1,000 m' },
    { text: `A classroom is ${hl('9 m')} wide. How many centimetres is that?`,
      correct: 900,   wrongs: [90, 9000, 9],            unit: 'cm', hint: '1 m = 100 cm' },
    { text: `A butterfly has a wingspan of ${hl('6 cm')}. How many millimetres is that?`,
      correct: 60,    wrongs: [6, 600, 6000],           unit: 'mm', hint: '1 cm = 10 mm' },
    { text: `A highway is ${hl('15 km')} long. How many metres is that?`,
      correct: 15000, wrongs: [1500, 150, 150000],      unit: 'm',  hint: '1 km = 1,000 m' },
    { text: `A door is ${hl('2 m')} tall. How many centimetres is that?`,
      correct: 200,   wrongs: [20, 2000, 2],            unit: 'cm', hint: '1 m = 100 cm' },
    { text: `A caterpillar is ${hl('4 cm')} long. How many millimetres is that?`,
      correct: 40,    wrongs: [4, 400, 4000],           unit: 'mm', hint: '1 cm = 10 mm' },
    { text: `A train track is ${hl('8 km')} long. How many metres is that?`,
      correct: 8000,  wrongs: [800, 80000, 80],         unit: 'm',  hint: '1 km = 1,000 m' },
    { text: `A corridor is ${hl('12 m')} long. How many centimetres is that?`,
      correct: 1200,  wrongs: [120, 12000, 12],         unit: 'cm', hint: '1 m = 100 cm' },
    { text: `A wristband is ${hl('20 cm')} long. How many millimetres is that?`,
      correct: 200,   wrongs: [20, 2000, 20000],        unit: 'mm', hint: '1 cm = 10 mm' },
    { text: `A cycling route is ${hl('6 km')} long. How many metres is that?`,
      correct: 6000,  wrongs: [600, 60000, 60],         unit: 'm',  hint: '1 km = 1,000 m' },
    { text: `A curtain rail is ${hl('300 cm')} long. How many metres is that?`,
      correct: 3,     wrongs: [30, 300, 30],            unit: 'm',  hint: '100 cm = 1 m' },
    { text: `A finger is ${hl('7 cm')} long. How many millimetres is that?`,
      correct: 70,    wrongs: [7, 700, 7000],           unit: 'mm', hint: '1 cm = 10 mm' },
    { text: `A canal is ${hl('10 km')} long. How many metres is that?`,
      correct: 10000, wrongs: [1000, 100000, 100],      unit: 'm',  hint: '1 km = 1,000 m' },
    { text: `A rope is ${hl('500 cm')} long. How many metres is that?`,
      correct: 5,     wrongs: [50, 500, 50],            unit: 'm',  hint: '100 cm = 1 m' },
    { text: `A pencil case is ${hl('22 cm')} long. How many millimetres is that?`,
      correct: 220,   wrongs: [22, 2200, 2200],         unit: 'mm', hint: '1 cm = 10 mm' },
    { text: `A coast road is ${hl('18 km')} long. How many metres is that?`,
      correct: 18000, wrongs: [1800, 180, 180000],      unit: 'm',  hint: '1 km = 1,000 m' },
    { text: `A plank is ${hl('400 cm')} long. How many metres is that?`,
      correct: 4,     wrongs: [40, 400, 40],            unit: 'm',  hint: '100 cm = 1 m' },
    { text: `A ribbon is ${hl('25 cm')} long. How many millimetres is that?`,
      correct: 250,   wrongs: [25, 2500, 2500],         unit: 'mm', hint: '1 cm = 10 mm' },
    { text: `A motorway is ${hl('25 km')} long. How many metres is that?`,
      correct: 25000, wrongs: [2500, 250, 250000],      unit: 'm',  hint: '1 km = 1,000 m' },
    { text: `A wardrobe is ${hl('200 cm')} tall. How many metres is that?`,
      correct: 2,     wrongs: [20, 2000, 200],          unit: 'm',  hint: '100 cm = 1 m' },
    { text: `A straw is ${hl('19 cm')} long. How many millimetres is that?`,
      correct: 190,   wrongs: [19, 1900, 1900],         unit: 'mm', hint: '1 cm = 10 mm' },
    { text: `A tunnel is ${hl('3,000 m')} long. How many kilometres is that?`,
      correct: 3,     wrongs: [30, 300, 3000],          unit: 'km', hint: '1,000 m = 1 km' },
    { text: `A pipe is ${hl('600 cm')} long. How many metres is that?`,
      correct: 6,     wrongs: [60, 600, 60],            unit: 'm',  hint: '100 cm = 1 m' },
    { text: `A branch is ${hl('35 cm')} long. How many millimetres is that?`,
      correct: 350,   wrongs: [35, 3500, 3500],         unit: 'mm', hint: '1 cm = 10 mm' },
    { text: `A canal is ${hl('4,000 m')} long. How many kilometres is that?`,
      correct: 4,     wrongs: [40, 400, 4000],          unit: 'km', hint: '1,000 m = 1 km' },
    { text: `A driveway is ${hl('900 cm')} long. How many metres is that?`,
      correct: 9,     wrongs: [90, 900, 90],            unit: 'm',  hint: '100 cm = 1 m' },
    { text: `A leaf is ${hl('12 cm')} long. How many millimetres is that?`,
      correct: 120,   wrongs: [12, 1200, 1200],         unit: 'mm', hint: '1 cm = 10 mm' },
    { text: `A mountain path is ${hl('2,000 m')} long. How many kilometres is that?`,
      correct: 2,     wrongs: [20, 200, 2000],          unit: 'km', hint: '1,000 m = 1 km' },
    { text: `A fence is ${hl('700 cm')} long. How many metres is that?`,
      correct: 7,     wrongs: [70, 700, 70],            unit: 'm',  hint: '100 cm = 1 m' },
    { text: `An earthworm is ${hl('9 cm')} long. How many millimetres is that?`,
      correct: 90,    wrongs: [9, 900, 9000],           unit: 'mm', hint: '1 cm = 10 mm' },
    { text: `A river is ${hl('6,000 m')} long. How many kilometres is that?`,
      correct: 6,     wrongs: [60, 600, 6000],          unit: 'km', hint: '1,000 m = 1 km' },
    { text: `A nail is ${hl('5 cm')} long. How many millimetres is that?`,
      correct: 50,    wrongs: [5, 500, 5000],           unit: 'mm', hint: '1 cm = 10 mm' },
    { text: `A runway is ${hl('2 km')} long. How many metres is that?`,
      correct: 2000,  wrongs: [200, 20000, 20],         unit: 'm',  hint: '1 km = 1,000 m' },
    { text: `A garden path is ${hl('4 m')} long. How many centimetres is that?`,
      correct: 400,   wrongs: [40, 4000, 4],            unit: 'cm', hint: '1 m = 100 cm' },
    { text: `A snake is ${hl('15 cm')} long. How many millimetres is that?`,
      correct: 150,   wrongs: [15, 1500, 1500],         unit: 'mm', hint: '1 cm = 10 mm' },
    { text: `A hiking trail is ${hl('7 km')} long. How many metres is that?`,
      correct: 7000,  wrongs: [700, 70000, 70],         unit: 'm',  hint: '1 km = 1,000 m' },
    { text: `A table is ${hl('3 m')} long. How many centimetres is that?`,
      correct: 300,   wrongs: [30, 3000, 3],            unit: 'cm', hint: '1 m = 100 cm' },
    { text: `A hair clip is ${hl('3 cm')} long. How many millimetres is that?`,
      correct: 30,    wrongs: [3, 300, 3000],           unit: 'mm', hint: '1 cm = 10 mm' },
    { text: `A sports track is ${hl('400 m')} long. How many centimetres is that?`,
      correct: 40000, wrongs: [4000, 400000, 400],      unit: 'cm', hint: '1 m = 100 cm' },
    { text: `A city bypass is ${hl('9 km')} long. How many metres is that?`,
      correct: 9000,  wrongs: [900, 90000, 90],         unit: 'm',  hint: '1 km = 1,000 m' },
    { text: `A bookworm chews ${hl('11 cm')} through a book. How many mm is that?`,
      correct: 110,   wrongs: [11, 1100, 1100],         unit: 'mm', hint: '1 cm = 10 mm' },
    { text: `A park trail is ${hl('5,000 m')} long. How many kilometres is that?`,
      correct: 5,     wrongs: [50, 500, 5000],          unit: 'km', hint: '1,000 m = 1 km' },
    { text: `A window frame is ${hl('100 cm')} wide. How many metres is that?`,
      correct: 1,     wrongs: [10, 100, 1000],          unit: 'm',  hint: '100 cm = 1 m' },
    { text: `A spider is ${hl('2 cm')} long. How many millimetres is that?`,
      correct: 20,    wrongs: [2, 200, 2000],           unit: 'mm', hint: '1 cm = 10 mm' },
    { text: `A school field is ${hl('11 km')} from town. How many metres is that?`,
      correct: 11000, wrongs: [1100, 110, 110000],      unit: 'm',  hint: '1 km = 1,000 m' },
  ];
  const s = pick(scenes);
  return makeQ(s.text, s.correct, s.wrongs, s.unit, s.hint, 'length');
}

// ─── Weight Questions ─────────────────────────────────────────────────────────
function qWeight(difficulty = 'medium') {
  if (difficulty === 'easy') return qWeightEasy();
  if (difficulty === 'hard') return qWeightHard();
  const t = rand(1, 11);

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

  if (t === 10) {                                     // g → mg
    const g = rand(1, 10);
    return makeQ(
      `Convert ${hl(g + (g === 1 ? ' gram' : ' grams'))} to milligrams.`,
      g * 1000, [g * 100, g * 10, (g + 3) * 1000, g * 10000],
      'mg', '1 g = 1,000 mg', 'weight'
    );
  }
  if (t === 11) {                                     // mg → g
    const g = rand(1, 10);
    return makeQ(
      `Convert ${hl(fmtNum(g * 1000) + ' mg')} to grams.`,
      g, [g * 10, g * 100, g + 3, g + 5],
      'g', '1,000 mg = 1 g', 'weight'
    );
  }

  // t === 9: word problems
  const scenes = [
    { text: `A bag of potatoes weighs ${hl('3 kg')}. How many grams is that?`,
      correct: 3000,  wrongs: [300, 30000, 30],    unit: 'g',      hint: '1 kg = 1,000 g' },
    { text: `A whale weighs ${hl('5 tonnes')}. How many kg is that?`,
      correct: 5000,  wrongs: [500, 50000, 50],    unit: 'kg',     hint: '1 tonne = 1,000 kg' },
    { text: `A parcel weighs ${hl('2,000 g')}. How many kilograms is that?`,
      correct: 2,     wrongs: [20, 200, 2000],     unit: 'kg',     hint: '1,000 g = 1 kg' },
    { text: `A baby elephant weighs ${hl('4,000 kg')}. How many tonnes is that?`,
      correct: 4,     wrongs: [40, 400, 4000],     unit: 'tonnes', hint: '1,000 kg = 1 tonne' },
    { text: `A loaf of bread weighs ${hl('800 g')}. How many grams do ${hl('3 loaves')} weigh?`,
      correct: 2400,  wrongs: [800, 1600, 3200],   unit: 'g',      hint: 'Multiply: 3 × 800 g' },
    { text: `A truck can carry ${hl('7 tonnes')}. How many kilograms is that?`,
      correct: 7000,  wrongs: [700, 70000, 70],    unit: 'kg',     hint: '1 tonne = 1,000 kg' },
    { text: `A dictionary weighs ${hl('1,500 g')}. How many grams in ${hl('2 dictionaries')}?`,
      correct: 3000,  wrongs: [1500, 4500, 6000],  unit: 'g',      hint: 'Multiply: 2 × 1,500 g' },
    { text: `A vitamin tablet contains ${hl('5 g')} of powder. How many milligrams?`,
      correct: 5000,  wrongs: [500, 50000, 50],    unit: 'mg',     hint: '1 g = 1,000 mg' },
    { text: `A medicine dose is ${hl('4,000 mg')}. How many grams is that?`,
      correct: 4,     wrongs: [40, 400, 4000],     unit: 'g',      hint: '1,000 mg = 1 g' },
    { text: `A spice jar holds ${hl('6 g')} of pepper. How many mg is that?`,
      correct: 6000,  wrongs: [600, 60000, 60],    unit: 'mg',     hint: '1 g = 1,000 mg' },
    { text: `A bag of sugar weighs ${hl('2 kg')}. How many grams is that?`,
      correct: 2000,  wrongs: [200, 20000, 20],    unit: 'g',      hint: '1 kg = 1,000 g' },
    { text: `A cat weighs ${hl('4 kg')}. How many grams is that?`,
      correct: 4000,  wrongs: [400, 40000, 40],    unit: 'g',      hint: '1 kg = 1,000 g' },
    { text: `A box of apples weighs ${hl('5 kg')}. How many grams is that?`,
      correct: 5000,  wrongs: [500, 50000, 50],    unit: 'g',      hint: '1 kg = 1,000 g' },
    { text: `A package weighs ${hl('3,000 g')}. How many kilograms is that?`,
      correct: 3,     wrongs: [30, 300, 3000],     unit: 'kg',     hint: '1,000 g = 1 kg' },
    { text: `A suitcase weighs ${hl('8,000 g')}. How many kilograms is that?`,
      correct: 8,     wrongs: [80, 800, 8000],     unit: 'kg',     hint: '1,000 g = 1 kg' },
    { text: `A ship weighs ${hl('10 tonnes')}. How many kilograms is that?`,
      correct: 10000, wrongs: [1000, 100000, 100], unit: 'kg',     hint: '1 tonne = 1,000 kg' },
    { text: `A heavy rock weighs ${hl('6,000 kg')}. How many tonnes is that?`,
      correct: 6,     wrongs: [60, 600, 6000],     unit: 'tonnes', hint: '1,000 kg = 1 tonne' },
    { text: `A bag of rice weighs ${hl('1 kg')}. How many grams is that?`,
      correct: 1000,  wrongs: [100, 10000, 10],    unit: 'g',      hint: '1 kg = 1,000 g' },
    { text: `A bunch of grapes weighs ${hl('500 g')}. How many grams do ${hl('4 bunches')} weigh?`,
      correct: 2000,  wrongs: [500, 1000, 2500],   unit: 'g',      hint: 'Multiply: 4 × 500 g' },
    { text: `A brick weighs ${hl('3 kg')}. How many grams is that?`,
      correct: 3000,  wrongs: [300, 30000, 30],    unit: 'g',      hint: '1 kg = 1,000 g' },
    { text: `A pumpkin weighs ${hl('6 kg')}. How many grams is that?`,
      correct: 6000,  wrongs: [600, 60000, 60],    unit: 'g',      hint: '1 kg = 1,000 g' },
    { text: `A jar of jam weighs ${hl('400 g')}. How many grams do ${hl('3 jars')} weigh?`,
      correct: 1200,  wrongs: [400, 800, 1600],    unit: 'g',      hint: 'Multiply: 3 × 400 g' },
    { text: `A bicycle weighs ${hl('9 kg')}. How many grams is that?`,
      correct: 9000,  wrongs: [900, 90000, 90],    unit: 'g',      hint: '1 kg = 1,000 g' },
    { text: `A bag of flour weighs ${hl('5,000 g')}. How many kilograms is that?`,
      correct: 5,     wrongs: [50, 500, 5000],     unit: 'kg',     hint: '1,000 g = 1 kg' },
    { text: `A train weighs ${hl('3 tonnes')}. How many kilograms is that?`,
      correct: 3000,  wrongs: [300, 30000, 30],    unit: 'kg',     hint: '1 tonne = 1,000 kg' },
    { text: `A statue weighs ${hl('2,000 kg')}. How many tonnes is that?`,
      correct: 2,     wrongs: [20, 200, 2000],     unit: 'tonnes', hint: '1,000 kg = 1 tonne' },
    { text: `A chicken weighs ${hl('2 kg')}. How many grams is that?`,
      correct: 2000,  wrongs: [200, 20000, 20],    unit: 'g',      hint: '1 kg = 1,000 g' },
    { text: `A melon weighs ${hl('1,000 g')}. How many kilograms is that?`,
      correct: 1,     wrongs: [10, 100, 1000],     unit: 'kg',     hint: '1,000 g = 1 kg' },
    { text: `A dumbbell weighs ${hl('5 kg')}. How many grams is that?`,
      correct: 5000,  wrongs: [500, 50000, 50],    unit: 'g',      hint: '1 kg = 1,000 g' },
    { text: `A tractor weighs ${hl('4 tonnes')}. How many kilograms is that?`,
      correct: 4000,  wrongs: [400, 40000, 40],    unit: 'kg',     hint: '1 tonne = 1,000 kg' },
    { text: `A large rock weighs ${hl('3,000 kg')}. How many tonnes is that?`,
      correct: 3,     wrongs: [30, 300, 3000],     unit: 'tonnes', hint: '1,000 kg = 1 tonne' },
    { text: `A strawberry punnet weighs ${hl('400 g')}. How many grams do ${hl('5 punnets')} weigh?`,
      correct: 2000,  wrongs: [400, 1000, 2400],   unit: 'g',      hint: 'Multiply: 5 × 400 g' },
    { text: `A vitamin pill contains ${hl('3 g')} of calcium. How many milligrams is that?`,
      correct: 3000,  wrongs: [300, 30000, 30],    unit: 'mg',     hint: '1 g = 1,000 mg' },
    { text: `A tablet has ${hl('2,000 mg')} of vitamin C. How many grams is that?`,
      correct: 2,     wrongs: [20, 200, 2000],     unit: 'g',      hint: '1,000 mg = 1 g' },
    { text: `A dog weighs ${hl('8 kg')}. How many grams is that?`,
      correct: 8000,  wrongs: [800, 80000, 80],    unit: 'g',      hint: '1 kg = 1,000 g' },
    { text: `A bag of carrots weighs ${hl('6,000 g')}. How many kilograms is that?`,
      correct: 6,     wrongs: [60, 600, 6000],     unit: 'kg',     hint: '1,000 g = 1 kg' },
    { text: `A motorbike weighs ${hl('2 tonnes')}. How many kilograms is that?`,
      correct: 2000,  wrongs: [200, 20000, 20],    unit: 'kg',     hint: '1 tonne = 1,000 kg' },
    { text: `A pile of books weighs ${hl('4,000 kg')}. How many tonnes is that?`,
      correct: 4,     wrongs: [40, 400, 4000],     unit: 'tonnes', hint: '1,000 kg = 1 tonne' },
    { text: `A carton of milk weighs ${hl('1 kg')}. How many grams is that?`,
      correct: 1000,  wrongs: [100, 10000, 10],    unit: 'g',      hint: '1 kg = 1,000 g' },
    { text: `A box of chocolates weighs ${hl('600 g')}. How many grams do ${hl('4 boxes')} weigh?`,
      correct: 2400,  wrongs: [600, 1200, 3000],   unit: 'g',      hint: 'Multiply: 4 × 600 g' },
    { text: `A watermelon weighs ${hl('7 kg')}. How many grams is that?`,
      correct: 7000,  wrongs: [700, 70000, 70],    unit: 'g',      hint: '1 kg = 1,000 g' },
    { text: `A parcel weighs ${hl('9,000 g')}. How many kilograms is that?`,
      correct: 9,     wrongs: [90, 900, 9000],     unit: 'kg',     hint: '1,000 g = 1 kg' },
    { text: `A bus weighs ${hl('8 tonnes')}. How many kilograms is that?`,
      correct: 8000,  wrongs: [800, 80000, 80],    unit: 'kg',     hint: '1 tonne = 1,000 kg' },
    { text: `A yacht weighs ${hl('5,000 kg')}. How many tonnes is that?`,
      correct: 5,     wrongs: [50, 500, 5000],     unit: 'tonnes', hint: '1,000 kg = 1 tonne' },
    { text: `A tablet contains ${hl('8 g')} of powder. How many milligrams is that?`,
      correct: 8000,  wrongs: [800, 80000, 80],    unit: 'mg',     hint: '1 g = 1,000 mg' },
    { text: `A medicine sachet contains ${hl('7,000 mg')}. How many grams is that?`,
      correct: 7,     wrongs: [70, 700, 7000],     unit: 'g',      hint: '1,000 mg = 1 g' },
    { text: `A bag of oranges weighs ${hl('500 g')}. How many grams do ${hl('5 bags')} weigh?`,
      correct: 2500,  wrongs: [500, 1000, 3000],   unit: 'g',      hint: 'Multiply: 5 × 500 g' },
    { text: `A coconut weighs ${hl('500 g')}. How many grams do ${hl('6 coconuts')} weigh?`,
      correct: 3000,  wrongs: [500, 1500, 4000],   unit: 'g',      hint: 'Multiply: 6 × 500 g' },
    { text: `A box of cereal weighs ${hl('750 g')}. How many grams do ${hl('2 boxes')} weigh?`,
      correct: 1500,  wrongs: [750, 1000, 2000],   unit: 'g',      hint: 'Multiply: 2 × 750 g' },
    { text: `A tin of beans weighs ${hl('400 g')}. How many grams do ${hl('5 tins')} weigh?`,
      correct: 2000,  wrongs: [400, 1000, 2400],   unit: 'g',      hint: 'Multiply: 5 × 400 g' },
    { text: `A large van weighs ${hl('9 tonnes')}. How many kilograms is that?`,
      correct: 9000,  wrongs: [900, 90000, 90],    unit: 'kg',     hint: '1 tonne = 1,000 kg' },
    { text: `A shipment weighs ${hl('7,000 kg')}. How many tonnes is that?`,
      correct: 7,     wrongs: [70, 700, 7000],     unit: 'tonnes', hint: '1,000 kg = 1 tonne' },
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
      correct: 10000,  wrongs: [1000, 100, 100000],     unit: 'ml',     hint: '1 litre = 1,000 ml' },
    { text: `A bottle has ${hl('2,000 ml')} of juice. How many litres is that?`,
      correct: 2,      wrongs: [20, 200, 2000],         unit: 'litres', hint: '1,000 ml = 1 litre' },
    { text: `A paddling pool holds ${hl('80 litres')}. How many ml is that?`,
      correct: 80000,  wrongs: [8000, 800, 800000],     unit: 'ml',     hint: '1 litre = 1,000 ml' },
    { text: `A mug holds ${hl('300 ml')}. How many ml do ${hl('4 mugs')} hold?`,
      correct: 1200,   wrongs: [300, 600, 1500],        unit: 'ml',     hint: 'Multiply: 4 × 300 ml' },
    { text: `A large bottle holds ${hl('3,000 ml')} of lemonade. How many litres is that?`,
      correct: 3,      wrongs: [30, 300, 3000],         unit: 'litres', hint: '1,000 ml = 1 litre' },
    { text: `A watering can holds ${hl('5 litres')}. How many ml is that?`,
      correct: 5000,   wrongs: [500, 50000, 50],        unit: 'ml',     hint: '1 litre = 1,000 ml' },
    { text: `A bath holds ${hl('150 litres')} of water. How many ml is that?`,
      correct: 150000, wrongs: [15000, 1500, 1500000],  unit: 'ml',     hint: '1 litre = 1,000 ml' },
    { text: `A kettle holds ${hl('2 litres')}. How many millilitres is that?`,
      correct: 2000,   wrongs: [200, 20000, 20],        unit: 'ml',     hint: '1 litre = 1,000 ml' },
    { text: `A glass holds ${hl('250 ml')}. How many ml do ${hl('4 glasses')} hold?`,
      correct: 1000,   wrongs: [250, 500, 1250],        unit: 'ml',     hint: 'Multiply: 4 × 250 ml' },
    { text: `A bucket holds ${hl('8 litres')}. How many millilitres is that?`,
      correct: 8000,   wrongs: [800, 80000, 80],        unit: 'ml',     hint: '1 litre = 1,000 ml' },
    { text: `A carton holds ${hl('4,000 ml')}. How many litres is that?`,
      correct: 4,      wrongs: [40, 400, 4000],         unit: 'litres', hint: '1,000 ml = 1 litre' },
    { text: `A paddling pool holds ${hl('50 litres')}. How many millilitres is that?`,
      correct: 50000,  wrongs: [5000, 500000, 500],     unit: 'ml',     hint: '1 litre = 1,000 ml' },
    { text: `A jug holds ${hl('1 litre')} of water. How many millilitres is that?`,
      correct: 1000,   wrongs: [100, 10000, 10],        unit: 'ml',     hint: '1 litre = 1,000 ml' },
    { text: `A pond holds ${hl('6,000 ml')}. How many litres is that?`,
      correct: 6,      wrongs: [60, 600, 6000],         unit: 'litres', hint: '1,000 ml = 1 litre' },
    { text: `A soup bowl holds ${hl('400 ml')}. How many ml do ${hl('3 bowls')} hold?`,
      correct: 1200,   wrongs: [400, 800, 1600],        unit: 'ml',     hint: 'Multiply: 3 × 400 ml' },
    { text: `A garden pond holds ${hl('12 litres')}. How many millilitres is that?`,
      correct: 12000,  wrongs: [1200, 120000, 120],     unit: 'ml',     hint: '1 litre = 1,000 ml' },
    { text: `A barrel holds ${hl('9,000 ml')}. How many litres is that?`,
      correct: 9,      wrongs: [90, 900, 9000],         unit: 'litres', hint: '1,000 ml = 1 litre' },
    { text: `A can of cola holds ${hl('330 ml')}. How many ml do ${hl('3 cans')} hold?`,
      correct: 990,    wrongs: [330, 660, 1320],        unit: 'ml',     hint: 'Multiply: 3 × 330 ml' },
    { text: `A smoothie bottle holds ${hl('500 ml')}. How many ml do ${hl('4 bottles')} hold?`,
      correct: 2000,   wrongs: [500, 1000, 2500],       unit: 'ml',     hint: 'Multiply: 4 × 500 ml' },
    { text: `A cooking pot holds ${hl('7 litres')}. How many millilitres is that?`,
      correct: 7000,   wrongs: [700, 70000, 70],        unit: 'ml',     hint: '1 litre = 1,000 ml' },
    { text: `A tank holds ${hl('15,000 ml')}. How many litres is that?`,
      correct: 15,     wrongs: [150, 1500, 15000],      unit: 'litres', hint: '1,000 ml = 1 litre' },
    { text: `A coffee cup holds ${hl('200 ml')}. How many ml do ${hl('5 cups')} hold?`,
      correct: 1000,   wrongs: [200, 400, 1200],        unit: 'ml',     hint: 'Multiply: 5 × 200 ml' },
    { text: `A water butt holds ${hl('100 litres')}. How many millilitres is that?`,
      correct: 100000, wrongs: [10000, 1000000, 1000],  unit: 'ml',     hint: '1 litre = 1,000 ml' },
    { text: `A thermos holds ${hl('1,000 ml')}. How many litres is that?`,
      correct: 1,      wrongs: [10, 100, 1000],         unit: 'litres', hint: '1,000 ml = 1 litre' },
    { text: `A bowl holds ${hl('600 ml')}. How many ml do ${hl('2 bowls')} hold?`,
      correct: 1200,   wrongs: [600, 900, 1800],        unit: 'ml',     hint: 'Multiply: 2 × 600 ml' },
    { text: `A rainwater tank holds ${hl('30 litres')}. How many millilitres is that?`,
      correct: 30000,  wrongs: [3000, 300000, 300],     unit: 'ml',     hint: '1 litre = 1,000 ml' },
    { text: `A carton of juice holds ${hl('7,000 ml')}. How many litres is that?`,
      correct: 7,      wrongs: [70, 700, 7000],         unit: 'litres', hint: '1,000 ml = 1 litre' },
    { text: `A sports bottle holds ${hl('750 ml')}. How many ml do ${hl('2 bottles')} hold?`,
      correct: 1500,   wrongs: [750, 1000, 2000],       unit: 'ml',     hint: 'Multiply: 2 × 750 ml' },
    { text: `A water tower holds ${hl('40 litres')}. How many millilitres is that?`,
      correct: 40000,  wrongs: [4000, 400000, 400],     unit: 'ml',     hint: '1 litre = 1,000 ml' },
    { text: `A soup tin holds ${hl('400 ml')}. How many ml do ${hl('5 tins')} hold?`,
      correct: 2000,   wrongs: [400, 1000, 2400],       unit: 'ml',     hint: 'Multiply: 5 × 400 ml' },
    { text: `A milk carton holds ${hl('2 litres')}. How many millilitres is that?`,
      correct: 2000,   wrongs: [200, 20000, 20],        unit: 'ml',     hint: '1 litre = 1,000 ml' },
    { text: `A paddling pool needs ${hl('25,000 ml')} of water. How many litres is that?`,
      correct: 25,     wrongs: [250, 2500, 25000],      unit: 'litres', hint: '1,000 ml = 1 litre' },
    { text: `A birdbath holds ${hl('4 litres')}. How many millilitres is that?`,
      correct: 4000,   wrongs: [400, 40000, 40],        unit: 'ml',     hint: '1 litre = 1,000 ml' },
    { text: `A drainpipe holds ${hl('8,000 ml')}. How many litres is that?`,
      correct: 8,      wrongs: [80, 800, 8000],         unit: 'litres', hint: '1,000 ml = 1 litre' },
    { text: `A washing machine uses ${hl('60 litres')}. How many millilitres is that?`,
      correct: 60000,  wrongs: [6000, 600000, 600],     unit: 'ml',     hint: '1 litre = 1,000 ml' },
    { text: `A hot water bottle holds ${hl('2,000 ml')}. How many litres is that?`,
      correct: 2,      wrongs: [20, 200, 2000],         unit: 'litres', hint: '1,000 ml = 1 litre' },
    { text: `A petrol tank holds ${hl('45 litres')}. How many millilitres is that?`,
      correct: 45000,  wrongs: [4500, 450000, 450],     unit: 'ml',     hint: '1 litre = 1,000 ml' },
    { text: `A saucepan holds ${hl('3 litres')} of soup. How many millilitres is that?`,
      correct: 3000,   wrongs: [300, 30000, 30],        unit: 'ml',     hint: '1 litre = 1,000 ml' },
    { text: `A water bottle holds ${hl('500 ml')}. How many ml do ${hl('6 bottles')} hold?`,
      correct: 3000,   wrongs: [500, 1500, 3500],       unit: 'ml',     hint: 'Multiply: 6 × 500 ml' },
    { text: `A fish bowl holds ${hl('11 litres')}. How many millilitres is that?`,
      correct: 11000,  wrongs: [1100, 110000, 110],     unit: 'ml',     hint: '1 litre = 1,000 ml' },
    { text: `A drinks dispenser holds ${hl('20,000 ml')}. How many litres is that?`,
      correct: 20,     wrongs: [200, 2000, 20000],      unit: 'litres', hint: '1,000 ml = 1 litre' },
    { text: `A mop bucket holds ${hl('6 litres')}. How many millilitres is that?`,
      correct: 6000,   wrongs: [600, 60000, 60],        unit: 'ml',     hint: '1 litre = 1,000 ml' },
    { text: `A swimming lesson pool holds ${hl('35,000 ml')}. How many litres is that?`,
      correct: 35,     wrongs: [350, 3500, 35000],      unit: 'litres', hint: '1,000 ml = 1 litre' },
    { text: `A large cooking pot holds ${hl('13 litres')}. How many millilitres is that?`,
      correct: 13000,  wrongs: [1300, 130000, 130],     unit: 'ml',     hint: '1 litre = 1,000 ml' },
    { text: `A garden watering can holds ${hl('9 litres')}. How many millilitres is that?`,
      correct: 9000,   wrongs: [900, 90000, 90],        unit: 'ml',     hint: '1 litre = 1,000 ml' },
    { text: `A barrel of juice holds ${hl('25 litres')}. How many millilitres is that?`,
      correct: 25000,  wrongs: [2500, 250000, 250],     unit: 'ml',     hint: '1 litre = 1,000 ml' },
    { text: `A punch bowl holds ${hl('16,000 ml')}. How many litres is that?`,
      correct: 16,     wrongs: [160, 1600, 16000],      unit: 'litres', hint: '1,000 ml = 1 litre' },
    { text: `A teapot holds ${hl('900 ml')}. How many ml do ${hl('2 teapots')} hold?`,
      correct: 1800,   wrongs: [900, 1200, 2700],       unit: 'ml',     hint: 'Multiply: 2 × 900 ml' },
    { text: `A baby bath holds ${hl('18 litres')}. How many millilitres is that?`,
      correct: 18000,  wrongs: [1800, 180000, 180],     unit: 'ml',     hint: '1 litre = 1,000 ml' },
    { text: `A juice carton holds ${hl('11,000 ml')}. How many litres is that?`,
      correct: 11,     wrongs: [110, 1100, 11000],      unit: 'litres', hint: '1,000 ml = 1 litre' },
    { text: `A sprinkler uses ${hl('14 litres')}. How many millilitres is that?`,
      correct: 14000,  wrongs: [1400, 140000, 140],     unit: 'ml',     hint: '1 litre = 1,000 ml' },
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
  const t = rand(1, 5);
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
  if (t === 4) {                                        // g → mg
    const g = rand(1, 5);
    return makeQ(`Convert ${hl(g + (g === 1 ? ' gram' : ' grams'))} to milligrams.`,
      g * 1000, [g * 100, g * 10, (g + 2) * 1000], 'mg', '1 g = 1,000 mg', 'weight');
  }
  // t === 5: word problems (including mg)
  const scenes = [
    { text: `A bag weighs ${hl('3 kg')}. How many grams?`,           correct: 3000, wrongs: [300, 30000, 30],     unit: 'g',  hint: '1 kg = 1,000 g' },
    { text: `A lorry weighs ${hl('4 tonnes')}. How many kg?`,        correct: 4000, wrongs: [400, 40000, 40],     unit: 'kg', hint: '1 tonne = 1,000 kg' },
    { text: `A parcel is ${hl('5,000 g')}. How many kilograms?`,     correct: 5,    wrongs: [50, 500, 5000],      unit: 'kg', hint: '1,000 g = 1 kg' },
    { text: `A stone weighs ${hl('2 kg')}. How many grams?`,         correct: 2000, wrongs: [200, 20000, 20],     unit: 'g',  hint: '1 kg = 1,000 g' },
    { text: `A tablet contains ${hl('2 g')} of sugar. How many mg?`, correct: 2000, wrongs: [200, 20000, 20],     unit: 'mg', hint: '1 g = 1,000 mg' },
    { text: `A powder weighs ${hl('3,000 mg')}. How many grams?`,    correct: 3,    wrongs: [30, 300, 3000],      unit: 'g',  hint: '1,000 mg = 1 g' },
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
  const t = rand(1, 9);
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
  if (t === 8) {                                      // decimal mg → g
    const mg = pick([500, 1500, 2500, 750, 250, 3500]);
    const g  = mg / 1000;
    return makeQ(`Convert ${hl(fmtNum(mg) + ' mg')} to grams.`,
      g, [g * 10, g * 100, g + 1], 'g', '1,000 mg = 1 g', 'weight');
  }
  if (t === 9) {                                      // fraction g → mg
    const fracs = [
      { text: `${hl('½ g')} = how many milligrams?`,  correct: 500,  hint: '1 g = 1,000 mg, so ½ g = 500 mg' },
      { text: `${hl('¼ g')} = how many milligrams?`,  correct: 250,  hint: '1 g = 1,000 mg, so ¼ g = 250 mg' },
      { text: `${hl('¾ g')} = how many milligrams?`,  correct: 750,  hint: '1 g = 1,000 mg, so ¾ g = 750 mg' },
      { text: `${hl('1½ g')} = how many milligrams?`, correct: 1500, hint: '1 g = 1,000 mg, so 1½ g = 1,500 mg' },
      { text: `${hl('2½ g')} = how many milligrams?`, correct: 2500, hint: '1 g = 1,000 mg, so 2½ g = 2,500 mg' },
    ];
    const f = pick(fracs);
    return makeQ(f.text, f.correct, [f.correct / 2, f.correct * 2, f.correct / 10], 'mg', f.hint, 'weight');
  }

  // t === 7: word problems
  const scenes = [
    { text: `A bag of flour weighs ${hl('500 g')}. How many kilograms?`,   correct: 0.5, wrongs: [5, 50, 0.05],   unit: 'kg',     hint: '500 g = 0.5 kg (half a kilogram)' },
    { text: `A parcel weighs ${hl('1,500 g')}. How many kilograms?`,       correct: 1.5, wrongs: [15, 150, 0.15], unit: 'kg',     hint: '1,500 g = 1.5 kg' },
    { text: `A box weighs ${hl('0.75 kg')}. How many grams?`,              correct: 750, wrongs: [75, 7500, 7.5], unit: 'g',      hint: '0.75 kg = 750 g' },
    { text: `A truck carries ${hl('2,500 kg')}. How many tonnes?`,         correct: 2.5, wrongs: [25, 250, 0.25], unit: 'tonnes', hint: '2,500 kg = 2.5 tonnes' },
    { text: `A sack weighs ${hl('750 g')}. How many kilograms is that?`,   correct: 0.75, wrongs: [7.5, 75, 0.075],  unit: 'kg', hint: '750 g = 0.75 kg (¾ kilogram)' },
    { text: `A capsule contains ${hl('500 mg')} of medicine. How many grams?`, correct: 0.5, wrongs: [5, 50, 0.05], unit: 'g',  hint: '500 mg = 0.5 g (half a gram)' },
    { text: `A powder dose is ${hl('1,500 mg')}. How many grams is that?`, correct: 1.5, wrongs: [15, 150, 0.15],   unit: 'g',  hint: '1,500 mg = 1.5 g' },
    { text: `A supplement contains ${hl('0.25 g')} of iron. How many milligrams?`, correct: 250, wrongs: [25, 2500, 2.5], unit: 'mg', hint: '0.25 g = 250 mg (¼ of 1,000)' },
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
  $('nav-menu').style.display        = loggedIn ? '' : 'none';
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
  playSound(isCorrect ? 'correct' : 'wrong');

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
  playSound(isCorrect ? 'correct' : 'wrong');

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

// ══════════════════════════════════════════════════════════════════════════════
// TIMES TABLE QUIZ
// ══════════════════════════════════════════════════════════════════════════════

const ttState = {
  table:          null,   // 13-30 or 'random'
  total:          10,
  questions:      [],
  idx:            0,
  score:          0,
  answered:       false,
  quizStart:      0,
  qStart:         0,
  timerInterval:  null,
};

// ─── Timer helpers ────────────────────────────────────────────────────────────
function ttStartTimer() {
  ttState.quizStart = Date.now();
  const el = $('tt-hdr-timer');
  ttState.timerInterval = setInterval(() => {
    if (el) el.textContent = fmtTime(Date.now() - ttState.quizStart);
  }, 500);
}

function ttStopTimer() {
  clearInterval(ttState.timerInterval);
  ttState.timerInterval = null;
}

// ─── Question generator ───────────────────────────────────────────────────────
function ttBuildQuestions(table, total) {
  // Generate a pool of multipliers 1-12, repeated as needed
  const multipliers = shuffle(
    Array.from({ length: 12 }, (_, i) => i + 1)
  ).slice(0, Math.min(total, 12));

  // If total > 12, fill remaining with random multipliers
  while (multipliers.length < total) {
    multipliers.push(rand(1, 12));
  }

  return multipliers.slice(0, total).map(multiplier => {
    const t      = table === 'random' ? rand(13, 30) : table;
    const correct = t * multiplier;

    // Generate 3 plausible wrong answers
    const wrongs = new Set();
    // Wrong multipliers of same table
    let attempts = 0;
    while (wrongs.size < 3 && attempts < 30) {
      const wm = rand(1, 12);
      const w  = t * wm;
      if (w !== correct) wrongs.add(w);
      attempts++;
    }
    // Fallback: offset by small amount
    if (wrongs.size < 3) wrongs.add(correct + rand(1, t));
    if (wrongs.size < 3) wrongs.add(correct - rand(1, t > 1 ? t - 1 : 1));

    const pool = shuffle([correct, ...[...wrongs].slice(0, 3)]);
    const LETTERS   = ['A', 'B', 'C', 'D'];
    const answerIdx = pool.indexOf(correct);

    return {
      table:      t,
      multiplier,
      correct,
      values:     pool.map(String),
      answer:     LETTERS[answerIdx],
    };
  });
}

// ─── Setup screen ─────────────────────────────────────────────────────────────
function initTimesTable() {
  showScreen('screen-times-table');
  ttShowPanel('setup');

  // Build table-selection buttons (Random + 13-30)
  const grid = $('tt-table-grid');
  grid.innerHTML = '';
  ttState.table = null;

  const makeTableBtn = (label, value, extraClass = '') => {
    const btn = document.createElement('button');
    btn.className = `tt-table-btn${extraClass ? ' ' + extraClass : ''}`;
    btn.textContent = label;
    btn.dataset.table = value;
    btn.onclick = () => {
      grid.querySelectorAll('.tt-table-btn').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      ttState.table = value === 'random' ? 'random' : Number(value);
      $('tt-start-btn').disabled = false;
    };
    return btn;
  };

  grid.appendChild(makeTableBtn('🎲 Random', 'random', 'random-btn'));
  for (let t = 13; t <= 30; t++) {
    grid.appendChild(makeTableBtn(`${t}×`, String(t)));
  }

  // Questions-per-quiz selector
  ttState.total = 10;
  const qcountBtns = $('tt-qcount-grid').querySelectorAll('.qcount-btn');
  qcountBtns.forEach(btn => {
    btn.onclick = () => {
      qcountBtns.forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      ttState.total = Number(btn.dataset.count);
    };
  });

  $('tt-start-btn').disabled = true;
  $('tt-start-btn').onclick  = ttStartQuiz;
  $('tt-home-btn').onclick   = () => { showScreen('screen-welcome'); initWelcome(); };
}

// ─── Panel switcher (within the screen) ──────────────────────────────────────
function ttShowPanel(panel) {
  $('tt-setup-panel').style.display   = panel === 'setup'   ? '' : 'none';
  $('tt-quiz-panel').style.display    = panel === 'quiz'    ? '' : 'none';
  $('tt-results-panel').style.display = panel === 'results' ? '' : 'none';
}

// ─── Start quiz ───────────────────────────────────────────────────────────────
function ttStartQuiz() {
  ttState.questions = ttBuildQuestions(ttState.table, ttState.total);
  ttState.idx       = 0;
  ttState.score     = 0;
  ttState.answered  = false;

  ttShowPanel('quiz');
  ttStopTimer();
  ttStartTimer();
  ttShowQuestion();

  $('tt-quit-btn').onclick = () => {
    if (confirm('Quit the quiz? Your progress won\'t be saved.')) {
      ttStopTimer();
      initTimesTable();
    }
  };
}

// ─── Show question ────────────────────────────────────────────────────────────
function ttShowQuestion() {
  const q = ttState.questions[ttState.idx];
  ttState.qStart   = Date.now();
  ttState.answered = false;

  $('tt-q-meta').textContent = `Question ${ttState.idx + 1} of ${ttState.total}`;
  $('tt-q-text').innerHTML   =
    `What is ${hl(q.table)} × ${hl(q.multiplier)} ?`;
  $('tt-hdr-score').textContent      = `Score: ${ttState.score} / ${ttState.total}`;
  $('tt-progress-fill').style.width  = `${(ttState.idx / ttState.total) * 100}%`;
  $('tt-progress-label').textContent = `${ttState.idx} / ${ttState.total}`;
  $('tt-feedback-box').hidden        = true;

  const grid = $('tt-options-grid');
  grid.innerHTML = '';
  const LETTERS = ['A', 'B', 'C', 'D'];
  q.values.forEach((val, i) => {
    const btn = document.createElement('button');
    btn.className = 'option-btn';
    btn.innerHTML = `<span class="option-letter">${LETTERS[i]}</span><span>${val}</span>`;
    btn.addEventListener('click', () => ttHandleAnswer(LETTERS[i], q, btn));
    grid.appendChild(btn);
  });

  animateEl(document.querySelector('#tt-quiz-panel .question-card'), 'anim-fade');
}

// ─── Handle answer ────────────────────────────────────────────────────────────
function ttHandleAnswer(letter, q, clickedBtn) {
  if (ttState.answered) return;
  ttState.answered = true;

  const correct = letter === q.answer;
  if (correct) ttState.score++;

  playSound(correct ? 'correct' : 'wrong');

  // Style all buttons
  const LETTERS = ['A', 'B', 'C', 'D'];
  $('tt-options-grid').querySelectorAll('.option-btn').forEach((btn, i) => {
    btn.disabled = true;
    if (LETTERS[i] === q.answer) btn.classList.add('correct');
    else if (btn === clickedBtn)  btn.classList.add('wrong');
  });

  const feedbackMsg = $('tt-feedback-msg');
  const feedbackHint = $('tt-feedback-hint');
  feedbackMsg.textContent  = correct
    ? '✅ Correct!'
    : `❌ Wrong — the answer is ${q.correct}`;
  feedbackHint.textContent = `${q.table} × ${q.multiplier} = ${q.correct}`;
  $('tt-feedback-box').hidden = false;

  const isLast = ttState.idx >= ttState.total - 1;
  const nextBtn = $('tt-next-btn');
  nextBtn.textContent = isLast ? 'See Results →' : 'Next Question →';
  nextBtn.onclick = () => {
    ttState.idx++;
    if (ttState.idx < ttState.total) {
      ttShowQuestion();
    } else {
      ttFinish();
    }
  };
}

// ─── Results ──────────────────────────────────────────────────────────────────
function ttFinish() {
  ttStopTimer();
  const totalMs = Date.now() - ttState.quizStart;
  const pct     = Math.round((ttState.score / ttState.total) * 100);

  const [emoji, grade, msg] =
    pct === 100 ? ['🌟', '★★★ Perfect!',      "Flawless! You know these tables inside out!"]       :
    pct >= 80   ? ['🎉', '★★  Excellent!',      "Brilliant! You really know your times tables!"]      :
    pct >= 60   ? ['👍', '★   Good Work!',       "Well done! A bit more practice and you'll ace it!"] :
    pct >= 40   ? ['🙂', '    Keep Trying!',     "Good effort! Review the tables and try again."]     :
                  ['📚', '    Keep Practising!', "Don't give up! Practice makes perfect."];

  ttShowPanel('results');
  $('tt-result-emoji').textContent    = emoji;
  $('tt-result-greeting').textContent = `Great effort, ${state.name}!`;
  $('tt-big-score').textContent       = `${ttState.score} / ${ttState.total}`;
  $('tt-grade-badge').textContent     = grade;
  $('tt-stat-time').textContent       = fmtTime(totalMs);
  $('tt-stat-pct').textContent        = pct + '%';
  $('tt-result-msg').textContent      = msg;

  $('tt-progress-fill').style.width   = '100%';
  $('tt-progress-label').textContent  = `${ttState.total} / ${ttState.total}`;

  animateEl(document.querySelector('#tt-results-panel .results-card'), 'anim-pop');

  $('tt-play-again-btn').onclick = () => initTimesTable();
  $('tt-home-from-results-btn').onclick = () => { showScreen('screen-welcome'); initWelcome(); };
}
