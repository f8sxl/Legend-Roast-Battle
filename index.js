/* ══════════════════════════════════
   THEME
══════════════════════════════════ */
function toggleTheme() {
  const html = document.documentElement;
  html.setAttribute('data-theme', html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
}

/* ══════════════════════════════════
   TICKER
══════════════════════════════════ */
const tickerItems = [
  'Messi vs Ronaldo', 'Maradona vs Pelé', 'Zidane vs Cruyff', 'Ronaldo R9 vs Henry',
  'Zlatan vs Everyone', 'Ronaldinho vs Mbappé', 'Modrić vs Xavi', 'Best vs Beckham',
  'The GOAT Debate Starts Here', 'Who Gets Destroyed?', 'Round by Round Burns',
  'AI-Powered Roast Battle', 'Real Facts · Fictional Flames'
];

function buildTicker() {
  const track = document.getElementById('tickerTrack');
  const doubled = [...tickerItems, ...tickerItems];
  track.innerHTML = doubled.map(t =>
    `<span class="ticker-item"><span class="ticker-dot"></span>${t}</span>`
  ).join('');
}

buildTicker();

/* ══════════════════════════════════
   API KEY
══════════════════════════════════ */
let apiKey = '';

function setStatus(msg, type) {
  const el = document.getElementById('apiStatus');
  el.textContent = msg;
  el.className = 'api-status ' + type;
}

function saveApiKey() {
  const val = document.getElementById('apiKeyInput').value.trim();
  if (!val) { setStatus('Paste a key first.', 'err'); return; }
  if (!val.startsWith('gsk_')) { setStatus('Should start with gsk_ — double check it.', 'err'); return; }
  apiKey = val;
  setStatus('✓ Your key saved — ready!', 'ok');
}

/* ══════════════════════════════════
   FIGHTER SELECT
══════════════════════════════════ */
function handleSelect(which) {
  const sel = document.getElementById(which + 'Select');
  const inp = document.getElementById(which + 'Custom');
  inp.style.display = sel.value === 'custom' ? 'block' : 'none';
  if (sel.value === 'custom') inp.focus();
}

function getFighter(which) {
  const sel = document.getElementById(which + 'Select');
  if (sel.value === 'custom') return document.getElementById(which + 'Custom').value.trim();
  return sel.value;
}

/* ══════════════════════════════════
   ROUNDS
══════════════════════════════════ */
let rounds = 3;

function setRounds(n) {
  rounds = n;
  document.querySelectorAll('.round-chip').forEach(c => {
    c.classList.toggle('active', parseInt(c.textContent) === n);
  });
}

/* ══════════════════════════════════
   ERROR
══════════════════════════════════ */
function showError(msg) {
  const el = document.getElementById('errorBox');
  el.textContent = '⚠️ ' + msg;
  el.classList.add('active');
}

function clearError() {
  document.getElementById('errorBox').classList.remove('active');
}

/* ══════════════════════════════════
   GROQ API
══════════════════════════════════ */
async function callGroq(messages, system) {
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      max_tokens: 900,
      temperature: 0.93,
      messages: [{ role: 'system', content: system }, ...messages]
    })
  });
  if (!res.ok) {
    const e = await res.json().catch(() => ({}));
    throw new Error(e.error?.message || `API error ${res.status}`);
  }
  const d = await res.json();
  return d.choices[0].message.content.trim();
}

/* ══════════════════════════════════
   PARSE ROUND
══════════════════════════════════ */
function parseRound(text) {
  const redM = text.match(/RED[:\-\s]+(.+?)(?=BLUE[:\-\s]|$)/si);
  const blueM = text.match(/BLUE[:\-\s]+(.+?)$/si);
  let red = redM ? redM[1].trim().replace(/^RED[:\-\s]*/i, '') : '';
  let blue = blueM ? blueM[1].trim().replace(/^BLUE[:\-\s]*/i, '') : '';
  if (!red || !blue) {
    const parts = text.split(/\n\n+/).filter(p => p.trim().length > 20);
    red = (parts[0] || text).replace(/^RED[:\-\s]*/i, '').trim();
    blue = (parts[1] || '').replace(/^BLUE[:\-\s]*/i, '').trim();
  }
  return { red, blue };
}

