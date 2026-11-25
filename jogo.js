"use strict";
// ===== DADOS (trocar aqui quando tivermos a história real) =====
// DATA START
const COMMON = { o: "#3a2a55", s: "#f2c5a0", e: "#2b1d2b", k: "#2b2233", p: "#33384a" };
const CHARS = {
  ele: {
    nome: "[Nome dele]",
    intro: ["[Abertura da história dele: Lugar 1]"],
    pal: { h: "#b07a45", H: "#d49c5e", g: "#8a5a35", c: "#4a6288" },
    rows: [
      ".oHhHhHhHho.",
      ".ohhhhhhhho.",
      ".ohhhhhhhho.",
      ".ohssssssho.",
      ".osesssseso.",
      ".osssssssso.",
      ".ossgggssso.",
      "..osssssso..",
      ".occcccccco.",
      "occcccccccco",
      "osccccccccso",
      ".osccccccso.",
      "..oppppppo..",
      "..oppo.oppo.",
      "..oppo.oppo.",
      "..okko.okko.",
    ],
  },
  ela: {
    nome: "[Nome dela]",
    intro: ["[Abertura da história dela: Lugar 1]"],
    pal: { h: "#7a4a2b", H: "#a56a3c", w: "#f3e6cf", b: "#2b2233" },
    rows: [
      "...oooooo...",
      "..ohhhhhho..",
      ".ohhHhhhhho.",
      ".ohhhhhhhho.",
      ".ohssssssho.",
      ".ohsessesho.",
      ".ohssssssho.",
      ".ohhsssshho.",
      ".ohhwwwwhho.",
      "ohhwwbwwwhho",
      "oswwwwbwwwso",
      ".oswwwwwwso.",
      "..oppppppo..",
      "..oppo.oppo.",
      "..oppo.oppo.",
      "..okko.okko.",
    ],
  },
};
// Legenda: . grama  = caminho  T árvore  ~ água  H casa  S placa  * memória
const MAP = [
  "TTTTTTTTTTTTTTTTTTTT",
  "T..................T",
  "T..HHHH.......TT...T",
  "T..HHHH.......TT...T",
  "T..=.S.............T",
  "T..=...............T",
  "T..=...............T",
  "T..=======.........T",
  "T........=...~~~...T",
  "T........=...~~~...T",
  "T..TT....=.........T",
  "T..TT....=.........T",
  "T........=======...T",
  "T..............=...T",
  "T....*.........=...T",
  "T..............=...T",
  "T..~~~.........=...T",
  "T..~~~.........=...T",
  "T..............=...T",
  "T..............*...T",
  "T..................T",
  "TTTTTTTTTTTTTTTTTTTT",
];
const TEXTOS = {
  "5,4": ["[Placa do Lugar 1: nome do lugar real]"],
  "5,14": ["[Memória 1: texto sobre um momento de vocês]"],
  "15,19": ["[Memória 2: texto sobre um momento de vocês]"],
};
// DATA END

// ===== Configuração =====
const T = 16, VW = 160, VH = 240, SPEED = 56;
const SOLID = new Set(["T", "~", "H"]);
const MW = MAP[0].length, MH = MAP.length;
const $ = (id) => document.getElementById(id);
const ctx = $("c").getContext("2d");
ctx.imageSmoothingEnabled = false;

// ===== Sprites =====
function makeSprite(def) {
  const cv = document.createElement("canvas");
  cv.width = 12; cv.height = 16;
  const g = cv.getContext("2d");
  def.rows.forEach((row, y) => [...row].forEach((ch, x) => {
    const col = def.pal[ch] || COMMON[ch];
    if (col) { g.fillStyle = col; g.fillRect(x, y, 1, 1); }
  }));
  return cv;
}

// ===== Estado =====
const st = { sprite: null, x: 0, y: 0, face: 1, moving: false, t: 0, got: new Set(), total: 0, queue: [] };
const joy = { x: 0, y: 0 };
const keys = {};
for (const row of MAP) for (const ch of row) if (ch === "*") st.total++;

