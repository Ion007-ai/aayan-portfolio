// ---- Netrunner buddy: a cool V-inspired character who patrols the bottom-left corner ----
// Drawn with the canvas as clean, lean pixel-style shapes, not a fixed sprite grid.
// Sizes are in canvas pixels. Feet sit on the ground line at FEET_Y.
const W = 110;
const H = 120;
const FEET_Y = H - 8;
const CX = W / 2;

const C = {
  hair: '#14141b',
  hairHi: '#00e5ff',
  skin: '#c98f66',
  eye: '#00e5ff',
  star: '#fcee0a',
  jacket: '#1a1a22',
  jacketEdge: '#2e2e3a',
  trim: '#fcee0a',
  pants: '#26262f',
  boot: '#0c0c10',
  cyber: '#a4adb8',
  cyberLine: '#00e5ff',
  crate: '#3d2f20',
  paper: '#f4f1e8',
  laptop: '#3a3a46',
  screen: '#06060a',
  screenCyan: '#00e5ff',
  screenYellow: '#fcee0a',
  handheld: '#222230',
};

// Patrol actions in order. Each runs for its duration, then the next one starts.
const ACTIONS = [
  { name: 'walk', dur: 3500 },
  { name: 'jump', dur: 1000 },
  { name: 'walk', dur: 2500 },
  { name: 'slide', dur: 1000 },
  { name: 'walk', dur: 2000 },
  { name: 'code', dur: 5000 },
  { name: 'walk', dur: 1500 },
  { name: 'read', dur: 4500 },
  { name: 'walk', dur: 1500 },
  { name: 'play', dur: 4500 },
  { name: 'walk', dur: 1500 },
];

const LINES = {
  hello: 'Wake up, samurai. Welcome to my portfolio!',
  projects: 'Blimey, look at those projects! Proper cracking stuff.',
  skills: 'Respect. Still learning, but the skills are growing.',
  jump: 'Hup! Mind the gap, choom.',
  slide: 'Slide in, nobody stops me.',
  code: 'Compiling... let us see if it breaks.',
  read: 'Reading up on AI. Nerd mode: on.',
  play: 'Round one. Let us go, choom!',
  hover: 'Press Q. The netrunner interface is waiting.',
  stunt: 'Hup! Stunt double? Nah, that was me.',
};

const buddy = document.getElementById('pixel-buddy');
const canvas = buddy.querySelector('canvas');
const ctx = canvas.getContext('2d');
const bubble = buddy.querySelector('.bubble');

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const WALK_SPEED = 55; // px per second

let zone = { min: 0, max: 0 };
let x = 0;
let dir = 1;
let actIdx = 0;
let actStart = performance.now();
let flipStart = -1;
let starstruck = false;
let hovering = false;
let bubbleTimer = null;
let last = performance.now();

function computeZone() {
  // Keep the patrol inside the left third of the screen, so it never covers the HUD on the right.
  const max = Math.max(0, Math.min(window.innerWidth * 0.34, 380) - W);
  zone = { min: 0, max };
  if (x > max) x = max;
}

function say(text, ms = 3200) {
  bubble.textContent = text;
  bubble.classList.add('show');
  clearTimeout(bubbleTimer);
  bubbleTimer = setTimeout(() => bubble.classList.remove('show'), ms);
}

// ---- drawing helpers ----
function rect(rx, ry, w, h, colour) {
  ctx.fillStyle = colour;
  ctx.fillRect(rx, ry, w, h);
}

// A limb hinged at (jx, jy), rotated by angle (radians), extending down by len.
function limb(jx, jy, angle, len, w, colour) {
  ctx.save();
  ctx.translate(jx, jy);
  ctx.rotate(angle);
  rect(-w / 2, 0, w, len, colour);
  ctx.restore();
}

function leg(hipX, hipY, thigh, bend) {
  const len = 22;
  const shin = 20;
  limb(hipX, hipY, thigh, len, 9, C.pants);
  const kneeX = hipX - Math.sin(thigh) * len;
  const kneeY = hipY + Math.cos(thigh) * len;
  const shinAngle = thigh + bend;
  ctx.save();
  ctx.translate(kneeX, kneeY);
  ctx.rotate(shinAngle);
  rect(-4, 0, 8, shin, C.pants);
  rect(-5, shin, 10, 5, C.boot);
  ctx.restore();
}