/* ══════════════════════════════════
   RENDER ROUND
══════════════════════════════════ */
function renderRound(num, red, blue, f1, f2) {
  const crowdRed = 38 + Math.floor(Math.random() * 26);
  const crowdBlue = 100 - crowdRed;
  const container = document.getElementById('roundsContainer');

  const block = document.createElement('div');
  block.className = 'round-block';
  block.innerHTML = `
    <div class="round-divider">
      <div class="round-divider-line"></div>
      <div class="round-divider-label">⚽ Round ${num}</div>
      <div class="round-divider-line"></div>
    </div>
    <div class="roast-pair">
      <div class="roast-bubble red-bubble">
        <div class="bubble-name">🔴 ${f1}</div>
        <div class="bubble-text">${red}</div>
      </div>
      <div class="roast-bubble blue-bubble">
        <div class="bubble-name">🔵 ${f2}</div>
        <div class="bubble-text">${blue}</div>
      </div>
    </div>
    <div class="crowd-meter">
      <div class="crowd-header">
        <span class="red-pct">🔴 ${crowdRed}%</span>
        <span class="crowd-mid">Crowd Reaction</span>
        <span class="blue-pct">${crowdBlue}% 🔵</span>
      </div>
      <div class="crowd-track">
        <div class="crowd-red-fill" style="width:0%" data-target="${crowdRed}"></div>
        <div class="crowd-blue-fill" style="width:0%" data-target="${crowdBlue}"></div>
      </div>
    </div>
  `;

  container.appendChild(block);
  setTimeout(() => {
    block.classList.add('revealed');
    // Animate crowd bars
    block.querySelectorAll('.crowd-red-fill, .crowd-blue-fill').forEach(el => {
      setTimeout(() => { el.style.width = el.dataset.target + '%'; }, 200);
    });
  }, 60);
}

/* ══════════════════════════════════
   BATTLE
══════════════════════════════════ */

const legendPhotos = {
  'Lionel Messi': 'https://cdn.sofifa.net/players/158/023/24_120.png',
  'Cristiano Ronaldo': 'https://cdn.sofifa.net/players/020/801/24_120.png',
  'Diego Maradona': 'https://cdn.sofifa.net/players/000/010/08_120.png',
  'Pelé': 'https://cdn.sofifa.net/players/000/008/08_120.png',
  'Zinedine Zidane': 'https://cdn.sofifa.net/players/003/012/07_120.png',
  'Ronaldinho': 'https://cdn.sofifa.net/players/003/140/08_120.png',
  'Ronaldo Nazário': 'https://cdn.sofifa.net/players/003/160/07_120.png',
  'Thierry Henry': 'https://cdn.sofifa.net/players/007/641/08_120.png',
  'Zlatan Ibrahimović': 'https://cdn.sofifa.net/players/011/739/24_120.png',
  'Kylian Mbappé': 'https://cdn.sofifa.net/players/231/747/24_120.png'
};

const fallbackSVG = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120' viewBox='0 0 120 120'%3E%3Ccircle cx='60' cy='60' r='60' fill='%23e8f5ed'/%3E%3Ccircle cx='60' cy='44' r='22' fill='%231A7C3E' opacity='0.7'/%3E%3Cellipse cx='60' cy='100' rx='34' ry='26' fill='%231A7C3E' opacity='0.5'/%3E%3Ctext x='60' y='60' text-anchor='middle' font-size='32' font-family='sans-serif'%3E%E2%9A%BD%3C/text%3E%3C/svg%3E";

