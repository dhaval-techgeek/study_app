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

/** Format a number with thousands commas */
const fmtNum = n => n.toLocaleString('en-GB');

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
function qLength() {
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
function qWeight() {
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
function qCapacity() {
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

// ─── Question Set Builder ─────────────────────────────────────────────────────
function buildSet(category, n = 10) {
  const gens = { length: qLength, weight: qWeight, capacity: qCapacity };
  const gen  = category === 'mixed'
    ? () => pick([qLength, qWeight, qCapacity])()
    : gens[category];
  return Array.from({ length: n }, gen);
}

// ─── Quiz State ───────────────────────────────────────────────────────────────
const TOTAL = 10;

const state = {
  userId:   null,
  username: '',
  name:     '',
  category: '',
  mode:     'standard',
  questions: [],
  idx:      0,
  score:    0,
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
function doLogout() {
  localStorage.removeItem('ks2_auth');
  state.userId   = null;
  state.username = '';
  stopTimer();
  showScreen('screen-login');
  initLoginScreen();
}

function initApp() {
  document.querySelectorAll('.logout-btn').forEach(btn => { btn.onclick = doLogout; });

  const saved = localStorage.getItem('ks2_auth');
  if (saved) {
    try {
      const auth = JSON.parse(saved);
      state.userId   = auth.userId;
      state.username = auth.username;
      showScreen('screen-welcome');
      initWelcome();
      return;
    } catch { /* invalid — fall through to login */ }
  }
  showScreen('screen-login');
  initLoginScreen();
}

function initLoginScreen() {
  const usernameInput = $('login-username');
  const passwordInput = $('login-password');
  const submitBtn     = $('login-submit');
  const errorEl       = $('login-error');
  const tabs          = document.querySelectorAll('.tab-btn');
  let mode = 'login';

  usernameInput.value = '';
  passwordInput.value = '';
  errorEl.hidden      = true;
  submitBtn.disabled  = false;
  submitBtn.textContent = 'Log In';
  tabs.forEach(t => t.classList.toggle('active', t.dataset.tab === 'login'));

  tabs.forEach(tab => {
    tab.onclick = () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      mode = tab.dataset.tab;
      submitBtn.textContent = mode === 'login' ? 'Log In' : 'Register';
      errorEl.hidden = true;
    };
  });

  async function doSubmit() {
    const username = usernameInput.value.trim();
    const password = passwordInput.value;
    if (!username || !password) {
      errorEl.textContent = 'Please enter both username and password.';
      errorEl.hidden = false;
      return;
    }
    submitBtn.disabled = true;
    errorEl.hidden     = true;
    try {
      const res  = await fetch(`/api/${mode}`, {
        method : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body   : JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        errorEl.textContent = data.error || 'Something went wrong.';
        errorEl.hidden      = false;
        submitBtn.disabled  = false;
        return;
      }
      state.userId   = data.userId;
      state.username = data.username;
      localStorage.setItem('ks2_auth', JSON.stringify({ userId: data.userId, username: data.username }));
      showScreen('screen-welcome');
      initWelcome();
    } catch {
      errorEl.textContent = 'Could not reach the server. Is it running?';
      errorEl.hidden      = false;
      submitBtn.disabled  = false;
    }
  }

  submitBtn.onclick = doSubmit;
  [usernameInput, passwordInput].forEach(el => {
    el.onkeydown = e => { if (e.key === 'Enter') doSubmit(); };
  });
}

// ─── Welcome Screen ───────────────────────────────────────────────────────────
function initWelcome() {
  const nameInput = $('name-input');
  const startBtn  = $('start-btn');
  let selectedCat  = '';
  let selectedMode = 'standard';

  // Reset state
  nameInput.value = state.username || '';
  startBtn.disabled = true;
  document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('selected'));
  document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('selected'));
  document.querySelector('[data-mode="standard"]').classList.add('selected');

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

  startBtn.onclick = () => {
    state.name     = nameInput.value.trim() || 'Champion';
    state.category = selectedCat;
    state.mode     = selectedMode;
    startQuiz();
  };

  // Allow Enter key to start (if form is valid)
  nameInput.onkeydown = e => {
    if (e.key === 'Enter' && !startBtn.disabled) startBtn.click();
  };
}

// ─── Start Quiz ───────────────────────────────────────────────────────────────
function startQuiz() {
  state.questions = buildSet(state.category, TOTAL);
  state.idx     = 0;
  state.score   = 0;
  state.qTimes  = [];
  state.answered = false;

  showScreen('screen-quiz');
  $('hdr-name').textContent = state.name;
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

  $('q-meta').textContent     = `Question ${state.idx + 1} of ${TOTAL}  ·  ${catLabel}`;
  $('q-text').innerHTML       = q.text;
  $('hdr-score').textContent  = `Score: ${state.score} / ${TOTAL}`;
  $('progress-fill').style.width    = `${(state.idx / TOTAL) * 100}%`;
  $('progress-label').textContent   = `${state.idx} / ${TOTAL}`;

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

  // Hide feedback
  $('feedback-box').hidden = true;

  // Animate card in
  animateEl(document.querySelector('.question-card'), 'anim-fade');
}

// ─── Handle Answer ────────────────────────────────────────────────────────────
function handleAnswer(chosen, q) {
  if (state.answered) return;
  state.answered = true;

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
  const isLast = state.idx === TOTAL - 1;
  nextBtn.textContent = isLast ? 'See My Results 🎉' : 'Next Question →';

  $('feedback-box').hidden = false;

  // Update score in header
  $('hdr-score').textContent = `Score: ${state.score} / ${TOTAL}`;

  nextBtn.onclick = () => {
    state.idx++;
    if (state.idx >= TOTAL) {
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
  $('hdr-score').textContent      = `Score: ${state.score} / ${TOTAL}`;
  $('next-btn').hidden            = true;
  $('feedback-box').hidden        = false;

  // Auto-advance: immediately on correct, pause on wrong to read the hint
  setTimeout(() => {
    state.idx++;
    if (state.idx >= TOTAL) showResults();
    else showQuestion();
  }, isCorrect ? 0 : 2200);
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
        total      : TOTAL,
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

// ─── Results Screen ───────────────────────────────────────────────────────────
function showResults() {
  stopTimer();

  const totalMs = Date.now() - state.quizStart;
  saveAttempt(totalMs);

  // Reset history section while new data loads
  $('history-wrap').hidden = true;
  $('history-list').innerHTML = '';
  const pct     = Math.round((state.score / TOTAL) * 100);
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
  $('big-score').textContent       = `${state.score} / ${TOTAL}`;
  $('grade-badge').textContent     = grade;
  $('stat-total-time').textContent = fmtTime(totalMs);
  $('stat-avg-time').textContent   = fmtTime(avgMs, true);
  $('stat-pct').textContent        = pct + '%';
  $('result-msg').textContent      = msg;

  // Update final progress bar to 100 %
  $('progress-fill').style.width   = '100%';
  $('progress-label').textContent  = `${TOTAL} / ${TOTAL}`;

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