// ===== Diálogo =====
function say(lines) { st.queue = [...lines]; nextLine(); }
function nextLine() {
  const box = $("dialog");
  if (!st.queue.length) { box.hidden = true; return; }
  box.querySelector("p").textContent = st.queue.shift();
  box.hidden = false;
}
const talking = () => !$("dialog").hidden;

// ===== Colisão e movimento =====
function blocked(x, y) {
  return [[x - 4, y - 3], [x + 4, y - 3], [x - 4, y + 2], [x + 4, y + 2]].some(([px, py]) => {
    const ch = (MAP[Math.floor(py / T)] || "")[Math.floor(px / T)];
    return !ch || SOLID.has(ch);
  });
}
function update(dt) {
  st.t += dt;
  let dx = joy.x + (keys.right ? 1 : 0) - (keys.left ? 1 : 0);
  let dy = joy.y + (keys.down ? 1 : 0) - (keys.up ? 1 : 0);
  const len = Math.hypot(dx, dy);
  if (len > 1) { dx /= len; dy /= len; }
  st.moving = !talking() && len > 0.05;
  if (!st.moving) return;
  if (dx) st.face = dx > 0 ? 1 : -1;
  const nx = st.x + dx * SPEED * dt, ny = st.y + dy * SPEED * dt;
  if (!blocked(nx, st.y)) st.x = nx;
  if (!blocked(st.x, ny)) st.y = ny;
  const tx = Math.floor(st.x / T), ty = Math.floor(st.y / T), key = tx + "," + ty;
  if (MAP[ty][tx] === "*" && !st.got.has(key)) {
    st.got.add(key);
    hud();
    say(["Você encontrou uma memória! 💛", ...TEXTOS[key]]);
  }
}
function interact() {
  if (talking()) return nextLine();
  for (const key in TEXTOS) {
    const [tx, ty] = key.split(",").map(Number);
    if (MAP[ty][tx] !== "S") continue;
    if (Math.hypot(tx * T + 8 - st.x, ty * T + 8 - st.y) < 24) return say(TEXTOS[key]);
  }
}
const hud = () => { $("hud").textContent = "♥ " + st.got.size + "/" + st.total; };

// ===== Desenho =====
function rect(c, x, y, w, h) { ctx.fillStyle = c; ctx.fillRect(x, y, w, h); }
function tile(ch, tx, ty, x, y) {
  rect(ch === "=" ? "#f0dcb0" : "#9fd8a8", x, y, T, T);
  if (ch !== "=" && (tx * 7 + ty * 13) % 5 === 0) { rect("#85c692", x + 4, y + 6, 2, 2); rect("#85c692", x + 10, y + 11, 2, 2); }
  if (ch === "T") { rect("#8a5a35", x + 6, y + 10, 4, 6); rect("#4f9a6a", x + 2, y + 2, 12, 9); rect("#4f9a6a", x + 4, y, 8, 12); rect("#6bb585", x + 4, y + 2, 4, 3); }
  else if (ch === "~") { rect("#8fc4ee", x, y, T, T); if ((tx + ty + Math.floor(st.t * 2)) % 2 === 0) rect("#c4e4fa", x + 3, y + 7, 6, 1); }
  else if (ch === "H") {
    if ((MAP[ty - 1] || "")[tx] !== "H") { rect("#c9706f", x, y, T, T); rect("#a85a5d", x, y + 12, T, 4); }
    else { rect("#fff1e0", x, y, T, T); rect("#8fc4ee", x + 4, y + 4, 8, 7); }
  }
  else if (ch === "S") { rect("#8a5a35", x + 7, y + 8, 2, 8); rect("#d9a86a", x + 2, y + 2, 12, 8); rect("#8a5a35", x + 4, y + 4, 8, 1); rect("#8a5a35", x + 4, y + 6, 6, 1); }
  else if (ch === "*" && !st.got.has(tx + "," + ty)) {
    const by = y + 2 + Math.round(Math.sin(st.t * 4) * 1.5);
    rect("#f27a93", x + 3, by + 3, 3, 2); rect("#f27a93", x + 10, by + 3, 3, 2);
    rect("#f27a93", x + 2, by + 4, 5, 3); rect("#f27a93", x + 9, by + 4, 5, 3);
    rect("#f27a93", x + 3, by + 7, 10, 2); rect("#f27a93", x + 5, by + 9, 6, 1); rect("#f27a93", x + 7, by + 10, 2, 1);
    rect("#ffd0da", x + 4, by + 4, 2, 1);
  }
}
function draw() {
  const camX = Math.round(Math.max(0, Math.min(MW * T - VW, st.x - VW / 2)));
  const camY = Math.round(Math.max(0, Math.min(MH * T - VH, st.y - VH / 2)));
  rect("#3a2a55", 0, 0, VW, VH);
  for (let ty = Math.floor(camY / T); ty <= Math.floor((camY + VH) / T); ty++)
    for (let tx = Math.floor(camX / T); tx <= Math.floor((camX + VW) / T); tx++)
      if (MAP[ty] && MAP[ty][tx]) tile(MAP[ty][tx], tx, ty, tx * T - camX, ty * T - camY);
  const px = Math.round(st.x - camX), py = Math.round(st.y - camY);
  const bob = st.moving && Math.floor(st.t * 8) % 2 ? -1 : 0;
  rect("rgba(58,42,85,.25)", px - 5, py - 1, 10, 3);
  ctx.save();
  ctx.translate(px, py - 14 + bob);
  if (st.face < 0) ctx.scale(-1, 1);
  ctx.drawImage(st.sprite, -6, 0);
  ctx.restore();
}