function fetchWikiPhoto(name, imgEl) {
  const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(name)}`;
  fetch(url)
    .then(r => r.json())
    .then(d => {
      const src = d.thumbnail && d.thumbnail.source;
      if (src) { imgEl.onerror = () => { imgEl.onerror=null; imgEl.src=fallbackSVG; }; imgEl.src = src; }
      else imgEl.src = fallbackSVG;
    })
    .catch(() => { imgEl.src = fallbackSVG; });
}

function showLegendPhotos(f1, f2) {
  document.getElementById('battleFighters').style.display = 'flex';
  const img1 = document.getElementById('legendImg1');
  const img2 = document.getElementById('legendImg2');
  img1.src = fallbackSVG;
  img2.src = fallbackSVG;

  // Try known photo first, fall back to Wikipedia API, then SVG
  function loadPhoto(imgEl, name) {
    const known = legendPhotos[name];
    if (known) {
      imgEl.onerror = () => { imgEl.onerror = null; fetchWikiPhoto(name, imgEl); };
      imgEl.src = known;
    } else {
      fetchWikiPhoto(name, imgEl);
    }
  }

  loadPhoto(img1, f1);
  loadPhoto(img2, f2);
  document.getElementById('legendLabel1').textContent = f1;
  document.getElementById('legendLabel2').textContent = f2;
}

let f1Name = '', f2Name = '', history = [];

async function startBattle() {
  clearError();
  f1Name = getFighter('f1');
  f2Name = getFighter('f2');

  if (!apiKey) { showError('Add your Groq key above first — click "Copy & Use" for the demo key.'); return; }
  if (!f1Name) { showError('Pick a legend for the Red Corner.'); return; }
  if (!f2Name) { showError('Pick a legend for the Blue Corner.'); return; }
  if (f1Name.toLowerCase() === f2Name.toLowerCase()) { showError('Pick two different legends!'); return; }

  // Setup
  showLegendPhotos(f1Name, f2Name);
  document.getElementById('scoreName1').textContent = f1Name;
  document.getElementById('scoreName2').textContent = f2Name;
  document.getElementById('voteN1').textContent = f1Name;
  document.getElementById('voteN2').textContent = f2Name;
  document.getElementById('roundsContainer').innerHTML = '';
  document.getElementById('voteCard').classList.remove('active');
  document.getElementById('winnerCard').classList.remove('active');
  document.getElementById('replayBtn').classList.remove('active');

  const btn = document.getElementById('kickoffBtn');
  btn.innerHTML = '<div class="btn-spinner"></div> Battle In Progress...';
  btn.disabled = true;

  const arena = document.getElementById('arena');
  arena.classList.add('active');
  setTimeout(() => arena.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);

  const sys = `You are the host of a savage football legends roast battle. Write sharp, historically accurate, specific roast lines. Every burn must reference REAL career events, real failures, real controversies — never generic. Keep each roast punchy: 3–4 sentences max. Be witty and brutal.`;

  history = [];

  for (let r = 1; r <= rounds; r++) {
    document.getElementById('scoreRoundInfo').textContent = `Round ${r} of ${rounds}`;
    const typing = document.getElementById('typingWrap');
    document.getElementById('typingText').textContent = `Generating Round ${r}...`;
    typing.classList.add('active');

    const prompt = r === 1
      ? `Start a roast battle: ${f1Name} (RED) vs ${f2Name} (BLUE). Round ${r}.\n\nFormat EXACTLY:\nRED: [${f1Name} roasts ${f2Name} — 3-4 sentences of specific career burns]\n\nBLUE: [${f2Name} roasts ${f1Name} — 3-4 sentences of specific career burns]`
      : `Continue the roast battle. Round ${r} — escalate the intensity, get more personal.\n\nRED: [${f1Name}'s next burn]\n\nBLUE: [${f2Name}'s comeback]`;

    history.push({ role: 'user', content: prompt });

    try {
      const reply = await callGroq(history, sys);
      history.push({ role: 'assistant', content: reply });
      typing.classList.remove('active');
      const { red, blue } = parseRound(reply);
      renderRound(r, red, blue, f1Name, f2Name);
      if (r < rounds) await new Promise(res => setTimeout(res, 500));
    } catch (err) {
      typing.classList.remove('active');
      showError(`Round ${r} failed: ${err.message}`);
      btn.innerHTML = '<span class="kickoff-ball">⚽</span> Kick Off the Roast';
      btn.disabled = false;
      return;
    }
  }

  // Show vote
  document.getElementById('voteCard').classList.add('active');
  setTimeout(() => document.getElementById('voteCard').scrollIntoView({ behavior: 'smooth', block: 'center' }), 200);
  btn.innerHTML = '<span class="kickoff-ball">⚽</span> Kick Off the Roast';
  btn.disabled = false;
}

/* ══════════════════════════════════
   VOTE & WINNER
══════════════════════════════════ */
async function castVote(side) {
  document.getElementById('voteCard').classList.remove('active');

  let winnerDisplay, verdictPrompt;
  if (side === 'red') {
    winnerDisplay = f1Name;
    verdictPrompt = `${f1Name} destroyed ${f2Name} in a roast battle. Write a 2-sentence crowd verdict — dramatic, specific, brutal.`;
  } else if (side === 'blue') {
    winnerDisplay = f2Name;
    verdictPrompt = `${f2Name} destroyed ${f1Name} in a roast battle. Write a 2-sentence crowd verdict — dramatic, specific, brutal.`;
  } else {
    winnerDisplay = "IT'S A TIE";
    verdictPrompt = `${f1Name} and ${f2Name} fought to a draw in a roast battle. Write a 2-sentence verdict — both landed equally savage blows.`;
  }

  const wc = document.getElementById('winnerCard');
  document.getElementById('winnerName').textContent = winnerDisplay;
  document.getElementById('winnerVerdict').textContent = 'Writing the verdict...';
  wc.classList.add('active');
  setTimeout(() => wc.scrollIntoView({ behavior: 'smooth', block: 'center' }), 100);

  try {
    const verdict = await callGroq(
      [{ role: 'user', content: verdictPrompt }],
      'You are a dramatic football roast battle announcer. Write punchy crowd verdicts.'
    );
    document.getElementById('winnerVerdict').textContent = verdict;
  } catch {
    document.getElementById('winnerVerdict').textContent = 'The crowd has made their call.';
  }

  document.getElementById('replayBtn').classList.add('active');
}

/* ══════════════════════════════════
   RESTART
══════════════════════════════════ */
function restartBattle() {
  document.getElementById('arena').classList.remove('active');
  document.getElementById('roundsContainer').innerHTML = '';
  document.getElementById('voteCard').classList.remove('active');
  document.getElementById('winnerCard').classList.remove('active');
  document.getElementById('replayBtn').classList.remove('active');
  clearError();
  window.scrollTo({ top: document.querySelector('.main').offsetTop - 80, behavior: 'smooth' });
}