function arm(shX, shY, angle, elbow, colour, cyber) {
  const upper = 20;
  const fore = 18;
  limb(shX, shY, angle, upper, 7, colour);
  const elbowX = shX - Math.sin(angle) * upper;
  const elbowY = shY + Math.cos(angle) * upper;
  ctx.save();
  ctx.translate(elbowX, elbowY);
  ctx.rotate(angle + elbow);
  rect(-3, 0, 6, fore, cyber ? C.cyber : colour);
  if (cyber) rect(-1, 2, 2, fore - 4, C.cyberLine); // glowing cyber line down the forearm
  rect(-3.5, fore - 1, 7, 4, C.skin); // hand
  ctx.restore();
}

// Poses. u = progress through the current action (0 to 1). t = seconds.
function pose(name, u, t) {
  const p = { l1: 0, k1: 0, l2: 0, k2: 0, a1: 0.12, e1: 0.1, a2: 0.12, e2: 0.1, dy: 0, lift: 0, rot: 0, sit: false, prop: null };
  if (name === 'walk') {
    const s = Math.sin(t * 9);
    p.l1 = s * 0.55;
    p.l2 = -s * 0.55;
    p.k1 = Math.max(0, -s) * 0.9;
    p.k2 = Math.max(0, s) * 0.9;
    p.a1 = -s * 0.5;
    p.a2 = s * 0.5;
    p.e1 = 0.3;
    p.e2 = 0.3;
  } else if (name === 'jump') {
    p.lift = Math.sin(Math.min(1, u) * Math.PI) * 46;
    p.l1 = -0.5; p.k1 = 1.2;
    p.l2 = -0.2; p.k2 = 1.4;
    p.a1 = -2.7; p.e1 = -0.2;
    p.a2 = -2.5; p.e2 = -0.2;
  } else if (name === 'slide') {
    p.rot = 1.35; // lays the character flat, head forward
    p.l1 = 0.1; p.k1 = 0.2;
    p.l2 = 0.1; p.k2 = 0.2;
    p.a1 = 1.2; p.e1 = 0.2;
    p.a2 = 1.0; p.e2 = 0.3;
  } else {
    // Seated actions: sit on a crate, lower the body 18px
    p.sit = true;
    p.dy = 18;
    p.l1 = -Math.PI / 2; p.k1 = Math.PI / 2;
    p.l2 = -Math.PI / 2; p.k2 = Math.PI / 2;
    if (name === 'code') {
      p.prop = 'laptop';
      p.a1 = -1.0; p.e1 = -0.6;
      p.a2 = -1.1; p.e2 = -0.5;
    } else if (name === 'read') {
      p.prop = 'book';
      p.a1 = -1.3; p.e1 = -0.7;
      p.a2 = -1.3; p.e2 = -0.8;
    } else if (name === 'play') {
      p.prop = 'handheld';
      p.a1 = -0.9; p.e1 = -0.9;
      p.a2 = -0.9; p.e2 = -0.9;
    }
  }
  return p;
}

function drawCrate() {
  rect(-10, -30, 26, 30, C.crate);
  rect(-10, -16, 26, 3, C.trim); // hazard stripe
}

function drawProp(name, now) {
  if (name === 'laptop') {
    rect(12, -35, 26, 3, C.laptop);
    rect(14, -55, 20, 19, C.screen);
    // typing lines, animated
    const beat = Math.floor(now / 250);
    for (let i = 0; i < 3; i++) {
      const w = 6 + ((beat + i * 3) % 10);
      rect(16, -52 + i * 5, w, 2, i === 1 ? C.screenYellow : C.screenCyan);
    }
  } else if (name === 'book') {
    rect(14, -64, 18, 12, C.paper);
    rect(22, -64, 1, 12, '#888888');
    rect(16, -61, 5, 1, '#777777');
    rect(25, -57, 5, 1, '#777777');
  } else if (name === 'handheld') {
    rect(10, -40, 14, 8, C.handheld);
    const blink = Math.floor(performance.now() / 300) % 2;
    rect(12, -38, 10, 4, blink ? C.screenYellow : C.screenCyan);
  }
}

