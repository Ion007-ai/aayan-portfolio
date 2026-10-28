// ---- Mobile nav toggle ----
const navToggle = document.querySelector('.nav-toggle');
const nav = document.getElementById('nav');
navToggle.addEventListener('click', () => {
  const open = nav.classList.toggle('open');
  navToggle.setAttribute('aria-expanded', String(open));
});
nav.querySelectorAll('a').forEach((link) =>
  link.addEventListener('click', () => {
    nav.classList.remove('open');
    navToggle.setAttribute('aria-expanded', 'false');
  })
);

// ---- Netrunner quickhack interface (the creative feature) ----
const RAM_MAX = 100;
const RAM_REGEN = 4;            // RAM restored every tick
const RAM_TICK_MS = 1000;
const UNLOCK_AFTER = 3;         // successful breaches needed for the classified target

// Quickhacks: each costs RAM and takes time to run.
const HACKS = {
  ping: { name: 'PING', cost: 10, time: 1200, desc: 'Scan for basic intel' },
  breach: { name: 'BREACH', cost: 25, time: 2200, desc: 'Crack deeper data' },
  overheat: { name: 'OVERHEAT', cost: 40, time: 3000, desc: 'Push the target to reveal a hidden story' },
};

// Each target holds one reveal per quickhack.
const TARGETS = {
  about: {
    label: 'ABOUT // ME',
    reveals: {
      ping: 'Signal found: first-year CSE (AI/ML) student at VIT Bhopal.',
      breach: 'Access granted: home base in Kota, Rajasthan. Currently in Madhya Pradesh.',
      overheat: 'Overload: I learn by building, one commit at a time.',
    },
  },
  skills: {
    label: 'SKILLS // TECH',
    reveals: {
      ping: 'Python and C: learning. HTML, CSS, JavaScript: beginner.',
      breach: 'Generative AI and ML: exploring. GitHub and VS Code: daily tools.',
      overheat: 'Video editing and voice recording: active creative skills.',
    },
  },
  projects: {
    label: 'PROJECTS // BUILDS',
    reveals: {
      ping: 'Five builds found: CropCare, TabSlayer, this portfolio, Python and C, Generative AI.',
      breach: 'CropCare: Python tool for crop records and disease suggestions from symptoms.',
      overheat: 'TabSlayer: browser research agent with multi-source caching.',
    },
  },
  achievements: {
    label: 'ACHIEVEMENTS // LOG',
    reveals: {
      ping: 'NCC "A" Grade Certificate and an Annual Training Camp certificate.',
      breach: 'Cultural medal: Mime/Drama performance at an NCC event.',
      overheat: 'School basketball, and CBSE Class X at 91.2%.',
    },
  },
  contact: {
    label: 'CONTACT // UPLINK',
    reveals: {
      ping: 'Email: aayan.26bai10444@vitbhopal.ac.in',
      breach: 'GitHub: github.com/Ion007-ai',
      overheat: 'LinkedIn: linkedin.com/in/aayan-bhaisal',
    },
  },
  classified: {
    label: 'CLASSIFIED // 0042',
    locked: true,
    reveals: {
      ping: 'Unknown signal in the silence.',
      breach: 'The lesson: a story can be told without a single word.',
      overheat: 'Same mindset as code: say less, and let the interface speak.',
    },
  },
};

const hudToggle = document.getElementById('hud-toggle');
const hud = document.getElementById('hud');
const hudClose = document.getElementById('hud-close');
const targetList = document.getElementById('target-list');
const hackList = document.getElementById('hack-list');
const targetTitle = document.getElementById('target-title');
const log = document.getElementById('log');
const ramVal = document.getElementById('ram-val');
const ramFill = document.getElementById('ram-fill');
const progressBar = document.getElementById('progress-bar');
const breachCount = document.getElementById('breach-count');

let ram = RAM_MAX;
let breaches = 0;
let selectedTarget = null;
let running = false;
let progressTimer = null;

function isUnlocked(key) {
  return !TARGETS[key].locked || breaches >= UNLOCK_AFTER;
}

function writeLog(text, cls) {
  const line = document.createElement('div');
  if (cls) line.className = cls;
  line.textContent = text;
  log.appendChild(line);
  log.scrollTop = log.scrollHeight;
}

