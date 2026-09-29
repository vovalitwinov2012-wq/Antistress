/* Antistress v2 — 7 toys, 120Hz-ready, FullHD, pseudo-3D, RU/EN, themes. Single bundle, no deps. */
(() => {
'use strict';

/* ---------- helpers ---------- */
const TAU = Math.PI * 2;
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const lerp = (a, b, t) => a + (b - a) * t;
const rnd = (a, b) => { if (a === undefined) a = 0; if (b === undefined) b = 1; return a + Math.random() * (b - a); };
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const easeOut = t => 1 - Math.pow(1 - clamp(t, 0, 1), 3);
const easeBack = t => { t = clamp(t, 0, 1); const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); };
const $ = id => document.getElementById(id);
const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const hex2rgb = h => { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
const mixc = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const rgba = (c, a) => 'rgba(' + (c[0] | 0) + ',' + (c[1] | 0) + ',' + (c[2] | 0) + ',' + (a === undefined ? 1 : a) + ')';
const WHITE = [255, 255, 255], INK = [38, 10, 84];
function tone(hex) { const b = hex2rgb(hex); return { hex, base: b, hi: mixc(b, WHITE, .62), hi2: mixc(b, WHITE, .28), lo: mixc(b, INK, .3), deep: mixc(b, INK, .6) }; }
const TOYS = ['#ff4d6d', '#ff9236', '#ffd43b', '#34d986', '#3aa8ff', '#a15cff'].map(tone);
function mkCanvas(w, h) { const c = document.createElement('canvas'); c.width = Math.max(2, Math.ceil(w)); c.height = Math.max(2, Math.ceil(h)); return c; }
function rr(g, x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
function rng(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function vibrate(ms) { try { if (navigator.vibrate) navigator.vibrate(ms); } catch (e) { /* ignore */ } }

/* ---------- persistent settings ---------- */
const store = { theme: 'sunset', lang: 'ru', muted: false };
try {
  const raw = localStorage.getItem('antistress-v2');
  if (raw) { const s = JSON.parse(raw); if (s.theme) store.theme = s.theme; if (s.lang) store.lang = s.lang; if (typeof s.muted === 'boolean') store.muted = s.muted; }
  else { const nav = (navigator.language || 'ru').toLowerCase(); store.lang = nav.indexOf('en') === 0 ? 'en' : 'ru'; }
} catch (e) { /* ignore */ }
function saveStore() { try { localStorage.setItem('antistress-v2', JSON.stringify(store)); } catch (e) { /* ignore */ } }
let lang = store.lang === 'en' ? 'en' : 'ru';
let themeName = (store.theme === 'ocean' || store.theme === 'neon') ? store.theme : 'sunset';

/* ---------- i18n ---------- */
const STR = {
  ru: {
    dock: { pop: 'Поп-ит', wrap: 'Пупырка', bubbles: 'Пузыри', slime: 'Слайм', soap: 'Мыло', ball: 'Шарики', sand: 'Песок' },
    chips: ['Радуга', 'Сердце', 'Круг'],
    hints: {
      pop: 'Нажимай на пупырышки — можно водить пальцем',
      wrap: 'Води пальцем по плёнке — пузырьки лопаются',
      bubbles: 'Лопай пузыри. Коснись пустого места — выдуешь новые',
      slime: 'Тяни слайм, жми на пузырьки внутри',
      soap: 'Веди вниз через брусок — режешь кубики мыла',
      ball: 'Держи на пустом месте — надуешь шар. Тап — лопнешь',
      sand: 'Грейби песок пальцем. Двойной тап — холмик'
    },
    reset: { pop: 'Перевернуть всё обратно', wrap: 'Достать новую плёнку', bubbles: 'Выдуть ещё пузырей', slime: 'Новый слайм', soap: 'Новый брусок мыла', ball: 'Выпустить ещё шаров', sand: 'Разровнять песок' },
    donePop: 'Всё нажато — переворачиваю обратно',
    doneWrap: 'Плёнка закончилась — достаю новую',
    themeName: { sunset: 'Закат', ocean: 'Океан', neon: 'Неон' }
  },
  en: {
    dock: { pop: 'Pop-it', wrap: 'Wrap', bubbles: 'Bubbles', slime: 'Slime', soap: 'Soap', ball: 'Balloons', sand: 'Sand' },
    chips: ['Rainbow', 'Heart', 'Circle'],
    hints: {
      pop: 'Press the bubbles — you can slide your finger',
      wrap: 'Slide over the film — pop the wrap',
      bubbles: 'Pop bubbles. Tap empty space to blow new ones',
      slime: 'Stretch the slime, pop inner bubbles',
      soap: 'Swipe down through the bar to cut soap cubes',
      ball: 'Hold empty space to inflate. Tap to pop',
      sand: 'Rake the sand. Double-tap makes a mound'
    },
    reset: { pop: 'Flip everything back', wrap: 'Get new film', bubbles: 'Blow more bubbles', slime: 'Fresh slime', soap: 'New soap bar', ball: 'Release more balloons', sand: 'Level the sand' },
    donePop: 'All pressed — flipping back',
    doneWrap: 'Film is done — getting a new one',
    themeName: { sunset: 'Sunset', ocean: 'Ocean', neon: 'Neon' }
  }
};
const hintFor = m => STR[lang].hints[m];
const resetFor = m => STR[lang].reset[m];

/* ---------- audio: all synthesized ---------- */
const Snd = (() => {
  let ac = null, master = null, comp = null, rev = null, revIn = null, noise = null;
  let voices = 0, muted = store.muted, padG = null, padWant = false;
  function impulse(dur, decay) {
    const n = (ac.sampleRate * dur) | 0, b = ac.createBuffer(2, n, ac.sampleRate);
    for (let ch = 0; ch < 2; ch++) { const d = b.getChannelData(ch); for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, decay); }
    return b;
  }
  function init() {
    if (!ac) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      try { ac = new AC({ latencyHint: 'interactive' }); } catch (e) { try { ac = new AC(); } catch (_) { return; } }
      master = ac.createGain(); master.gain.value = muted ? 0 : .9;
      comp = ac.createDynamicsCompressor();
      comp.threshold.value = -16; comp.knee.value = 18; comp.ratio.value = 5; comp.attack.value = .002; comp.release.value = .18;
      master.connect(comp); comp.connect(ac.destination);
      rev = ac.createConvolver(); rev.buffer = impulse(1.1, 2.8);
      revIn = ac.createGain(); revIn.gain.value = .22;
      rev.connect(revIn); revIn.connect(master);
      noise = ac.createBuffer(1, (ac.sampleRate * 1.6) | 0, ac.sampleRate);
      const d = noise.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      if (padWant) pad(true);
    }
    if (ac.state === 'suspended') ac.resume();
  }
  function route(node, wet, pan) {
    let out = node;
    if (pan && typeof ac.createStereoPanner === 'function') { const p = ac.createStereoPanner(); p.pan.value = clamp(pan, -1, 1); node.connect(p); out = p; }
    out.connect(master);
    if (wet > 0) { const w = ac.createGain(); w.gain.value = wet; out.connect(w); w.connect(rev); }
  }
  function osc(o) {
    const t = ac.currentTime + (o.t0 || 0), dur = o.dur || .1, att = o.att || .002;
    const s = ac.createOscillator(), g = ac.createGain();
    s.type = o.type || 'sine';
    s.frequency.setValueAtTime(o.f1, t);
    if (o.f2 && o.f2 !== o.f1) s.frequency.exponentialRampToValueAtTime(o.f2, t + Math.min(dur * .5, .09));
    g.gain.setValueAtTime(.0001, t);
    g.gain.exponentialRampToValueAtTime(o.peak || .4, t + att);
    g.gain.exponentialRampToValueAtTime(.0001, t + dur);
    s.connect(g); route(g, o.wet == null ? .15 : o.wet, o.pan);
    s.start(t); s.stop(t + dur + .03);
  }
  function hit(o) {
    const t = ac.currentTime + (o.t0 || 0), dur = o.dur || .02;
    const s = ac.createBufferSource(); s.buffer = noise;
    const f = ac.createBiquadFilter(); f.type = o.ftype || 'bandpass';
    f.frequency.setValueAtTime(o.fc || 2000, t);
    if (o.fc2) f.frequency.exponentialRampToValueAtTime(o.fc2, t + dur);
    f.Q.value = o.q || 1;
    const g = ac.createGain();
    g.gain.setValueAtTime(o.peak || .4, t);
    g.gain.exponentialRampToValueAtTime(.0001, t + dur);
    s.connect(f); f.connect(g); route(g, o.wet == null ? .1 : o.wet, o.pan);
    s.start(t, Math.random() * 1.1, dur + .04);
  }
  const can = () => ac && !muted && voices < 26;
  const use = ms => { voices++; setTimeout(() => voices--, ms); };
  function push(pitch, pan, vel) {
    if (!can()) return; use(160); pitch = pitch || 1; pan = pan || 0; vel = vel || 1;
    const p = pitch * rnd(.96, 1.04);
    osc({ f1: 640 * p, f2: 290 * p, dur: .12, peak: .75 * vel, att: .001, pan, wet: .18 });
    osc({ type: 'triangle', f1: 1380 * p, f2: 720 * p, dur: .05, peak: .22 * vel, att: .001, pan, wet: .1 });
    hit({ fc: 3400, q: .9, dur: .009, peak: .55 * vel, pan, wet: .05 });
    hit({ fc: 850 * p, q: 1.4, dur: .045, peak: .22 * vel, pan, wet: .2 });
    hit({ ftype: 'highpass', fc: 5200, dur: .006, peak: .16 * vel, pan, wet: 0 });
  }
  function back(pitch, pan, vel) {
    if (!can()) return; use(140); pitch = pitch || 1; pan = pan || 0; vel = vel || 1;
    const p = pitch * rnd(.96, 1.05);
    osc({ f1: 360 * p, f2: 560 * p, dur: .085, peak: .5 * vel, att: .001, pan, wet: .15 });
    osc({ type: 'triangle', f1: 900 * p, f2: 1150 * p, dur: .04, peak: .14 * vel, att: .001, pan, wet: .08 });
    hit({ fc: 2500, q: 1, dur: .008, peak: .35 * vel, pan, wet: .05 });
  }
  function wrapPop(pan) {
    if (!can()) return; use(300); pan = pan || 0;
    const k = rnd(.85, 1.2);
    hit({ ftype: 'highpass', fc: 1400 * k, q: .7, dur: .045, peak: .8, pan, wet: .08 });
    hit({ fc: 4300 * k, q: .8, dur: .022, peak: .6, pan, wet: .06 });
    osc({ f1: 230 * k, f2: 75, dur: .075, peak: .6, att: .001, pan, wet: .12 });
    osc({ type: 'triangle', f1: 1000 * k, f2: 520, dur: .035, peak: .13, pan, wet: .05 });
    const n = (2 + Math.random() * 3) | 0;
    for (let i = 0; i < n; i++) hit({ fc: rnd(2600, 7500), q: rnd(2, 5), dur: rnd(.006, .014), peak: rnd(.12, .3), t0: rnd(.012, .11), pan, wet: .05 });
  }
  function inflate(pan) {
    if (!can()) return; use(120); pan = pan || 0;
    hit({ fc: 1800, fc2: 3200, q: .8, dur: .06, peak: .09, pan, wet: .1 });
    osc({ f1: 500, f2: 900, dur: .05, peak: .05, att: .004, pan, wet: .1 });
  }
  function rustle() {
    if (!can()) return; use(400);
    hit({ fc: 3200, fc2: 6500, q: .6, dur: .35, peak: .1, wet: .15 });
    for (let i = 0; i < 6; i++) hit({ fc: rnd(3000, 7000), q: 3, dur: .01, peak: .12, t0: rnd(0, .3), wet: .1 });
  }
  function soapPop(size, pan) {
    if (!can()) return; use(500); size = size || 1; pan = pan || 0;
    const p = 1 / clamp(size, .5, 1.7);
    hit({ ftype: 'highpass', fc: 4200, dur: .014, peak: .42, pan, wet: .15 });
    hit({ fc: 6800 * Math.min(p, 1.4), q: 1.6, dur: .03, peak: .16, pan, wet: .25 });
    osc({ f1: 1500 * p, f2: 420 * p, dur: .07, peak: .22, att: .001, pan, wet: .4 });
    const n = (3 + Math.random() * 3) | 0;
    for (let i = 0; i < n; i++) osc({ f1: rnd(2200, 4600) * p, f2: rnd(1400, 2600) * p, dur: .025, peak: rnd(.03, .07), t0: rnd(.03, .22), pan, wet: .35, att: .001 });
  }
  function blow() {
    if (!can()) return; use(300);
    hit({ fc: 500, fc2: 1300, q: .7, dur: .3, peak: .12, wet: .3 });
    osc({ f1: 300, f2: 700, dur: .09, peak: .06, wet: .3, att: .01 });
  }
  function slimeGrab(pan) {
    if (!can()) return; use(120); pan = pan || 0;
    osc({ f1: 210, f2: 95, dur: .13, peak: .4, att: .004, pan, wet: .25 });
    hit({ fc: 700, fc2: 300, q: 1.2, dur: .09, peak: .2, pan, wet: .2 });
  }
  function slimeStretch(pan) {
    if (!can()) return; use(90); pan = pan || 0;
    hit({ fc: rnd(900, 1600), fc2: 2400, q: 2.2, dur: .05, peak: .1, pan, wet: .2 });
  }
  function slimePop(pan) {
    if (!can()) return; use(200); pan = pan || 0;
    const p = rnd(.9, 1.25);
    osc({ f1: 900 * p, f2: 300 * p, dur: .07, peak: .3, att: .001, pan, wet: .3 });
    hit({ fc: 3200, q: 1.4, dur: .015, peak: .35, pan, wet: .15 });
    hit({ ftype: 'highpass', fc: 5000, dur: .008, peak: .15, pan, wet: .1 });
  }
  function soapCut(pan) {
    if (!can()) return; use(260); pan = pan || 0;
    const k = rnd(.9, 1.15);
    hit({ fc: 1100 * k, q: 1.1, dur: .05, peak: .7, pan, wet: .12 });
    hit({ fc: 2400 * k, q: 1.6, dur: .03, peak: .5, pan, wet: .1 });
    hit({ fc: 4800 * k, q: 2, dur: .018, peak: .3, t0: .012, pan, wet: .08 });
    osc({ f1: 170 * k, f2: 70, dur: .09, peak: .5, att: .001, pan, wet: .15 });
    for (let i = 0; i < 3; i++) hit({ fc: rnd(3000, 6500), q: 3, dur: .008, peak: .18, t0: rnd(.02, .09), pan, wet: .06 });
  }
  function balloonSqueak(pan, up) {
    if (!can()) return; use(110); pan = pan || 0;
    const f = up ? rnd(700, 950) : rnd(500, 700);
    osc({ f1: f, f2: f * 1.5, dur: .08, peak: .07, att: .008, pan, wet: .25 });
    hit({ fc: 2500, fc2: 4200, q: 2.5, dur: .05, peak: .05, pan, wet: .2 });
  }
  function balloonPop(pan) {
    if (!can()) return; use(400); pan = pan || 0;
    hit({ ftype: 'highpass', fc: 900, dur: .06, peak: .95, pan, wet: .1 });
    osc({ f1: 320, f2: 45, dur: .2, peak: .85, att: .001, pan, wet: .15 });
    hit({ fc: 5200, q: 1, dur: .02, peak: .4, pan, wet: .08 });
    for (let i = 0; i < 4; i++) osc({ f1: rnd(1800, 3600), f2: rnd(900, 1800), dur: .02, peak: .06, t0: rnd(.02, .15), pan, wet: .3, att: .001 });
  }
  function sandStep() {
    if (!can()) return; use(70);
    hit({ ftype: 'lowpass', fc: 1100, q: .6, dur: .05, peak: .12, wet: .12 });
  }
  function chime() {
    if (!ac || muted) return;
    [523.25, 659.25, 783.99, 1046.5, 1318.5].forEach((f, i) => osc({ f1: f, dur: .9, peak: .16, att: .006, t0: i * .09, wet: .5 }));
  }
  function pad(on) {
    padWant = on;
    if (!ac) return;
    if (!padG) {
      padG = ac.createGain(); padG.gain.value = 0;
      const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 900; lp.Q.value = .4;
      const lfo = ac.createOscillator(), lg = ac.createGain();
      lfo.frequency.value = .07; lg.gain.value = 380; lfo.connect(lg); lg.connect(lp.frequency); lfo.start();
      const bus = ac.createGain(); bus.gain.value = .03;
      [130.81, 196, 261.63, 329.63, 392, 493.88].forEach((f, i) => {
        [-6, 6].forEach(det => {
          const o = ac.createOscillator(); o.type = i < 2 ? 'sine' : 'triangle';
          o.frequency.value = f; o.detune.value = det;
          const g = ac.createGain(); g.gain.value = .5 / (1 + i * .25);
          o.connect(g); g.connect(lp); o.start();
        });
      });
      lp.connect(bus); bus.connect(padG); route(padG, .5, 0);
    }
    padG.gain.cancelScheduledValues(ac.currentTime);
    padG.gain.setTargetAtTime(on ? 1 : 0, ac.currentTime, on ? 1.4 : .5);
  }
  function setMuted(m) { muted = m; store.muted = m; saveStore(); if (master) master.gain.setTargetAtTime(m ? 0 : .9, ac.currentTime, .05); }
  return { init, push, back, wrapPop, inflate, rustle, soapPop, blow, slimeGrab, slimeStretch, slimePop, soapCut, balloonSqueak, balloonPop, sandStep, chime, pad, setMuted, get muted() { return muted; } };
})();

/* ---------- canvas + themes + background ---------- */
const cv = $('c'), ctx = cv.getContext('2d');
let W = window.innerWidth, H = window.innerHeight, DPR = 1, vig = null, T = 0;
let mode = 'pop', shape = 'grid', modeT = 0;
const fx = [];
const pointers = new Map();

const THEMES = {
  sunset: { bg: ['#2a1470', '#7a2fc0', '#ff5fa8'], blobs: ['#ff5fa8', '#3aa8ff', '#ffd43b', '#34d986', '#a15cff', '#ff9236'] },
  ocean: { bg: ['#062a6b', '#0e7cc4', '#54e6c8'], blobs: ['#ffd43b', '#ff5fa8', '#a15cff', '#34d986', '#3aa8ff', '#ff9236'] },
  neon: { bg: ['#0c0630', '#3b0a6e', '#00c2ff'], blobs: ['#00e5ff', '#ff5fa8', '#b6ff3b', '#3aa8ff', '#ffd43b', '#ff9236'] }
};
const toRGB = t => ({ bg: t.bg.map(hex2rgb), blobs: t.blobs.map(hex2rgb) });
const THEME_RGB = { sunset: toRGB(THEMES.sunset), ocean: toRGB(THEMES.ocean), neon: toRGB(THEMES.neon) };
const cur = toRGB(THEMES[themeName] || THEMES.sunset);
function themeStep(dt) {
  const tg = THEME_RGB[themeName] || THEME_RGB.sunset, k = 1 - Math.exp(-dt * 2.8);
  for (let i = 0; i < 3; i++) cur.bg[i] = mixc(cur.bg[i], tg.bg[i], k);
  for (let i = 0; i < cur.blobs.length; i++) cur.blobs[i] = mixc(cur.blobs[i], tg.blobs[i], k);
}
const bokeh = Array.from({ length: 30 }, () => ({ x: Math.random(), y: Math.random(), r: rnd(10, 46), sp: rnd(.004, .016), ph: rnd(0, TAU), a: rnd(.05, .17) }));
const dotSprite = (() => {
  const c = mkCanvas(96, 96), g = c.getContext('2d');
  const gr = g.createRadialGradient(48, 48, 0, 48, 48, 48);
  gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(.55, 'rgba(255,255,255,.55)');
  gr.addColorStop(.8, 'rgba(255,255,255,.22)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 96, 96);
  return c;
})();
function drawBG(t) {
  const g = ctx.createLinearGradient(0, 0, W * .35, H);
  g.addColorStop(0, rgba(cur.bg[0])); g.addColorStop(.55, rgba(cur.bg[1])); g.addColorStop(1, rgba(cur.bg[2]));
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  const M = Math.max(W, H), sp = reduceMotion ? .25 : 1;
  for (let i = 0; i < cur.blobs.length; i++) {
    const a = t * .06 * sp * (1 + i * .13) + i * 1.7;
    const x = W * (.5 + .42 * Math.sin(a * 1.1 + i)), y = H * (.5 + .42 * Math.cos(a * .9 + i * 2.1));
    const r = M * (.34 + .08 * Math.sin(a * 1.7 + i));
    const rg = ctx.createRadialGradient(x, y, 0, x, y, r);
    rg.addColorStop(0, rgba(cur.blobs[i], .42)); rg.addColorStop(1, rgba(cur.blobs[i], 0));
    ctx.fillStyle = rg; ctx.fillRect(x - r, y - r, r * 2, r * 2);
  }
  for (const b of bokeh) {
    const y = (((b.y - t * b.sp * sp) % 1) + 1) % 1, x = b.x + Math.sin(t * .2 + b.ph) * .02;
    ctx.globalAlpha = b.a * (.6 + .4 * Math.sin(t * .8 + b.ph));
    const s = b.r * 2;
    ctx.drawImage(dotSprite, x * W - b.r, y * H - b.r, s, s);
  }
  ctx.globalAlpha = 1;
}
function drawVignette() { if (vig) { ctx.fillStyle = vig; ctx.fillRect(0, 0, W, H); } }

/* ---------- fx ---------- */
function updateFx(dt) {
  for (let i = fx.length - 1; i >= 0; i--) {
    const f = fx[i]; f.life += dt;
    if (f.life >= f.max) { fx.splice(i, 1); continue; }
    if (f.t === 'drop' || f.t === 'spark' || f.t === 'conf' || f.t === 'grain') {
      f.vy += f.g * dt; const dr = Math.max(0, 1 - f.drag * dt);
      f.vx *= dr; if (f.t === 'conf') f.vy *= dr;
      f.x += f.vx * dt; f.y += f.vy * dt;
      if (f.t === 'conf') f.rot += f.vr * dt;
    }
  }
  if (fx.length > 420) fx.splice(0, fx.length - 420);
}
function drawFx() {
  for (const f of fx) {
    const k = f.life / f.max;
    if (f.t === 'ring') {
      ctx.globalAlpha = (1 - k) * (f.a == null ? .6 : f.a);
      ctx.strokeStyle = f.css; ctx.lineWidth = lerp(f.lw, .4, k);
      ctx.beginPath(); ctx.arc(f.x, f.y, lerp(f.r0, f.r1, easeOut(k)), 0, TAU); ctx.stroke();
    } else if (f.t === 'drop' || f.t === 'spark' || f.t === 'grain') {
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = (1 - k) * .95; ctx.fillStyle = f.css;
      ctx.beginPath(); ctx.arc(f.x, f.y, Math.max(.4, f.size * (1 - k * .5)), 0, TAU); ctx.fill();
      ctx.globalCompositeOperation = 'source-over';
    } else if (f.t === 'conf') {
      ctx.save(); ctx.translate(f.x, f.y); ctx.rotate(f.rot);
      ctx.globalAlpha = k > .8 ? (1 - k) / .2 : 1; ctx.fillStyle = f.css;
      const w = f.size * Math.abs(Math.cos(f.life * f.fl));
      ctx.fillRect(-w / 2, -f.size * .3, Math.max(1, w), f.size * .6);
      ctx.restore();
    }
  }
  ctx.globalAlpha = 1;
}
function celebrate() {
  Snd.chime();
  for (let i = 0; i < 120; i++) {
    fx.push({ t: 'conf', x: W / 2 + rnd(-W * .3, W * .3), y: H * .38, vx: rnd(-280, 280), vy: rnd(-560, -140), g: 720, drag: .7, rot: rnd(0, TAU), vr: rnd(-9, 9), size: rnd(7, 14), fl: rnd(6, 14), css: TOYS[(Math.random() * 6) | 0].hex, life: 0, max: rnd(1.7, 2.8) });
  }
}
let toastTimer = 0;
function toast(msg, ms) {
  const el = $('toast'); el.textContent = msg; el.classList.add('show');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove('show'), ms || 2400);
}

/* ---------- 1. POP-IT ---------- */
function mkConvex(t, r, pad, S) {
  const size = (r + pad) * 2, c = mkCanvas(size * S, size * S), g = c.getContext('2d');
  g.scale(S, S); g.translate(size / 2, size / 2);
  g.save();
  g.shadowColor = 'rgba(50,10,100,.5)'; g.shadowBlur = r * .38 * S; g.shadowOffsetX = r * .1 * S; g.shadowOffsetY = r * .22 * S;
  g.fillStyle = rgba(t.lo, 1); g.beginPath(); g.arc(0, 0, r * 1.04, 0, TAU); g.fill();
  g.restore();
  let gr = g.createRadialGradient(-r * .34, -r * .4, r * .02, -r * .05, -r * .08, r * 1.05);
  gr.addColorStop(0, rgba(t.hi, 1)); gr.addColorStop(.28, rgba(t.hi2, 1)); gr.addColorStop(.62, rgba(t.base, 1)); gr.addColorStop(1, rgba(t.lo, 1));
  g.fillStyle = gr; g.beginPath(); g.arc(0, 0, r * .985, 0, TAU); g.fill();
  g.save(); g.beginPath(); g.arc(0, 0, r * .985, 0, TAU); g.clip();
  gr = g.createRadialGradient(-r * .22, -r * .26, r * .75, -r * .22, -r * .26, r * 1.36);
  gr.addColorStop(0, rgba(t.hi2, 0)); gr.addColorStop(.55, rgba(t.hi2, 0)); gr.addColorStop(.85, rgba(t.hi, .42)); gr.addColorStop(1, rgba(t.hi, 0));
  g.fillStyle = gr; g.fillRect(-r, -r, r * 2, r * 2);
  g.restore();
  g.save(); g.translate(-r * .36, -r * .42); g.rotate(-Math.PI / 4.5); g.scale(1, .62);
  gr = g.createRadialGradient(0, 0, 0, 0, 0, r * .38);
  gr.addColorStop(0, 'rgba(255,255,255,.95)'); gr.addColorStop(.45, 'rgba(255,255,255,.55)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr; g.beginPath(); g.arc(0, 0, r * .38, 0, TAU); g.fill(); g.restore();
  g.fillStyle = 'rgba(255,255,255,.92)'; g.beginPath(); g.arc(-r * .55, -r * .12, r * .06, 0, TAU); g.fill();
  g.strokeStyle = rgba(t.deep, .3); g.lineWidth = r * .035; g.beginPath(); g.arc(0, 0, r * .97, 0, TAU); g.stroke();
  return c;
}
function mkConcave(t, r, pad, S) {
  const size = (r + pad) * 2, c = mkCanvas(size * S, size * S), g = c.getContext('2d');
  g.scale(S, S); g.translate(size / 2, size / 2);
  g.fillStyle = rgba(t.base, 1); g.beginPath(); g.arc(0, 0, r * 1.04, 0, TAU); g.fill();
  let gr = g.createLinearGradient(-r * .3, -r * 1.04, r * .3, r * 1.04);
  gr.addColorStop(0, 'rgba(255,255,255,.28)'); gr.addColorStop(.3, 'rgba(255,255,255,0)'); gr.addColorStop(.7, 'rgba(40,0,90,0)'); gr.addColorStop(1, 'rgba(40,0,90,.22)');
  g.fillStyle = gr; g.beginPath(); g.arc(0, 0, r * 1.04, 0, TAU); g.fill();
  gr = g.createLinearGradient(-r * .8, -r * .9, r * .8, r * .95);
  gr.addColorStop(0, rgba(mixc(t.lo, INK, .3), 1)); gr.addColorStop(.35, rgba(t.lo, 1)); gr.addColorStop(.75, rgba(t.base, 1)); gr.addColorStop(1, rgba(t.hi2, 1));
  g.fillStyle = gr; g.beginPath(); g.arc(0, 0, r * .96, 0, TAU); g.fill();
  g.save(); g.beginPath(); g.arc(0, 0, r * .96, 0, TAU); g.clip();
  gr = g.createRadialGradient(r * .2, r * .24, r * .6, r * .2, r * .24, r * 1.36);
  gr.addColorStop(0, rgba(t.deep, 0)); gr.addColorStop(.55, rgba(t.deep, 0)); gr.addColorStop(.9, rgba(t.deep, .55)); gr.addColorStop(1, rgba(t.deep, .72));
  g.fillStyle = gr; g.fillRect(-r, -r, r * 2, r * 2);
  gr = g.createRadialGradient(-r * .16, -r * .2, r * .7, -r * .16, -r * .2, r * 1.3);
  gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(.6, 'rgba(255,255,255,0)'); gr.addColorStop(.88, 'rgba(255,255,255,.4)'); gr.addColorStop(1, 'rgba(255,255,255,.12)');
  g.fillStyle = gr; g.fillRect(-r, -r, r * 2, r * 2);
  gr = g.createRadialGradient(r * .18, r * .22, 0, r * .18, r * .22, r * .6);
  gr.addColorStop(0, rgba(t.hi, .24)); gr.addColorStop(1, rgba(t.hi, 0));
  g.fillStyle = gr; g.fillRect(-r, -r, r * 2, r * 2);
  g.restore();
  g.strokeStyle = rgba(t.deep, .4); g.lineWidth = r * .04; g.beginPath(); g.arc(0, 0, r * .965, 0, TAU); g.stroke();
  return c;
}
const Pop = {
  bubbles: [], r: 10, unit: 1, cx: 0, cy: 0, spr: null, trayImg: null, tx: 0, ty: 0, tw: 0, th: 0, pressed: 0, done: false, doneT: 0,
  build(keep) {
    const prev = keep ? this.bubbles.map(b => b.on) : [];
    const availW = W - 28, availH = H - 78 - 176, land = availW >= availH;
    const pts = [];
    if (shape === 'grid') {
      const cols = land ? 10 : 6, rows = land ? 6 : 10;
      for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) pts.push({ ux: i - (cols - 1) / 2, uy: j - (rows - 1) / 2, ci: land ? j : i });
    } else if (shape === 'heart') {
      const st = .26;
      for (let j = -7; j <= 7; j++) for (let i = -7; i <= 7; i++) {
        const X = i * st, Y = j * st + .08, a = X * X + Y * Y - 1;
        if (a * a * a - X * X * Y * Y * Y <= 0) pts.push({ ux: i, uy: -j, ci: 0 });
      }
    } else {
      const R = 4.15, map = [5, 4, 3, 2, 0];
      for (let j = -6; j <= 6; j++) for (let i = -8; i <= 8; i++) {
        const x = i + ((j & 1) ? .5 : 0), y = j * .866, d = Math.hypot(x, y);
        if (d <= R + 1e-6) pts.push({ ux: x, uy: y, ci: map[Math.min(4, Math.round(d / 1.04))] });
      }
    }
    let minx = 1e9, maxx = -1e9, miny = 1e9, maxy = -1e9;
    for (const q of pts) { minx = Math.min(minx, q.ux); maxx = Math.max(maxx, q.ux); miny = Math.min(miny, q.uy); maxy = Math.max(maxy, q.uy); }
    const bw = maxx - minx, bh = maxy - miny, mx = (minx + maxx) / 2, my = (miny + maxy) / 2;
    for (const q of pts) {
      q.pitch = (q.ux - minx) / (bw || 1);
      if (shape === 'heart') q.ci = clamp(Math.floor(((q.ux - minx) / (bw || 1) + (q.uy - miny) / (bh || 1)) / 2 * 6), 0, 5);
    }
    const unit = Math.min(availW / (bw + 2.1), availH / (bh + 2.1), 128);
    const cx = W / 2, cy = 78 + availH / 2;
    const same = prev.length === pts.length;
    this.bubbles = pts.map((q, i) => {
      const on = same && !!prev[i];
      return { x: cx + (q.ux - mx) * unit, y: cy + (q.uy - my) * unit, ci: q.ci, pitch: q.pitch, on, p: on ? 1 : 0, v: 0, relAt: 0, relSnd: false };
    });
    this.unit = unit; this.r = unit * .43; this.cx = cx; this.cy = cy;
    this.pressed = this.bubbles.filter(b => b.on).length;
    this.done = false;
    const pad = this.r * .6, S = DPR;
    this.spr = { size: (this.r + pad) * 2, convex: [], concave: [] };
    TOYS.forEach(t => { this.spr.convex.push(mkConvex(t, this.r, pad, S)); this.spr.concave.push(mkConcave(t, this.r, pad, S)); });
    this.buildTray(bw, bh);
  },
  buildTray(bw, bh) {
    const unit = this.unit, k = Math.max(.5, Math.min(DPR, 2) * .55);
    const tw = (bw + 2.6) * unit, th = (bh + 2.6) * unit, x0 = this.cx - tw / 2, y0 = this.cy - th / 2;
    const fw = Math.ceil(tw * k), fh = Math.ceil(th * k);
    const F = new Float32Array(fw * fh), R = unit * 1.9 * k, R2 = R * R;
    for (const b of this.bubbles) {
      const bx = (b.x - x0) * k, by = (b.y - y0) * k;
      const xa = Math.max(0, Math.floor(bx - R)), xb = Math.min(fw - 1, Math.ceil(bx + R));
      const ya = Math.max(0, Math.floor(by - R)), yb = Math.min(fh - 1, Math.ceil(by + R));
      for (let y = ya; y <= yb; y++) { const dy = y - by, row = y * fw; for (let x = xa; x <= xb; x++) { const dx = x - bx, d2 = dx * dx + dy * dy; if (d2 < R2) { const q = 1 - d2 / R2; F[row + x] += q * q; } } }
    }
    const mc = mkCanvas(fw, fh), mg = mc.getContext('2d'), img = mg.createImageData(mc.width, mc.height), D = img.data;
    const T0 = 1.27, LX = -.62, LY = -.78, W2 = mc.width;
    for (let y = 0; y < fh; y++) for (let x = 0; x < fw; x++) {
      const i = y * fw + x, f = F[i];
      if (f < T0 - .1) continue;
      const a = smooth(T0 - .03, T0 + .03, f);
      if (a <= 0) continue;
      const xl = x > 0 ? F[i - 1] : f, xr = x < fw - 1 ? F[i + 1] : f, yu = y > 0 ? F[i - fw] : f, yd = y < fh - 1 ? F[i + fw] : f;
      const gx = xr - xl, gy = yd - yu, gl = Math.hypot(gx, gy) + 1e-6;
      const facing = (-gx * LX - gy * LY) / gl;
      const sh = facing * (1 - smooth(T0, T0 + 1.1, f));
      let c = [247, 241, 255];
      c = sh > 0 ? mixc(c, WHITE, sh * .9) : mixc(c, [140, 100, 210], -sh * .7);
      c = mixc(c, [222, 200, 250], (x / fw + y / fh) * .2);
      c = mixc(c, [120, 80, 190], (1 - smooth(T0, T0 + .16, f)) * .45);
      const o = (y * W2 + x) * 4;
      D[o] = c[0]; D[o + 1] = c[1]; D[o + 2] = c[2]; D[o + 3] = a * 255;
    }
    mg.putImageData(img, 0, 0);
    const sp = unit * .7, S = Math.min(DPR, 2);
    const fc = mkCanvas((tw + 2 * sp) * S, (th + 2 * sp) * S), g = fc.getContext('2d');
    g.scale(S, S); g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high';
    g.shadowColor = 'rgba(24,0,70,.55)'; g.shadowBlur = unit * .5 * S; g.shadowOffsetY = unit * .2 * S;
    g.drawImage(mc, sp, sp, tw, th);
    this.trayImg = fc; this.tx = x0 - sp; this.ty = y0 - sp; this.tw = tw + 2 * sp; this.th = th + 2 * sp;
  },
  hit(x, y) {
    let best = null, bd = 1e9;
    for (const b of this.bubbles) { const d = (b.x - x) * (b.x - x) + (b.y - y) * (b.y - y); if (d < bd) { bd = d; best = b; } }
    const lim = this.r * 1.12;
    return bd <= lim * lim ? best : null;
  },
  set(b, state, snd) {
    if (snd === undefined) snd = true;
    if (b.on === state) return false;
    b.on = state; this.pressed += state ? 1 : -1;
    if (snd) {
      const pan = (b.x / W - .5) * .9, pitch = .82 + b.pitch * .46;
      if (state) Snd.push(pitch, pan); else Snd.back(pitch, pan);
      vibrate(state ? 7 : 4);
    }
    fx.push({ t: 'ring', x: b.x, y: b.y, r0: this.r * .85, r1: this.r * (state ? 1.8 : 1.4), life: 0, max: state ? .34 : .24, css: rgba(TOYS[b.ci].hi, 1), a: state ? .6 : .35, lw: 3 });
    if (state && this.pressed === this.bubbles.length && !this.done) {
      this.done = true; this.doneT = T + 2.8; celebrate();
      toast(STR[lang].donePop);
    }
    return true;
  },
  down(p) { const b = this.hit(p.x, p.y); if (b) { p.tgt = !b.on; this.set(b, p.tgt); } else p.tgt = null; },
  move(p) {
    if (p.tgt == null) return;
    const dx = p.x - p.px, dy = p.y - p.py, d = Math.hypot(dx, dy), n = Math.max(1, Math.ceil(d / (this.r * .5)));
    for (let i = 1; i <= n; i++) { const b = this.hit(p.px + dx * i / n, p.py + dy * i / n); if (b) this.set(b, p.tgt); }
  },
  up() {},
  reset() {
    this.done = false;
    const c = this.bubbles.filter(b => b.on);
    const dist = b => (b.x - this.cx) * (b.x - this.cx) + (b.y - this.cy) * (b.y - this.cy);
    c.sort((a, b) => dist(a) - dist(b));
    c.forEach((b, i) => { b.relAt = T + .04 + i * .016; b.relSnd = i % 2 === 0; });
  },
  update(dt) {
    const sub = Math.max(1, Math.ceil(dt / (1 / 120))), h = dt / sub;
    for (const b of this.bubbles) {
      if (b.relAt && T >= b.relAt) { b.relAt = 0; this.set(b, false, b.relSnd); }
      const tg = b.on ? 1 : 0;
      for (let s = 0; s < sub; s++) { const a = (tg - b.p) * 1100 - b.v * 40; b.v += a * h; b.p += b.v * h; }
    }
    if (this.done && T > this.doneT) { this.done = false; this.reset(); }
  },
  draw() {
    if (!this.trayImg) return;
    ctx.drawImage(this.trayImg, this.tx, this.ty, this.tw, this.th);
    const size = this.spr.size;
    for (const b of this.bubbles) {
      const img = b.p >= .5 ? this.spr.concave[b.ci] : this.spr.convex[b.ci];
      const sq = Math.sin(Math.PI * clamp(b.p, 0, 1)), sc = 1 - .13 * sq;
      ctx.save(); ctx.translate(b.x, b.y); ctx.scale(sc, sc);
      ctx.drawImage(img, -size / 2, -size / 2, size, size);
      ctx.restore();
    }
  },
  score() { return lang === 'en' ? ('Pressed ' + this.pressed + ' of ' + this.bubbles.length) : ('Нажато ' + this.pressed + ' из ' + this.bubbles.length); }
};

/* ---------- 2. WRAP ---------- */
function mkWrapIntact(r, S) {
  const pad = r * .4, size = (r + pad) * 2, c = mkCanvas(size * S, size * S), g = c.getContext('2d');
  g.scale(S, S); g.translate(size / 2, size / 2);
  g.save();
  g.shadowColor = 'rgba(15,0,70,.38)'; g.shadowBlur = r * .34 * S; g.shadowOffsetX = r * .08 * S; g.shadowOffsetY = r * .16 * S;
  g.fillStyle = '#000'; g.beginPath(); g.arc(0, 0, r, 0, TAU); g.fill();
  g.restore();
  g.save(); g.globalCompositeOperation = 'destination-out'; g.fillStyle = '#000'; g.beginPath(); g.arc(0, 0, r * .98, 0, TAU); g.fill(); g.restore();
  let gr = g.createRadialGradient(-r * .28, -r * .32, r * .05, 0, 0, r);
  gr.addColorStop(0, 'rgba(255,255,255,.42)'); gr.addColorStop(.3, 'rgba(255,255,255,.14)'); gr.addColorStop(.72, 'rgba(255,255,255,.05)');
  gr.addColorStop(.93, 'rgba(255,255,255,.2)'); gr.addColorStop(1, 'rgba(255,255,255,.34)');
  g.fillStyle = gr; g.beginPath(); g.arc(0, 0, r, 0, TAU); g.fill();
  g.save(); g.beginPath(); g.arc(0, 0, r, 0, TAU); g.clip();
  gr = g.createLinearGradient(-r, -r, r, r);
  gr.addColorStop(0, 'rgba(130,210,255,.22)'); gr.addColorStop(.5, 'rgba(255,255,255,0)'); gr.addColorStop(1, 'rgba(255,150,225,.26)');
  g.fillStyle = gr; g.fillRect(-r, -r, r * 2, r * 2);
  gr = g.createRadialGradient(-r * .2, -r * .24, r * .7, -r * .2, -r * .24, r * 1.34);
  gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(.55, 'rgba(255,255,255,0)'); gr.addColorStop(.86, 'rgba(210,245,255,.42)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr; g.fillRect(-r, -r, r * 2, r * 2);
  g.restore();
  g.save(); g.translate(-r * .38, -r * .43); g.rotate(-.62);
  gr = g.createLinearGradient(-r * .26, 0, r * .26, 0);
  gr.addColorStop(0, 'rgba(255,255,255,.95)'); gr.addColorStop(1, 'rgba(255,255,255,.3)');
  g.fillStyle = gr; rr(g, -r * .26, -r * .09, r * .52, r * .18, r * .09); g.fill(); g.restore();
  g.fillStyle = 'rgba(255,255,255,.85)'; g.beginPath(); g.arc(-r * .6, -r * .14, r * .05, 0, TAU); g.fill();
  g.strokeStyle = 'rgba(255,255,255,.6)'; g.lineWidth = r * .03; g.beginPath(); g.arc(0, 0, r * .975, 0, TAU); g.stroke();
  return c;
}
function mkWrapPopped(r, S, seed) {
  const pad = r * .4, size = (r + pad) * 2, c = mkCanvas(size * S, size * S), g = c.getContext('2d'), R = rng(seed);
  g.scale(S, S); g.translate(size / 2, size / 2);
  const n = 16, pts = [];
  for (let i = 0; i < n; i++) { const a = i / n * TAU, rad = r * (.88 + R() * .13); pts.push([Math.cos(a) * rad, Math.sin(a) * rad]); }
  const mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  g.beginPath();
  const m0 = mid(pts[n - 1], pts[0]); g.moveTo(m0[0], m0[1]);
  for (let i = 0; i < n; i++) { const m = mid(pts[i], pts[(i + 1) % n]); g.quadraticCurveTo(pts[i][0], pts[i][1], m[0], m[1]); }
  g.closePath();
  const gr = g.createRadialGradient(0, 0, 0, 0, 0, r);
  gr.addColorStop(0, 'rgba(255,255,255,.05)'); gr.addColorStop(1, 'rgba(255,255,255,.14)');
  g.fillStyle = gr; g.fill();
  g.strokeStyle = 'rgba(255,255,255,.42)'; g.lineWidth = 1.6; g.stroke();
  g.save(); g.clip();
  for (let i = 0; i < 8; i++) {
    const a = R() * TAU, l = r * (.35 + R() * .55);
    const x0 = Math.cos(a) * r * .85, y0 = Math.sin(a) * r * .85, a2 = a + Math.PI + (R() - .5) * 1.4;
    const x1 = x0 + Math.cos(a2) * l, y1 = y0 + Math.sin(a2) * l;
    const cx = (x0 + x1) / 2 + (R() - .5) * r * .5, cy = (y0 + y1) / 2 + (R() - .5) * r * .5;
    g.strokeStyle = i % 2 ? 'rgba(255,255,255,.45)' : 'rgba(30,10,90,.22)'; g.lineWidth = 1 + R() * 1.4;
    g.beginPath(); g.moveTo(x0, y0); g.quadraticCurveTo(cx, cy, x1, y1); g.stroke();
  }
  g.restore();
  g.fillStyle = 'rgba(255,255,255,.32)'; g.beginPath(); g.ellipse(-r * .25 + (R() - .5) * r * .3, -r * .28, r * .14, r * .06, -.6, 0, TAU); g.fill();
  return c;
}
const Wrap = {
  bubbles: [], r: 30, s: 60, spr: null, sheet: { x: 0, y: 0, w: 0, h: 0 }, popped: 0, done: false, doneT: 0,
  build(keep) {
    const prev = keep ? this.bubbles.map(b => b.popped) : [];
    const ax = 14, ay = 76, aw = W - 28, ah = H - 76 - 106;
    const s = clamp(Math.min(aw, ah) / 10.5, 48, 84), r = s * .44, dy = s * .866, mg = r + 10;
    const cols = Math.max(3, Math.floor((aw - 2 * mg - s / 2) / s) + 1), rows = Math.max(3, Math.floor((ah - 2 * mg) / dy) + 1);
    const gw = (cols - 1) * s + s / 2, gh = (rows - 1) * dy;
    const x0 = ax + (aw - gw) / 2, y0 = ay + (ah - gh) / 2;
    const list = [];
    for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
      const idx = list.length;
      list.push({ x: x0 + i * s + (j % 2 ? s / 2 : 0), y: y0 + j * dy, popped: false, popT: 0, refillAt: 0, inflT: -9, v: (idx * 7 + j) % 4 });
    }
    if (prev.length === list.length) list.forEach((b, i) => { b.popped = !!prev[i]; b.popT = -9; });
    this.bubbles = list; this.s = s; this.r = r;
    this.sheet = { x: ax, y: ay, w: aw, h: ah };
    this.popped = list.filter(b => b.popped).length; this.done = false;
    const S = DPR, pad = r * .4;
    this.spr = { size: (r + pad) * 2, intact: mkWrapIntact(r, S), popped: [1, 2, 3, 4].map(k => mkWrapPopped(r, S, k * 977)) };
  },
  pop(b) {
    if (b.popped || b.refillAt) return;
    b.popped = true; b.popT = T; this.popped++;
    Snd.wrapPop((b.x / W - .5) * .9);
    vibrate(8);
    fx.push({ t: 'ring', x: b.x, y: b.y, r0: this.r * .9, r1: this.r * 2, life: 0, max: .28, css: 'rgb(255,255,255)', a: .6, lw: 3 });
    for (let i = 0; i < 5; i++) { const a = rnd(0, TAU), v = rnd(60, 190); fx.push({ t: 'spark', x: b.x, y: b.y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, g: 200, drag: 3, size: rnd(1.2, 2.6), css: 'rgb(230,245,255)', life: 0, max: rnd(.25, .5) }); }
    if (this.popped === this.bubbles.length && !this.done) { this.done = true; this.doneT = T + 2.8; celebrate(); toast(STR[lang].doneWrap); }
  },
  sweep(x, y) {
    const lim = this.r * this.r * 1.15;
    for (const b of this.bubbles) {
      if (b.popped || b.refillAt) continue;
      const dx = b.x - x, dy = b.y - y;
      if (dx * dx + dy * dy <= lim) this.pop(b);
    }
  },
  down(p) { this.sweep(p.x, p.y); p.tgt = 1; },
  move(p) { const dx = p.x - p.px, dy = p.y - p.py, d = Math.hypot(dx, dy), n = Math.max(1, Math.ceil(d / (this.r * .6))); for (let i = 1; i <= n; i++) this.sweep(p.px + dx * i / n, p.py + dy * i / n); },
  up() {},
  reset() {
    this.done = false;
    let any = false;
    for (const b of this.bubbles) if (b.popped) { b.refillAt = T + .03 + Math.random() * .55; any = true; }
    if (any) Snd.rustle();
  },
  update() {
    for (const b of this.bubbles) {
      if (b.refillAt && T >= b.refillAt) { b.refillAt = 0; b.popped = false; b.inflT = T; this.popped--; if (Math.random() < .3) Snd.inflate((b.x / W - .5) * .9); }
    }
    if (this.done && T > this.doneT) { this.done = false; this.reset(); }
  },
  drawSheet() {
    const s = this.sheet;
    rr(ctx, s.x, s.y, s.w, s.h, 30);
    ctx.fillStyle = 'rgba(255,255,255,.10)'; ctx.fill();
    const g = ctx.createLinearGradient(s.x, s.y, s.x + s.w, s.y + s.h);
    g.addColorStop(0, 'rgba(255,255,255,.24)'); g.addColorStop(.35, 'rgba(255,255,255,.02)'); g.addColorStop(.62, 'rgba(255,255,255,.11)'); g.addColorStop(1, 'rgba(255,255,255,.02)');
    ctx.fillStyle = g; ctx.fill();
    ctx.save(); rr(ctx, s.x, s.y, s.w, s.h, 30); ctx.clip();
    const bx = s.x - 260 + ((T * 38) % (s.w + 520));
    const bg = ctx.createLinearGradient(bx - 120, s.y, bx + 120, s.y + s.h * .4);
    bg.addColorStop(0, 'rgba(255,255,255,0)'); bg.addColorStop(.5, 'rgba(255,255,255,.10)'); bg.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = bg; ctx.fillRect(s.x, s.y, s.w, s.h);
    ctx.restore();
    rr(ctx, s.x, s.y, s.w, s.h, 30);
    ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(255,255,255,.44)'; ctx.stroke();
  },
  draw() {
    this.drawSheet();
    const spr = this.spr, size = spr.size;
    for (const b of this.bubbles) {
      if (b.popped) {
        const t = T - b.popT;
        if (t < .14) { const k = t / .14, sc = 1 - .45 * k; ctx.globalAlpha = 1 - k; ctx.save(); ctx.translate(b.x, b.y); ctx.scale(sc, sc); ctx.drawImage(spr.intact, -size / 2, -size / 2, size, size); ctx.restore(); ctx.globalAlpha = 1; }
        if (t < .1) { ctx.fillStyle = 'rgba(255,255,255,' + (.6 * (1 - t / .1)).toFixed(3) + ')'; ctx.beginPath(); ctx.arc(b.x, b.y, this.r * 1.08, 0, TAU); ctx.fill(); }
        const s2 = 1.1 - .1 * easeOut(t / .3);
        ctx.globalAlpha = smooth(0, .16, t);
        ctx.save(); ctx.translate(b.x, b.y); ctx.scale(s2, s2);
        ctx.drawImage(spr.popped[b.v], -size / 2, -size / 2, size, size); ctx.restore();
        ctx.globalAlpha = 1;
      } else {
        const t = T - b.inflT;
        if (t < .3) { const sc = .5 + .5 * easeBack(t / .3); ctx.globalAlpha = smooth(0, .1, t); ctx.save(); ctx.translate(b.x, b.y); ctx.scale(sc, sc); ctx.drawImage(spr.intact, -size / 2, -size / 2, size, size); ctx.restore(); ctx.globalAlpha = 1; }
        else ctx.drawImage(spr.intact, b.x - size / 2, b.y - size / 2, size, size);
      }
    }
  },
  score() { return lang === 'en' ? ('Popped ' + this.popped + ' of ' + this.bubbles.length) : ('Лопнуло ' + this.popped + ' из ' + this.bubbles.length); }
};

/* ---------- 3. SOAP BUBBLES ---------- */
function mkFilm(R, S, h0) {
  const size = R * 2.08, c = mkCanvas(size * S, size * S), g = c.getContext('2d');
  g.scale(S, S); g.translate(size / 2, size / 2);
  const hs = [0, 60, 130, 200, 260, 320, 360], st = [0, .16, .33, .5, .66, .83, 1];
  let gr;
  if (g.createConicGradient) gr = g.createConicGradient(h0 * Math.PI / 180, 0, 0);
  else gr = g.createLinearGradient(-R, -R, R, R);
  hs.forEach((h, i) => gr.addColorStop(st[i], 'hsla(' + ((h0 + h) % 360) + ',100%,70%,.9)'));
  g.fillStyle = gr; g.beginPath(); g.arc(0, 0, R, 0, TAU); g.fill();
  g.globalCompositeOperation = 'destination-in';
  gr = g.createRadialGradient(0, 0, 0, 0, 0, R);
  gr.addColorStop(0, 'rgba(0,0,0,.05)'); gr.addColorStop(.55, 'rgba(0,0,0,.10)'); gr.addColorStop(.75, 'rgba(0,0,0,.34)');
  gr.addColorStop(.9, 'rgba(0,0,0,.85)'); gr.addColorStop(.975, 'rgba(0,0,0,1)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = gr; g.beginPath(); g.arc(0, 0, R, 0, TAU); g.fill();
  g.globalCompositeOperation = 'source-over';
  gr = g.createRadialGradient(0, 0, R * .5, 0, 0, R * .8);
  gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(.5, 'hsla(' + ((h0 + 180) % 360) + ',100%,75%,.22)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr; g.beginPath(); g.arc(0, 0, R * .8, 0, TAU); g.fill();
  gr = g.createRadialGradient(0, 0, R * .3, 0, 0, R);
  gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(.8, 'rgba(255,255,255,.05)'); gr.addColorStop(1, 'rgba(255,255,255,.22)');
  g.fillStyle = gr; g.beginPath(); g.arc(0, 0, R, 0, TAU); g.fill();
  g.strokeStyle = 'rgba(255,255,255,.55)'; g.lineWidth = R * .028; g.beginPath(); g.arc(0, 0, R * .975, 0, TAU); g.stroke();
  return c;
}
function mkHi(R, S) {
  const size = R * 2.08, c = mkCanvas(size * S, size * S), g = c.getContext('2d');
  g.scale(S, S); g.translate(size / 2, size / 2);
  g.save(); g.beginPath(); g.arc(0, 0, R, 0, TAU); g.clip();
  let gr = g.createRadialGradient(-R * .2, -R * .24, R * .7, -R * .2, -R * .24, R * 1.3);
  gr.addColorStop(0, 'rgba(140,230,255,0)'); gr.addColorStop(.5, 'rgba(140,230,255,0)'); gr.addColorStop(.88, 'rgba(255,170,240,.36)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr; g.fillRect(-R, -R, R * 2, R * 2);
  g.restore();
  g.save(); g.translate(-R * .4, -R * .45); g.rotate(-.62);
  gr = g.createLinearGradient(-R * .26, 0, R * .26, 0);
  gr.addColorStop(0, 'rgba(255,255,255,.96)'); gr.addColorStop(1, 'rgba(255,255,255,.34)');
  g.fillStyle = gr; rr(g, -R * .26, -R * .085, R * .52, R * .17, R * .085); g.fill(); g.restore();
  g.fillStyle = 'rgba(255,255,255,.86)'; g.beginPath(); g.arc(-R * .6, -R * .16, R * .045, 0, TAU); g.fill();
  g.save(); g.lineCap = 'round'; g.lineWidth = R * .07;
  gr = g.createLinearGradient(R * .5, 0, R * .15, R * .7);
  gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(.5, 'rgba(210,245,255,.65)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.strokeStyle = gr; g.beginPath(); g.arc(0, 0, R * .8, .25, 1.25); g.stroke(); g.restore();
  return c;
}
const Soap = {
  list: [], film: [], hi: null, sc: 1, spawnT: 0, popped: 0, lastBlow: 0, R: 100,
  build() {
    this.sc = clamp(Math.min(W, H) / 820, .62, 1.4);
    const S = Math.min(DPR, 2.5);
    this.film = [0, 1, 2, 3, 4, 5].map(i => mkFilm(this.R, S, i * 60));
    this.hi = mkHi(this.R, S);
    if (!this.list.length) for (let i = 0; i < 20; i++) this.spawn(rnd(0, W), rnd(H * .1, H * .95), 0, 0, rnd(20, 62) * this.sc, false);
  },
  spawn(x, y, vx, vy, R, grow) {
    this.list.push({ x, y, vx, vy, R, r: grow ? R * .2 : R, born: T, grow: !!grow, ph: rnd(0, TAU), sp: rnd(.6, 1.3), rot: rnd(0, TAU), rotV: rnd(-.5, .5), film: (Math.random() * 6) | 0, rise: rnd(22, 55) * this.sc });
  },
  hit(x, y) {
    for (let i = this.list.length - 1; i >= 0; i--) { const b = this.list[i], dx = b.x - x, dy = b.y - y, lim = b.r * 1.03; if (dx * dx + dy * dy <= lim * lim) return i; }
    return -1;
  },
  pop(i) {
    const b = this.list[i]; this.list.splice(i, 1); this.popped++;
    Snd.soapPop(b.r / (60 * this.sc), (b.x / W - .5) * .9);
    vibrate(5);
    const hue = (b.film * 60 + 40) % 360;
    fx.push({ t: 'ring', x: b.x, y: b.y, r0: b.r, r1: b.r * 1.38, life: 0, max: .3, css: 'hsl(' + hue + ',100%,80%)', a: .8, lw: 4 });
    fx.push({ t: 'ring', x: b.x, y: b.y, r0: b.r * .8, r1: b.r * 1.15, life: 0, max: .22, css: 'rgb(255,255,255)', a: .5, lw: 1.5 });
    const n = 10 + Math.round(b.r / 7);
    for (let k = 0; k < n; k++) { const a = rnd(0, TAU), v = rnd(60, 230); fx.push({ t: 'drop', x: b.x + Math.cos(a) * b.r, y: b.y + Math.sin(a) * b.r, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 30, g: 160, drag: 2.2, size: rnd(1.4, 3.6), css: 'hsl(' + (((hue + rnd(-70, 70)) % 360 + 360) % 360) + ',100%,82%)', life: 0, max: rnd(.35, .85) }); }
  },
  blowAt(x, y, n) {
    for (let i = 0; i < n && this.list.length < 70; i++) this.spawn(x + rnd(-18, 18), y + rnd(-18, 18), rnd(-90, 90), rnd(-130, -30), rnd(16, 52) * this.sc, true);
    if (T - this.lastBlow > .25) { this.lastBlow = T; Snd.blow(); }
  },
  down(p) { const i = this.hit(p.x, p.y); if (i >= 0) { p.tgt = 'pop'; this.pop(i); } else { p.tgt = 'blow'; p.acc = 0; this.blowAt(p.x, p.y, 4); } },
  move(p) {
    if (p.tgt === 'pop') {
      const dx = p.x - p.px, dy = p.y - p.py, d = Math.hypot(dx, dy), n = Math.max(1, Math.ceil(d / 14));
      for (let k = 1; k <= n; k++) { const i = this.hit(p.px + dx * k / n, p.py + dy * k / n); if (i >= 0) this.pop(i); }
    } else if (p.tgt === 'blow') {
      const dx = p.x - p.px, dy = p.y - p.py, d = Math.hypot(dx, dy);
      p.acc = (p.acc || 0) + d;
      if (p.acc > 60) { p.acc = 0; this.blowAt(p.x, p.y, 1 + ((Math.random() * 2) | 0)); }
      for (const b of this.list) { const ex = b.x - p.x, ey = b.y - p.y, dd = Math.hypot(ex, ey), lim = b.r + 90; if (dd < lim && dd > 1) { const k = (1 - dd / lim) * d * .35; b.vx += ex / dd * k; b.vy += ey / dd * k; } }
    }
  },
  up() {},
  reset() { for (let i = 0; i < 14; i++) this.spawn(rnd(.05, .95) * W, H + 40, rnd(-30, 30), rnd(-140, -60), rnd(20, 60) * this.sc, true); Snd.blow(); },
  update(dt) {
    this.spawnT -= dt;
    if (this.spawnT <= 0 && this.list.length < 52) { this.spawnT = rnd(.35, .9); const R = rnd(20, 64) * this.sc; this.spawn(rnd(.04, .96) * W, H + R * 1.2, 0, 0, R, false); }
    const L = this.list;
    for (let i = L.length - 1; i >= 0; i--) {
      const b = L[i];
      b.ph += dt * b.sp; b.rot += b.rotV * dt;
      if (b.grow) { b.r = lerp(b.r, b.R, 1 - Math.exp(-dt * 7)); if (b.r > b.R * .99) { b.r = b.R; b.grow = false; } }
      b.vy += (-b.rise - b.vy) * dt * .6;
      b.vx += (Math.sin(b.ph) * 14 * this.sc - b.vx) * dt * .8;
      b.x += b.vx * dt; b.y += b.vy * dt;
      if (b.y < -b.r * 1.6 || b.x < -b.r * 3 || b.x > W + b.r * 3) L.splice(i, 1);
    }
    for (let i = 0; i < L.length; i++) for (let j = i + 1; j < L.length; j++) {
      const a = L[i], b = L[j], dx = b.x - a.x, dy = b.y - a.y, min = a.r + b.r, d2 = dx * dx + dy * dy;
      if (d2 < min * min && d2 > .01) {
        const d = Math.sqrt(d2), ov = (min - d) * .5, nx = dx / d, ny = dy / d;
        a.x -= nx * ov * .35; a.y -= ny * ov * .35; b.x += nx * ov * .35; b.y += ny * ov * .35;
        a.vx -= nx * ov * 2; a.vy -= ny * ov * 2; b.vx += nx * ov * 2; b.vy += ny * ov * 2;
      }
    }
  },
  draw() {
    for (const b of this.list) {
      const w = .03 * Math.sin(b.ph * 2.3 + b.born), s = b.r * 1.04, d = s * 2;
      ctx.save(); ctx.translate(b.x, b.y); ctx.scale(1 + w, 1 - w);
      ctx.save(); ctx.rotate(b.rot); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = .95;
      ctx.drawImage(this.film[b.film], -s, -s, d, d); ctx.restore();
      ctx.drawImage(this.hi, -s, -s, d, d);
      ctx.restore();
    }
    ctx.globalAlpha = 1;
  },
  score() { return lang === 'en' ? ('Bubbles popped: ' + this.popped) : ('Лопнуло пузырей: ' + this.popped); }
};

/* ---------- 4. SLIME ---------- */
const Slime = {
  x: 0, y: 0, cx: 0, cy: 0, vx: 0, vy: 0, R: 150, grabbed: false, gx: 0, gy: 0,
  wob: 0, wobV: 0, stretch: 0, ang: 0, kneaded: 0, popped: 0, lastSnd: 0, micro: [], hue: 320,
  build(keep) {
    const oldK = keep ? this.kneaded : 0, oldP = keep ? this.popped : 0;
    this.cx = W / 2; this.cy = H * .5;
    this.R = clamp(Math.min(W, H) * .27, 110, 250);
    if (!keep || !this.x) { this.x = this.cx; this.y = this.cy; }
    this.kneaded = oldK; this.popped = oldP;
    this.hue = (this.hue + 40) % 360 || 320;
    this.micro = [];
    for (let i = 0; i < 9; i++) { const a = rnd(0, TAU), d = rnd(0, this.R * .55); this.micro.push({ dx: Math.cos(a) * d, dy: Math.sin(a) * d, r: rnd(10, 22), gone: 0 }); }
  },
  panOf(x) { return (x / W - .5) * .9; },
  hitMicro(x, y) {
    for (const m of this.micro) {
      if (m.gone > 0) continue;
      const mx = this.x + m.dx, my = this.y + m.dy;
      if ((mx - x) * (mx - x) + (my - y) * (my - y) <= (m.r * 1.25) * (m.r * 1.25)) return m;
    }
    return null;
  },
  down(p) {
    const m = this.hitMicro(p.x, p.y);
    if (m) {
      m.gone = T; this.popped++;
      Snd.slimePop(this.panOf(p.x)); vibrate(6);
      fx.push({ t: 'ring', x: p.x, y: p.y, r0: m.r * .8, r1: m.r * 2.1, life: 0, max: .3, css: 'rgba(255,255,255,.9)', a: .7, lw: 2.5 });
      for (let i = 0; i < 6; i++) { const a = rnd(0, TAU), v = rnd(50, 170); fx.push({ t: 'drop', x: p.x, y: p.y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 40, g: 300, drag: 2, size: rnd(1.5, 3), css: 'hsla(' + this.hue + ',90%,75%,1)', life: 0, max: rnd(.3, .6) }); }
      p.tgt = 'mic';
      return;
    }
    const d = Math.hypot(p.x - this.x, p.y - this.y);
    if (d < this.R * 1.25) { this.grabbed = true; p.tgt = 'grab'; this.gx = p.x - this.x; this.gy = p.y - this.y; Snd.slimeGrab(this.panOf(p.x)); vibrate(5); }
    else { this.wobV += 6; Snd.slimeStretch(this.panOf(p.x)); p.tgt = 'poke'; }
  },
  move(p) {
    if (p.tgt === 'mic') { const m = this.hitMicro(p.x, p.y); if (m) { m.gone = T; this.popped++; Snd.slimePop(this.panOf(p.x)); vibrate(6); fx.push({ t: 'ring', x: p.x, y: p.y, r0: m.r * .8, r1: m.r * 2.1, life: 0, max: .3, css: 'rgba(255,255,255,.9)', a: .7, lw: 2.5 }); } return; }
    if (p.tgt !== 'grab') return;
    const dx = p.x - p.px, dy = p.y - p.py, d = Math.hypot(dx, dy);
    this.kneaded += d / 400;
    if (T - this.lastSnd > .09 && d > 4) { this.lastSnd = T; Snd.slimeStretch(this.panOf(p.x)); }
  },
  up(p) { if (p && p.tgt === 'grab' && this.grabbed) { this.grabbed = false; this.wobV += 9; Snd.slimeGrab(this.panOf(this.x)); } else this.grabbed = false; },
  reset() { this.build(false); Snd.slimeGrab(0); },
  update(dt) {
    let grab = null;
    for (const q of pointers.values()) if (q.tgt === 'grab') { grab = q; break; }
    if (!this.grabbed) grab = null;
    const tx = grab ? grab.x - this.gx : this.cx, ty = grab ? grab.y - this.gy : this.cy;
    const k = grab ? 180 : 60, damp = grab ? 14 : 8;
    this.vx += ((tx - this.x) * k - this.vx * damp) * dt;
    this.vy += ((ty - this.y) * k - this.vy * damp) * dt;
    this.x += this.vx * dt; this.y += this.vy * dt;
    const dx = tx - this.x, dy = ty - this.y, dist = Math.hypot(dx, dy);
    this.stretch = lerp(this.stretch, clamp(dist / (this.R * 1.4), 0, 1), 1 - Math.exp(-dt * 8));
    if (dist > 1) this.ang = Math.atan2(dy, dx);
    this.wobV += (-this.wob * 90 - this.wobV * 7) * dt;
    this.wob += this.wobV * dt;
    for (const m of this.micro) { if (m.gone && T - m.gone > 1.6) { const a = rnd(0, TAU), d = rnd(0, this.R * .55); m.dx = Math.cos(a) * d; m.dy = Math.sin(a) * d; m.gone = 0; } }
  },
  draw() {
    const R = this.R, wob = reduceMotion ? 0 : this.wob * .02;
    const sx = 1 + this.stretch * .28 + Math.sin(T * 9) * wob, sy = 1 - this.stretch * .2 - Math.sin(T * 9) * wob;
    ctx.save();
    ctx.fillStyle = 'rgba(20,0,60,.35)';
    ctx.beginPath(); ctx.ellipse(this.x, this.y + R * .95, R * 1.05, R * .22, 0, 0, TAU); ctx.fill();
    ctx.translate(this.x, this.y); ctx.rotate(this.grabbed ? this.ang * .12 : Math.sin(T * 1.2) * .03); ctx.scale(sx, sy);
    let g = ctx.createRadialGradient(-R * .3, -R * .35, R * .1, 0, 0, R * 1.15);
    g.addColorStop(0, 'hsla(' + this.hue + ',95%,82%,1)');
    g.addColorStop(.35, 'hsla(' + this.hue + ',90%,68%,1)');
    g.addColorStop(.72, 'hsla(' + ((this.hue + 25) % 360) + ',85%,55%,1)');
    g.addColorStop(1, 'hsla(' + ((this.hue + 40) % 360) + ',80%,38%,1)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(0, 0, R, 0, TAU); ctx.fill();
    ctx.save(); ctx.beginPath(); ctx.arc(0, 0, R, 0, TAU); ctx.clip();
    g = ctx.createRadialGradient(R * .25, R * .3, R * .5, R * .25, R * .3, R * 1.4);
    g.addColorStop(0, 'rgba(60,0,90,0)'); g.addColorStop(.7, 'rgba(60,0,90,0)'); g.addColorStop(1, 'rgba(40,0,80,.45)');
    ctx.fillStyle = g; ctx.fillRect(-R, -R, R * 2, R * 2);
    g = ctx.createRadialGradient(-R * .3, -R * .35, R * .1, -R * .3, -R * .35, R * .9);
    g.addColorStop(0, 'rgba(255,255,255,.5)'); g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g; ctx.fillRect(-R, -R, R * 2, R * 2);
    ctx.restore();
    ctx.strokeStyle = 'rgba(255,255,255,.5)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(0, 0, R * .985, 0, TAU); ctx.stroke();
    ctx.save(); ctx.translate(-R * .34, -R * .4); ctx.rotate(-.5); ctx.scale(1, .55);
    g = ctx.createRadialGradient(0, 0, 0, 0, 0, R * .34);
    g.addColorStop(0, 'rgba(255,255,255,.95)'); g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, R * .34, 0, TAU); ctx.fill(); ctx.restore();
    for (const m of this.micro) {
      if (m.gone) continue;
      ctx.save(); ctx.translate(m.dx, m.dy);
      const bg = ctx.createRadialGradient(-m.r * .3, -m.r * .3, m.r * .1, 0, 0, m.r);
      bg.addColorStop(0, 'rgba(255,255,255,.75)'); bg.addColorStop(.5, 'rgba(255,255,255,.18)'); bg.addColorStop(1, 'rgba(255,255,255,.32)');
      ctx.fillStyle = bg; ctx.beginPath(); ctx.arc(0, 0, m.r, 0, TAU); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = 1.5; ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,.95)'; ctx.beginPath(); ctx.arc(-m.r * .32, -m.r * .36, m.r * .2, 0, TAU); ctx.fill();
      ctx.restore();
    }
    ctx.restore();
  },
  score() { const k = Math.floor(this.kneaded); return lang === 'en' ? ('Kneaded ' + k + ' · popped ' + this.popped) : ('Размято ' + k + ' · лопнуто ' + this.popped); }
};

/* ---------- 5. SOAP CUTTING ---------- */
const PASTEL = ['#ffd9e8', '#ffe9c7', '#fff7c2', '#d9f7d4', '#d4f0ff', '#e6dcff', '#ffe3c2'];
const SoapCut = {
  bar: { x: 0, y: 0, w: 0, h: 0 }, slices: [], cut: 0, knifeX: 0, knifeOn: false, pileY: 0,
  build(keep) {
    const old = keep ? this.cut : 0;
    const w = Math.min(W * .84, 520), h = clamp(H * .13, 96, 140);
    this.bar = { x: W / 2 - w / 2, y: 150, w, h };
    if (!keep) this.slices = [];
    this.cut = old;
    this.pileY = H - 120;
    this.knifeOn = false;
  },
  cutAt(x) {
    const b = this.bar;
    if (x < b.x + 8 || x > b.x + b.w - 8) return;
    this.cut++;
    const s = rnd(24, 40);
    this.slices.push({ x: clamp(x + rnd(-6, 6), b.x, b.x + b.w), y: b.y + b.h, vx: rnd(-30, 30), vy: rnd(-40, 10), rot: rnd(0, TAU), vr: rnd(-4, 4), s, ci: (Math.random() * PASTEL.length) | 0, landed: false });
    if (this.slices.length > 60) this.slices.splice(0, this.slices.length - 60);
    b.h = Math.max(36, b.h - 3.2);
    Snd.soapCut((x / W - .5) * .9); vibrate(10);
    fx.push({ t: 'ring', x, y: b.y + b.h, r0: 6, r1: 34, life: 0, max: .25, css: 'rgba(255,255,255,.9)', a: .5, lw: 2 });
    for (let i = 0; i < 4; i++) fx.push({ t: 'spark', x, y: b.y + b.h, vx: rnd(-90, 90), vy: rnd(-60, 60), g: 320, drag: 2, size: rnd(1, 2.4), css: 'rgb(255,250,235)', life: 0, max: rnd(.25, .5) });
  },
  down(p) { p.tgt = 'knife'; p.ly = p.y; this.knifeX = p.x; this.knifeOn = true; },
  move(p) {
    if (p.tgt !== 'knife') return;
    this.knifeX = p.x; this.knifeOn = true;
    const b = this.bar;
    if (p.ly < b.y + b.h && p.y >= b.y + b.h * .3 && (p.y - p.ly) > 14 && p.x > b.x && p.x < b.x + b.w) this.cutAt(p.x);
    p.ly = p.y;
  },
  up() { this.knifeOn = false; },
  reset() { this.build(false); Snd.rustle(); },
  update(dt) {
    const floor = this.pileY;
    let stack = 0;
    for (let i = this.slices.length - 1; i >= 0; i--) {
      const s = this.slices[i];
      if (s.landed) { stack += s.s * .32; continue; }
      s.vy += 900 * dt; s.x += s.vx * dt; s.y += s.vy * dt; s.rot += s.vr * dt;
      const landY = floor - stack - s.s / 2;
      if (s.y >= landY) { s.y = landY; s.landed = true; s.vy = 0; s.vx = 0; stack += s.s * .32; }
    }
  },
  drawBar() {
    const b = this.bar;
    ctx.save();
    ctx.fillStyle = 'rgba(20,0,60,.35)';
    rr(ctx, b.x - 6, b.y + b.h - 2, b.w + 12, 22, 11); ctx.fill();
    const g = ctx.createLinearGradient(0, b.y, 0, b.y + b.h);
    g.addColorStop(0, '#fff6ea'); g.addColorStop(.25, '#ffe9d2'); g.addColorStop(.6, '#ffd9b8'); g.addColorStop(1, '#e8b48f');
    rr(ctx, b.x, b.y, b.w, b.h, 18); ctx.fillStyle = g; ctx.fill();
    ctx.save(); rr(ctx, b.x, b.y, b.w, b.h, 18); ctx.clip();
    const gg = ctx.createLinearGradient(b.x, b.y, b.x + b.w, b.y + b.h);
    gg.addColorStop(0, 'rgba(255,255,255,.55)'); gg.addColorStop(.4, 'rgba(255,255,255,0)'); gg.addColorStop(1, 'rgba(160,80,40,.18)');
    ctx.fillStyle = gg; ctx.fillRect(b.x, b.y, b.w, b.h);
    ctx.fillStyle = 'rgba(150,90,50,.25)';
    const R = rng(7);
    for (let i = 0; i < 40; i++) { ctx.globalAlpha = .25; ctx.beginPath(); ctx.arc(b.x + R() * b.w, b.y + R() * b.h, 1 + R() * 1.6, 0, TAU); ctx.fill(); }
    ctx.globalAlpha = 1;
    ctx.restore();
    rr(ctx, b.x, b.y, b.w, b.h, 18); ctx.lineWidth = 2.5; ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.stroke();
    ctx.fillStyle = 'rgba(120,60,20,.35)';
    ctx.font = '800 ' + Math.round(clamp(b.h * .3, 16, 26)) + 'px ' + 'ui-rounded,system-ui,sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(lang === 'en' ? 'SOAP' : 'МЫЛО', b.x + b.w / 2, b.y + b.h / 2);
    ctx.restore();
  },
  draw() {
    ctx.save();
    ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(16, this.pileY + 30); ctx.lineTo(W - 16, this.pileY + 30); ctx.stroke();
    ctx.restore();
    this.drawBar();
    for (const s of this.slices) {
      ctx.save(); ctx.translate(s.x, s.y); ctx.rotate(s.rot);
      const c = PASTEL[s.ci % PASTEL.length];
      ctx.fillStyle = 'rgba(20,0,60,.25)';
      rr(ctx, -s.s / 2 + 2, -s.s / 2 + 4, s.s, s.s, 7); ctx.fill();
      const g = ctx.createLinearGradient(0, -s.s / 2, 0, s.s / 2);
      g.addColorStop(0, '#ffffff'); g.addColorStop(.3, c); g.addColorStop(1, 'rgba(160,90,50,.45)');
      rr(ctx, -s.s / 2, -s.s / 2, s.s, s.s, 7); ctx.fillStyle = g; ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,.8)'; ctx.lineWidth = 1.5; ctx.stroke();
      ctx.restore();
    }
    if (this.knifeOn) {
      ctx.save();
      ctx.strokeStyle = 'rgba(255,255,255,.9)'; ctx.lineWidth = 4; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(this.knifeX, this.bar.y - 46); ctx.lineTo(this.knifeX, this.bar.y + this.bar.h + 10); ctx.stroke();
      ctx.fillStyle = '#3a2b6e';
      rr(ctx, this.knifeX - 16, this.bar.y - 78, 32, 30, 8); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.5)';
      rr(ctx, this.knifeX - 16, this.bar.y - 78, 32, 10, 8); ctx.fill();
      ctx.restore();
    } else {
      const a = (Math.sin(T * 3) + 1) / 2;
      ctx.save(); ctx.globalAlpha = .5 + a * .4;
      ctx.fillStyle = '#fff'; ctx.font = '800 15px ui-rounded,system-ui,sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(lang === 'en' ? 'swipe down through the bar' : 'проведи вниз сквозь брусок', W / 2, this.bar.y + this.bar.h + 34);
      ctx.restore();
    }
  },
  score() { return lang === 'en' ? ('Cut cubes: ' + this.cut) : ('Нарезано кубиков: ' + this.cut); }
};

/* ---------- 6. BALLOONS ---------- */
function mkBalloon(hex, S) {
  const R = 100, c = mkCanvas(220 * S, 260 * S), g = c.getContext('2d');
  g.scale(S, S); g.translate(110, 118);
  g.save();
  g.shadowColor = 'rgba(15,0,60,.4)'; g.shadowBlur = 18; g.shadowOffsetY = 10;
  const bg = g.createRadialGradient(-22, -30, 8, 0, 0, 105);
  bg.addColorStop(0, '#ffffff'); bg.addColorStop(.22, hex); bg.addColorStop(.75, hex); bg.addColorStop(1, 'rgba(40,0,80,.55)');
  g.fillStyle = bg;
  g.beginPath(); g.ellipse(0, 0, 62, 74, 0, 0, TAU); g.fill();
  g.restore();
  g.save(); g.beginPath(); g.ellipse(0, 0, 62, 74, 0, 0, TAU); g.clip();
  const gl = g.createLinearGradient(-60, -70, 30, 60);
  gl.addColorStop(0, 'rgba(255,255,255,.75)'); gl.addColorStop(.35, 'rgba(255,255,255,0)'); gl.addColorStop(1, 'rgba(255,255,255,.12)');
  g.fillStyle = gl; g.fillRect(-70, -80, 140, 160);
  g.restore();
  g.fillStyle = hex; g.beginPath(); g.moveTo(-9, 72); g.lineTo(9, 72); g.lineTo(0, 86); g.closePath(); g.fill();
  g.save(); g.translate(-30, -38); g.rotate(-.5); g.scale(1, .6);
  const hi = g.createRadialGradient(0, 0, 0, 0, 0, 20);
  hi.addColorStop(0, 'rgba(255,255,255,.95)'); hi.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = hi; g.beginPath(); g.arc(0, 0, 20, 0, TAU); g.fill(); g.restore();
  g.strokeStyle = 'rgba(255,255,255,.55)'; g.lineWidth = 2;
  g.beginPath(); g.ellipse(0, 0, 60, 72, 0, 0, TAU); g.stroke();
  return c;
}
const Ball = {
  list: [], popped: 0, spr: [], sc: 1, inflId: -1, lastSq: 0,
  build(keep) {
    this.sc = clamp(Math.min(W, H) / 760, .6, 1.3);
    const S = Math.min(DPR, 2);
    const cols = ['#ff4d6d', '#ff9236', '#ffd43b', '#34d986', '#3aa8ff', '#a15cff'];
    this.spr = cols.map(h => mkBalloon(h, S));
    if (!keep) { this.list = []; this.popped = keep ? this.popped : 0; }
    if (!this.list.length && !keep) for (let i = 0; i < 5; i++) this.spawnFloat(rnd(.1, .9) * W, rnd(H * .35, H * .9));
  },
  spawnFloat(x, y) {
    if (this.list.length >= 12) return;
    const R = rnd(34, 62) * this.sc;
    this.list.push({ x, y, vx: rnd(-12, 12), vy: rnd(-46, -22), R, r: R, grow: false, hold: 0, ci: (Math.random() * 6) | 0, ph: rnd(0, TAU) });
  },
  hit(x, y) {
    for (let i = this.list.length - 1; i >= 0; i--) {
      const b = this.list[i], dx = (x - b.x) / 1, dy = (y - b.y) / 1.15, lim = b.r;
      if (dx * dx + dy * dy <= lim * lim) return i;
    }
    return -1;
  },
  pop(i, loud) {
    const b = this.list[i]; this.list.splice(i, 1); this.popped++;
    Snd.balloonPop((b.x / W - .5) * .9); vibrate(12);
    fx.push({ t: 'ring', x: b.x, y: b.y, r0: b.r * .9, r1: b.r * 1.7, life: 0, max: .3, css: 'rgba(255,255,255,.9)', a: .8, lw: 4 });
    const n = 14;
    for (let k = 0; k < n; k++) { const a = rnd(0, TAU), v = rnd(80, 320); fx.push({ t: 'conf', x: b.x, y: b.y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 120, g: 700, drag: .8, rot: rnd(0, TAU), vr: rnd(-10, 10), size: rnd(6, 12), fl: rnd(6, 14), css: TOYS[(Math.random() * 6) | 0].hex, life: 0, max: rnd(1, 2) }); }
    if (this.inflId === (b.id || -2)) this.inflId = -1;
  },
  down(p) {
    const i = this.hit(p.x, p.y);
    if (i >= 0) { p.tgt = 'pop'; this.pop(i); return; }
    if (this.list.length >= 12) { const k = this.hit(p.x, p.y + 40); if (k >= 0) this.pop(k); return; }
    const R = rnd(44, 62) * this.sc;
    const b = { x: p.x, y: p.y, vx: 0, vy: 0, R, r: 12, grow: true, hold: 0, ci: (Math.random() * 6) | 0, ph: rnd(0, TAU), id: p.id };
    this.list.push(b);
    this.inflId = p.id; p.tgt = 'inflate';
    Snd.balloonSqueak((p.x / W - .5) * .9, true);
  },
  move(p) {
    if (p.tgt === 'pop') { const i = this.hit(p.x, p.y); if (i >= 0) this.pop(i); return; }
    if (p.tgt === 'inflate') {
      for (const b of this.list) if (b.id === p.id && b.grow) { b.x = lerp(b.x, p.x, .5); b.y = lerp(b.y, p.y, .5); }
      if (T - this.lastSq > .16) { this.lastSq = T; Snd.balloonSqueak((p.x / W - .5) * .9, false); }
    }
  },
  up(p) {
    if (!p) return;
    if (p.tgt === 'inflate') { for (const b of this.list) if (b.id === p.id) { b.grow = false; b.vy = rnd(-50, -28); } this.inflId = -1; }
  },
  reset() { for (let i = 0; i < 5; i++) this.spawnFloat(rnd(.1, .9) * W, H + 40); Snd.blow(); },
  update(dt) {
    for (let i = this.list.length - 1; i >= 0; i--) {
      const b = this.list[i];
      b.ph += dt * 2;
      if (b.grow) {
        b.r += 55 * this.sc * dt;
        b.hold += dt;
        if (b.r >= b.R * 1.25 || b.hold > 4) { this.pop(i); continue; }
      } else {
        b.vy += (-38 * this.sc - b.vy) * dt * .7;
        b.vx += (Math.sin(b.ph) * 16 - b.vx) * dt;
        b.x += b.vx * dt; b.y += b.vy * dt;
        if (b.y < -140 || b.x < -120 || b.x > W + 120) this.list.splice(i, 1);
      }
    }
    if (!this.list.length && T % 3 < dt) this.spawnFloat(rnd(.15, .85) * W, H + 60);
  },
  draw() {
    for (const b of this.list) {
      const w = 110, h = 130, s = (b.r / 62) * this.sc * 1.35;
      const dw = w * s, dh = h * s;
      ctx.save();
      ctx.strokeStyle = 'rgba(255,255,255,.6)'; ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(b.x, b.y + 40 * s);
      ctx.quadraticCurveTo(b.x + Math.sin(b.ph) * 14, b.y + 80 * s, b.x + Math.sin(b.ph + 1) * 18, b.y + 108 * s);
      ctx.stroke();
      const sq = 1 + Math.sin(b.ph * 1.7) * .02;
      ctx.translate(b.x, b.y); ctx.scale(sq, 1 / sq);
      ctx.drawImage(this.spr[b.ci % this.spr.length], -dw / 2, -dh / 2 - 20 * s, dw, dh);
      ctx.restore();
    }
  },
  score() { return lang === 'en' ? ('Balloons popped: ' + this.popped) : ('Лопнуто шаров: ' + this.popped); }
};

/* ---------- 7. KINETIC SAND ---------- */
const Sand = {
  layer: null, lg: null, lw: 0, lh: 0, scale: .5, area: { x: 0, y: 0, w: 0, h: 0 }, strokes: 0, lastTap: 0, lastTX: 0, lastTY: 0, lastRust: 0,
  build() {
    this.area = { x: 14, y: 76, w: W - 28, h: H - 76 - 106 };
    this.scale = .5;
    this.lw = Math.max(2, Math.ceil(this.area.w * this.scale)); this.lh = Math.max(2, Math.ceil(this.area.h * this.scale));
    this.layer = mkCanvas(this.lw, this.lh);
    this.lg = this.layer.getContext('2d');
    this.paintSand();
  },
  paintSand() {
    const g = this.lg, w = this.lw, h = this.lh;
    const bg = g.createLinearGradient(0, 0, w, h);
    bg.addColorStop(0, '#f7dfae'); bg.addColorStop(.5, '#eec687'); bg.addColorStop(1, '#d9a45f');
    g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1;
    g.fillStyle = bg; g.fillRect(0, 0, w, h);
    const R = rng(1234);
    for (let i = 0; i < w * h / 14; i++) {
      g.fillStyle = R() < .5 ? 'rgba(120,70,20,.18)' : 'rgba(255,255,255,.35)';
      g.fillRect(R() * w, R() * h, 1.2, 1.2);
    }
    const v = g.createRadialGradient(w / 2, h / 2, Math.min(w, h) * .3, w / 2, h / 2, Math.max(w, h) * .75);
    v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(90,45,10,.28)');
    g.fillStyle = v; g.fillRect(0, 0, w, h);
  },
  toLocal(x, y) { return [(x - this.area.x) * this.scale, (y - this.area.y) * this.scale]; },
  inArea(x, y) { const a = this.area; return x >= a.x && x <= a.x + a.w && y >= a.y && y <= a.y + a.h; },
  dig(x, y, strength) {
    if (!this.inArea(x, y)) return;
    const g = this.lg, p = this.toLocal(x, y), r = (14 + strength * 10) * this.scale;
    g.save(); g.globalCompositeOperation = 'destination-out';
    const gr = g.createRadialGradient(p[0], p[1], 0, p[0], p[1], r);
    gr.addColorStop(0, 'rgba(0,0,0,.85)'); gr.addColorStop(.7, 'rgba(0,0,0,.45)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = gr; g.beginPath(); g.arc(p[0], p[1], r, 0, TAU); g.fill();
    g.restore();
    this.strokes += .05;
    if (T - this.lastRust > .12) { this.lastRust = T; Snd.sandStep(); }
    if (strength > .6 && fx.length < 380) {
      for (let i = 0; i < 2; i++) fx.push({ t: 'grain', x, y: y - 4, vx: rnd(-70, 70), vy: rnd(-120, -20), g: 500, drag: 1.2, size: rnd(1, 2.4), css: 'rgb(255,230,170)', life: 0, max: rnd(.3, .6) });
    }
  },
  mound(x, y) {
    if (!this.inArea(x, y)) return;
    const g = this.lg, p = this.toLocal(x, y), r = 46 * this.scale;
    g.save(); g.globalCompositeOperation = 'source-over';
    const gr = g.createRadialGradient(p[0] - r * .2, p[1] - r * .25, r * .1, p[0], p[1], r);
    gr.addColorStop(0, '#fff3d6'); gr.addColorStop(.6, '#f2cd8d'); gr.addColorStop(1, 'rgba(217,164,95,0)');
    g.fillStyle = gr; g.beginPath(); g.arc(p[0], p[1], r, 0, TAU); g.fill();
    g.restore();
    Snd.inflate((x / W - .5) * .9); vibrate(6);
    fx.push({ t: 'ring', x, y, r0: 10, r1: 52, life: 0, max: .3, css: 'rgba(255,255,255,.8)', a: .5, lw: 2 });
  },
  down(p) {
    const now = performance.now();
    if (now - this.lastTap < 320 && Math.hypot(p.x - this.lastTX, p.y - this.lastTY) < 28) { this.mound(p.x, p.y); this.lastTap = 0; p.tgt = 'mound'; return; }
    this.lastTap = now; this.lastTX = p.x; this.lastTY = p.y;
    p.tgt = 'dig'; this.dig(p.x, p.y, .5);
  },
  move(p) {
    if (p.tgt !== 'dig') return;
    const dx = p.x - p.px, dy = p.y - p.py, d = Math.hypot(dx, dy), n = Math.max(1, Math.ceil(d / 8));
    const strength = clamp(d / 40, .2, 1);
    for (let i = 1; i <= n; i++) this.dig(p.px + dx * i / n, p.py + dy * i / n, strength);
  },
  up() {},
  reset() { this.paintSand(); this.strokes = 0; Snd.rustle(); },
  update() {},
  draw() {
    const a = this.area;
    ctx.save();
    ctx.fillStyle = 'rgba(20,0,60,.3)';
    rr(ctx, a.x + 4, a.y + 10, a.w, a.h, 30); ctx.fill();
    rr(ctx, a.x, a.y, a.w, a.h, 30); ctx.clip();
    ctx.drawImage(this.layer, a.x, a.y, a.w, a.h);
    ctx.restore();
    rr(ctx, a.x, a.y, a.w, a.h, 30);
    ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(255,255,255,.5)'; ctx.stroke();
    ctx.save();
    ctx.strokeStyle = 'rgba(120,60,15,.55)'; ctx.lineWidth = 10;
    rr(ctx, a.x + 5, a.y + 5, a.w - 10, a.h - 10, 24); ctx.stroke();
    ctx.restore();
  },
  score() { const s = Math.floor(this.strokes); return lang === 'en' ? ('Raked: ' + s) : ('Разгребено: ' + s); }
};

const modes = { pop: Pop, wrap: Wrap, bubbles: Soap, slime: Slime, soap: SoapCut, ball: Ball, sand: Sand };

/* ---------- UI ---------- */
const hintEl = $('hint'); let hintTimer = 0;
function showHint() { hintEl.textContent = hintFor(mode); hintEl.classList.add('show'); clearTimeout(hintTimer); hintTimer = setTimeout(hideHint, 6500); }
function hideHint() { hintEl.classList.remove('show'); clearTimeout(hintTimer); }
const ICON_ON = '<svg viewBox="0 0 24 24"><path d="M4 9.5v5h3.5L12 18.5v-13L7.5 9.5H4z"/><path d="M15.5 9a4.5 4.5 0 0 1 0 6"/><path d="M18 6.5a8 8 0 0 1 0 11"/></svg>';
const ICON_OFF = '<svg viewBox="0 0 24 24"><path d="M4 9.5v5h3.5L12 18.5v-13L7.5 9.5H4z"/><path d="M16 9.5l5 5M21 9.5l-5 5"/></svg>';
const btnSound = $('btnSound'), btnReset = $('btnReset'), btnFull = $('btnFull'), btnLang = $('btnLang'), btnTheme = $('btnTheme');
function paintSound() { btnSound.innerHTML = Snd.muted ? ICON_OFF : ICON_ON; btnSound.setAttribute('aria-pressed', String(!Snd.muted)); }
function toggleSound() { Snd.init(); Snd.setMuted(!Snd.muted); paintSound(); }
btnSound.addEventListener('click', toggleSound);
btnReset.addEventListener('click', () => { Snd.init(); modes[mode].reset(); });
const fsEl = document.documentElement;
const canFull = !!(fsEl.requestFullscreen || fsEl.webkitRequestFullscreen);
if (!canFull) btnFull.style.display = 'none';
function toggleFull() { try { if (document.fullscreenElement || document.webkitFullscreenElement) (document.exitFullscreen || document.webkitExitFullscreen).call(document); else (fsEl.requestFullscreen || fsEl.webkitRequestFullscreen).call(fsEl); } catch (e) { /* ignore */ } }
btnFull.addEventListener('click', toggleFull);
const THEME_ORDER = ['sunset', 'ocean', 'neon'];
function paintTheme() { btnTheme.title = (lang === 'en' ? 'Theme: ' : 'Тема: ') + STR[lang].themeName[themeName] + ' (T)'; }
function cycleTheme() { themeName = THEME_ORDER[(THEME_ORDER.indexOf(themeName) + 1) % THEME_ORDER.length]; store.theme = themeName; saveStore(); paintTheme(); }
btnTheme.addEventListener('click', () => { Snd.init(); cycleTheme(); });
function paintLang() {
  btnLang.textContent = lang.toUpperCase();
  document.documentElement.lang = lang;
  const tabs = document.querySelectorAll('.tab .lbl');
  const order = ['pop', 'wrap', 'bubbles', 'slime', 'soap', 'ball', 'sand'];
  tabs.forEach((el, i) => { el.textContent = STR[lang].dock[order[i]]; });
  const chips = document.querySelectorAll('.chip');
  chips.forEach((el, i) => { el.textContent = STR[lang].chips[i]; });
  btnReset.setAttribute('aria-label', resetFor(mode)); btnReset.title = resetFor(mode) + ' (R)';
  paintTheme();
}
function toggleLang() { lang = lang === 'ru' ? 'en' : 'ru'; store.lang = lang; saveStore(); paintLang(); showHint(); updateScore(true); }
btnLang.addEventListener('click', toggleLang);
const tabs = Array.from(document.querySelectorAll('.tab')), chipsEl = $('chips'), chipBtns = Array.from(document.querySelectorAll('.chip'));
function setMode(m) {
  if (!modes[m]) return;
  mode = m; modeT = 0; pointers.clear(); fx.length = 0;
  tabs.forEach(t => t.setAttribute('aria-selected', String(t.dataset.mode === m)));
  chipsEl.classList.toggle('hidden', m !== 'pop');
  btnReset.setAttribute('aria-label', resetFor(m)); btnReset.title = resetFor(m) + ' (R)';
  Snd.pad(m === 'bubbles');
  showHint();
  updateScore(true);
  const active = document.querySelector('.tab[data-mode="' + m + '"]');
  if (active && active.scrollIntoView) { try { active.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' }); } catch (e) { /* ignore */ } }
}
tabs.forEach(t => t.addEventListener('click', () => { Snd.init(); setMode(t.dataset.mode); }));
chipBtns.forEach(c => c.addEventListener('click', () => { Snd.init(); shape = c.dataset.shape; chipBtns.forEach(x => x.setAttribute('aria-pressed', String(x === c))); Pop.build(false); }));
const scoreEl = $('score'), scoreText = $('scoreText'); let lastScore = '';
function updateScore(force) {
  let s = '';
  try { s = modes[mode].score(); } catch (e) { s = '…'; }
  if (force || s !== lastScore) {
    scoreText.textContent = s; lastScore = s;
    if (!force) { scoreEl.classList.remove('bump'); void scoreEl.offsetWidth; scoreEl.classList.add('bump'); }
  }
}

/* ---------- input ---------- */
cv.addEventListener('pointerdown', e => {
  e.preventDefault(); Snd.init();
  try { cv.setPointerCapture(e.pointerId); } catch (_) { /* ignore */ }
  const p = { id: e.pointerId, x: e.clientX, y: e.clientY, px: e.clientX, py: e.clientY, tgt: null, acc: 0, ly: e.clientY };
  pointers.set(e.pointerId, p); hideHint();
  try { modes[mode].down(p); } catch (err) { /* guard: one toy must not break others */ }
});
cv.addEventListener('pointermove', e => {
  const p = pointers.get(e.pointerId); if (!p) return;
  p.px = p.x; p.py = p.y; p.x = e.clientX; p.y = e.clientY;
  try { modes[mode].move(p); } catch (err) { /* ignore */ }
});
const endPtr = e => { const p = pointers.get(e.pointerId); if (p) { try { modes[mode].up(p); } catch (err) { /* ignore */ } pointers.delete(e.pointerId); } };
cv.addEventListener('pointerup', endPtr);
cv.addEventListener('pointercancel', endPtr);
cv.addEventListener('contextmenu', e => e.preventDefault());
window.addEventListener('keydown', e => {
  if (e.repeat || e.ctrlKey || e.metaKey || e.altKey) return;
  const k = e.key.toLowerCase();
  const order = ['pop', 'wrap', 'bubbles', 'slime', 'soap', 'ball', 'sand'];
  const idx = ['1', '2', '3', '4', '5', '6', '7'].indexOf(k);
  if (idx >= 0) setMode(order[idx]);
  else if (k === 'r' || k === 'к') { Snd.init(); modes[mode].reset(); }
  else if (k === 'm' || k === 'ь') toggleSound();
  else if (k === 'f' || k === 'а') { if (canFull) toggleFull(); }
  else if (k === 't' || k === 'е') cycleTheme();
  else if (k === 'l' || k === 'д') toggleLang();
});
document.addEventListener('visibilitychange', () => { if (!document.hidden) Snd.init(); });

/* ---------- resize + main loop (120Hz-safe, FullHD floor) ---------- */
function resize() {
  W = window.innerWidth; H = window.innerHeight;
  let d = clamp(window.devicePixelRatio || 1, 1, 3);
  d = Math.max(d, Math.min(2.5, 1920 / W));
  while (W * H * d * d > 5.8e6 && d > 1) d = Math.max(1, d - .25);
  DPR = d;
  cv.width = Math.round(W * d); cv.height = Math.round(H * d);
  ctx.setTransform(d, 0, 0, d, 0, 0);
  vig = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * .35, W / 2, H / 2, Math.max(W, H) * .85);
  vig.addColorStop(0, 'rgba(20,0,60,0)'); vig.addColorStop(1, 'rgba(20,0,60,.42)');
  try { Pop.build(true); } catch (e) { /* ignore */ }
  try { Wrap.build(true); } catch (e) { /* ignore */ }
  try { Soap.build(); } catch (e) { /* ignore */ }
  try { Slime.build(true); } catch (e) { /* ignore */ }
  try { SoapCut.build(true); } catch (e) { /* ignore */ }
  try { Ball.build(true); } catch (e) { /* ignore */ }
  try { Sand.build(); } catch (e) { /* ignore */ }
}
let rzTimer = 0;
window.addEventListener('resize', () => { clearTimeout(rzTimer); rzTimer = setTimeout(resize, 140); });
window.addEventListener('orientationchange', () => { clearTimeout(rzTimer); rzTimer = setTimeout(resize, 250); });
let last = performance.now();
function frame(now) {
  const dt = Math.min(.05, Math.max(0.001, (now - last) / 1000)); last = now; T += dt; modeT = Math.min(1, modeT + dt / .35);
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  themeStep(dt); drawBG(T);
  const M = modes[mode];
  try { M.update(dt); } catch (e) { /* ignore */ }
  ctx.globalAlpha = easeOut(modeT);
  try { M.draw(); } catch (e) { /* ignore */ }
  ctx.globalAlpha = 1;
  updateFx(dt); drawFx();
  drawVignette(); updateScore(false);
  requestAnimationFrame(frame);
}
paintSound(); paintLang();
resize();
setMode('pop');
requestAnimationFrame(t => { last = t; requestAnimationFrame(frame); });
})();