function drawFigure(p, now) {
  // legs first, so the torso covers the hips
  leg(-6, -48, p.l1, p.k1);
  leg(6, -48, p.l2, p.k2);

  // torso and jacket
  rect(-13, -76, 26, 30, C.jacket);
  rect(-13, -76, 26, 3, C.jacketEdge);
  rect(-1, -73, 2, 26, C.jacketEdge); // zip
  rect(-13, -60, 26, 2, C.trim);      // yellow trim
  rect(-9, -50, 18, 6, C.pants);      // waistband

  // arms: left arm is flesh-and-jacket, right arm is cyber
  arm(-12, -72, p.a1, p.e1, C.jacket, false);
  arm(12, -72, p.a2, p.e2, C.jacket, true);

  // neck and head
  rect(-4, -81, 8, 5, C.skin);
  rect(-8, -97, 16, 17, C.skin);
  // hair with a cyan streak and a side fringe
  rect(-9, -99, 18, 8, C.hair);
  rect(-9, -93, 4, 10, C.hair);
  rect(-6, -99, 5, 2, C.hairHi);
  // eyes: one natural, one cyber, or stars when starstruck
  if (p.star) {
    rect(2, -90, 2, 4, C.star);
    rect(1, -89, 4, 2, C.star);
  } else {
    rect(2, -89, 5, 2, C.eye);
  }
  // cyber implant line on the cheek
  rect(-7, -86, 1, 8, C.cyberLine);
  // mouth
  rect(-2, -83, 5, 1, '#5a3a2a');
}

function render(now) {
  const act = ACTIONS[actIdx];
  const u = Math.min(1, (now - actStart) / act.dur);
  const t = now / 1000;
  const p = pose(act.name, u, t);
  p.star = starstruck || hovering;

  ctx.clearRect(0, 0, W, H);
  ctx.save();
  ctx.translate(CX, FEET_Y - p.lift);

  // flip stunt on click overrides the jump lift
  if (flipStart >= 0) {
    const f = (now - flipStart) / 700;
    if (f >= 1) {
      flipStart = -1;
    } else {
      ctx.translate(0, -48);
      ctx.rotate(f * Math.PI * 2 * dir);
      ctx.translate(0, 48);
      ctx.translate(0, -Math.sin(f * Math.PI) * 60);
    }
  }

  ctx.scale(dir, 1);
  if (p.rot) {
    ctx.translate(0, -4);
    ctx.rotate(p.rot);
    ctx.translate(0, 4);
  }

  if (p.sit) drawCrate();

  ctx.save();
  ctx.translate(0, p.dy);
  drawFigure(p, now);
  ctx.restore();

  if (p.prop) drawProp(p.prop, now);

  ctx.restore();
}

// ---- behaviour ----
function nextAction(now) {
  actIdx = (actIdx + 1) % ACTIONS.length;
  actStart = now;
  const name = ACTIONS[actIdx].name;
  if (LINES[name] && name !== 'walk') say(LINES[name], 2600);
}

function loop(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;

  if (now - actStart >= ACTIONS[actIdx].dur) nextAction(now);
  const act = ACTIONS[actIdx];

  // move only during walk and slide, and always stay inside the patrol zone
  if (act.name === 'walk' || act.name === 'slide') {
    const speed = act.name === 'slide' ? 120 : WALK_SPEED;
    x += dir * speed * dt;
  }
  if (x <= zone.min) { x = zone.min; dir = 1; }
  if (x >= zone.max) { x = zone.max; dir = -1; }
  buddy.style.transform = `translate(${x}px, 0)`;

  render(now);
  requestAnimationFrame(loop);
}

// Starstruck when visitors reach the projects or skills sections.
const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    const id = entry.target.id;
    if (id !== 'projects' && id !== 'skills') return;
    starstruck = true;
    say(LINES[id], 3500);
    setTimeout(() => { starstruck = false; }, 3500);
  });
}, { threshold: 0.35 });
document.querySelectorAll('#projects, #skills').forEach((s) => observer.observe(s));

// Click for a flip stunt. Hovering shows a tip and a starstruck face.
canvas.addEventListener('click', () => {
  if (flipStart >= 0) return;
  flipStart = performance.now();
  say(LINES.stunt, 1600);
});
canvas.addEventListener('mouseenter', () => {
  hovering = true;
  say(LINES.hover, 2600);
});
canvas.addEventListener('mouseleave', () => { hovering = false; });

window.addEventListener('resize', computeZone);
computeZone();

if (reduceMotion) {
  // Keep the character still for visitors who prefer reduced motion
  render(performance.now());
} else {
  say(LINES.hello, 4200);
  requestAnimationFrame(loop);
}