function updateRam() {
  ramVal.textContent = String(ram);
  ramFill.style.width = `${(ram / RAM_MAX) * 100}%`;
  refreshHackButtons();
}

function updateBreaches() {
  breachCount.textContent = String(Math.min(breaches, UNLOCK_AFTER));
  renderTargets();
}

function renderTargets() {
  targetList.innerHTML = '';
  Object.keys(TARGETS).forEach((key) => {
    const item = document.createElement('li');
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.dataset.target = key;
    btn.setAttribute('aria-pressed', String(key === selectedTarget));
    const unlocked = isUnlocked(key);
    btn.disabled = !unlocked;
    btn.textContent = unlocked ? TARGETS[key].label : '[LOCKED] ???';
    btn.addEventListener('click', () => selectTarget(key));
    item.appendChild(btn);
    targetList.appendChild(item);
  });
}

function selectTarget(key) {
  selectedTarget = key;
  targetTitle.textContent = `TARGET: ${TARGETS[key].label}`;
  renderHacks();
  renderTargets();
  writeLog(`> target locked: ${TARGETS[key].label}`, 'sys');
}

function renderHacks() {
  hackList.innerHTML = '';
  Object.keys(HACKS).forEach((id) => {
    const hack = HACKS[id];
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'hack-btn';
    btn.dataset.hack = id;
    const title = document.createElement('strong');
    title.textContent = hack.name;
    btn.appendChild(title);
    btn.appendChild(document.createTextNode(`${hack.desc}\nRAM cost: ${hack.cost}`));
    btn.addEventListener('click', () => executeHack(id));
    hackList.appendChild(btn);
  });
  refreshHackButtons();
}

function refreshHackButtons() {
  hackList.querySelectorAll('button').forEach((btn) => {
    const hack = HACKS[btn.dataset.hack];
    btn.disabled = running || !selectedTarget || ram < hack.cost;
  });
}

function executeHack(id) {
  if (running || !selectedTarget) return;
  const hack = HACKS[id];
  if (ram < hack.cost) {
    writeLog(`> ERR: ${hack.name} needs ${hack.cost} RAM, you have ${ram}.`, 'err');
    return;
  }

  ram -= hack.cost;
  updateRam();
  running = true;
  refreshHackButtons();
  writeLog(`> running ${hack.name} on ${TARGETS[selectedTarget].label}...`, 'sys');

  // Progress bar animates over the hack's run time.
  progressBar.style.transition = 'none';
  progressBar.style.width = '0%';
  void progressBar.offsetWidth; // restart the transition
  progressBar.style.transition = `width ${hack.time}ms linear`;
  progressBar.style.width = '100%';

  const target = selectedTarget;
  progressTimer = setTimeout(() => {
    running = false;
    breaches += 1;
    writeLog(`> ${hack.name} complete: ${TARGETS[target].reveals[id]}`, 'reveal');
    updateBreaches();
    if (breaches === UNLOCK_AFTER) {
      writeLog('> ACCESS GRANTED: CLASSIFIED target unlocked.', 'ok');
    }
    refreshHackButtons();
  }, hack.time);
}

// RAM regenerates over time, so the HUD stays playable without waiting.
setInterval(() => {
  if (ram < RAM_MAX) {
    ram = Math.min(RAM_MAX, ram + RAM_REGEN);
    updateRam();
  }
}, RAM_TICK_MS);

function openHud() {
  hud.hidden = false;
  hudToggle.setAttribute('aria-expanded', 'true');
  renderTargets();
  if (!log.childElementCount) {
    writeLog('NETRUNNER OS online. Select a target, then run a quickhack.', 'sys');
    writeLog('Breach three targets to unlock the classified one.', 'sys');
  }
  hudClose.focus();
}

function closeHud() {
  hud.hidden = true;
  hudToggle.setAttribute('aria-expanded', 'false');
  hudToggle.focus();
}

hudToggle.addEventListener('click', openHud);
hudClose.addEventListener('click', closeHud);

// Keyboard: Q opens or closes the HUD, Escape closes it.
document.addEventListener('keydown', (event) => {
  const typing = ['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName);
  if ((event.key === 'q' || event.key === 'Q') && !typing) {
    event.preventDefault();
    if (hud.hidden) openHud();
    else closeHud();
  } else if (event.key === 'Escape' && !hud.hidden) {
    closeHud();
  }
});

renderTargets();
updateRam();