// ===== Loop =====
let last = 0;
function loop(now) {
  const dt = Math.min(0.05, (now - last) / 1000 || 0);
  last = now;
  update(dt);
  draw();
  requestAnimationFrame(loop);
}

// ===== Entradas =====
const stick = $("stick"), knob = $("knob");
let stickId = null;
function stickMove(e) {
  const r = stick.getBoundingClientRect();
  let dx = (e.clientX - (r.left + r.width / 2)) / (r.width / 2);
  let dy = (e.clientY - (r.top + r.height / 2)) / (r.height / 2);
  const l = Math.hypot(dx, dy);
  if (l > 1) { dx /= l; dy /= l; }
  knob.style.transform = "translate(" + dx * 38 + "px," + dy * 38 + "px)";
  joy.x = l < 0.2 ? 0 : dx; joy.y = l < 0.2 ? 0 : dy;
}
function stickEnd() { stickId = null; joy.x = joy.y = 0; knob.style.transform = ""; }
stick.addEventListener("pointerdown", (e) => { stickId = e.pointerId; stick.setPointerCapture(e.pointerId); stickMove(e); });
stick.addEventListener("pointermove", (e) => { if (e.pointerId === stickId) stickMove(e); });
stick.addEventListener("pointerup", stickEnd);
stick.addEventListener("pointercancel", stickEnd);
$("act").addEventListener("pointerdown", (e) => { e.preventDefault(); interact(); });
$("dialog").addEventListener("pointerdown", nextLine);

const KEYMAP = { ArrowLeft: "left", a: "left", ArrowRight: "right", d: "right", ArrowUp: "up", w: "up", ArrowDown: "down", s: "down" };
addEventListener("keydown", (e) => {
  if (KEYMAP[e.key]) { keys[KEYMAP[e.key]] = true; e.preventDefault(); }
  else if ([" ", "Enter", "e"].includes(e.key) && !e.repeat) { interact(); e.preventDefault(); }
});
addEventListener("keyup", (e) => { if (KEYMAP[e.key]) keys[KEYMAP[e.key]] = false; });

// ===== Início =====
function start(id) {
  const def = CHARS[id];
  st.sprite = makeSprite(def);
  st.x = 3 * T + 8; st.y = 5 * T + 8;
  $("select").hidden = true;
  $("game").hidden = false;
  hud();
  say(def.intro);
  requestAnimationFrame(loop);
}
for (const id in CHARS) {
  const b = document.createElement("button");
  b.className = "card"; b.type = "button";
  const cv = makeSprite(CHARS[id]);
  const label = document.createElement("span");
  label.textContent = CHARS[id].nome;
  b.append(cv, label);
  b.addEventListener("click", () => start(id));
  $("cards").append(b);
}
