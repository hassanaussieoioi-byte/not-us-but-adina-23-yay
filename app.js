/* ═══════════════════════════════════════════════════════════════════════════
   Happy 23rd Birthday, Adina — behaviour
   Flow: gate → letter → descent → challenge → reveal
   ═══════════════════════════════════════════════════════════════════════════ */
(() => {
  'use strict';

  /* ── 0 · Small helpers ──────────────────────────────────────────────────── */

  const $  = (sel, root = document) => root.querySelector(sel);
  const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
  const rand  = (lo, hi) => lo + Math.random() * (hi - lo);

  /* Some older WebKit builds return undefined from play(); normalise to a
     promise so the autoplay fallback chip always behaves. */
  const safePlay = (el) => {
    try {
      const p = el.play();
      return p && typeof p.then === 'function' ? p : Promise.resolve();
    } catch (err) {
      return Promise.reject(err);
    }
  };

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const say = (msg) => { const el = $('#live'); if (el) el.textContent = msg; };

  /* iOS Safari can throw if currentTime is written before any metadata has
     loaded, so rewinding is always best-effort. */
  const rewind = (el) => {
    try { el.currentTime = 0; } catch (err) { /* not ready yet — harmless */ }
  };

  /* ── 1 · The letter, embedded verbatim ──────────────────────────────────── */

  const LETTER = `Happy 23rd Birthday Adina ! 💖

Had to wakeup at 5 am to do this text cause itna toh kr he skta hoon. You’ve all grown up and I’m soo happy that you made it to work 😅 I’m always proud to see you succeed and not a single day goes without hoping that you are good and a safe place.  But today I’m not going to talk about what happened between us. We are all past that now and that has become a maazi now. 

Hope your job is not too hard on you it is very exhausting I know. I will always be your cheerleader and i hope life is treating you well and that you are surrounded by good people is what i wish. Life has taken us in different directions and I haven’t been much happy about it but kaat leingy 23 saal hogaye iss duniya mein. We have shared alot of memories… regardless of where we are now and I don’t think that’s something i could ever erase or pretend didn’t matter.

I genuinely hope ke tum khush raho and achieve all your dreams and make your mama proud. Whatever happens i will always wish well and hope life is kind to you. Enjoy your birthday.. you deserve a good one. Happy birthday once again…..❤️`;

  /* ── 2 · Scene switching ────────────────────────────────────────────────── */

  const SCENES = ['#scene-gate', '#scene-letter', '#descent',
                  '#scene-challenge', '#scene-reveal'];

  function show(selector) {
    SCENES.forEach((sel) => {
      const el = $(sel);
      if (el) el.classList.toggle('is-off', sel !== selector);
    });
  }

  /* ── 3 · Audio ──────────────────────────────────────────────────────────── */

  const VOL = { loop: 0.72, final: 0.88 };

  const Audio2 = {
    loopEl:  $('#music-loop'),
    finalEl: $('#music-final'),
    chip:    $('#sound-chip'),
    current: null,
    muted:   false,
    finalWarmed: false,
    ramps:   new WeakMap(),

    ramp(el, to, ms = 1200) {
      const pending = this.ramps.get(el);
      if (pending) cancelAnimationFrame(pending);

      const from = el.volume;
      const t0 = performance.now();

      const step = (now) => {
        const k = Math.min(1, (now - t0) / ms);
        el.volume = clamp(from + (to - from) * k, 0, 1);
        if (k < 1) this.ramps.set(el, requestAnimationFrame(step));
        else this.ramps.delete(el);
      };
      this.ramps.set(el, requestAnimationFrame(step));
    },

    /* Called synchronously inside the consent tap so the gesture is honoured. */
    startLoop() {
      const el = this.loopEl;
      this.current = el;
      rewind(el);
      el.volume = 0;

      this.ramp(el, this.muted ? 0 : VOL.loop, 1800);

      safePlay(el)
        .then(() => this.chip.classList.add('is-hidden'))
        .catch(() => this.chip.classList.remove('is-hidden'));
    },

    crossToFinal() {
      if (this.current === this.finalEl) return;

      this.ramp(this.loopEl, 0, 1100);
      window.setTimeout(() => this.loopEl.pause(), 1150);

      const el = this.finalEl;
      this.current = el;
      rewind(el);
      el.volume = 0;

      this.ramp(el, this.muted ? 0 : VOL.final, 1600);
      safePlay(el)
        .then(() => this.chip.classList.add('is-hidden'))
        .catch(() => this.chip.classList.remove('is-hidden'));
    },

    retry() {
      const el = this.current || this.loopEl;
      safePlay(el).then(() => {
        this.ramp(el, this.muted ? 0 : (el === this.finalEl ? VOL.final : VOL.loop), 900);
        this.chip.classList.add('is-hidden');
      }).catch(() => {});
    },

    /* The final track is far larger than the loop, so it is not fetched on load.
       Warm it up once the letter is underway — by the time the reveal needs it,
       a few minutes will have passed and it is already buffered. */
    warmFinal() {
      if (this.finalWarmed) return;
      this.finalWarmed = true;
      this.finalEl.preload = 'auto';
      try { this.finalEl.load(); } catch (err) { /* non-fatal */ }
    },

    toggleMute() {
      this.muted = !this.muted;
      const el = this.current;
      if (el) this.ramp(el, this.muted ? 0 : (el === this.finalEl ? VOL.final : VOL.loop), 500);
      return this.muted;
    },
  };

  $('#sound-chip').addEventListener('click', () => Audio2.retry());

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      Audio2.loopEl.pause();
      Audio2.finalEl.pause();
    } else if (Audio2.current) {
      // Mute is a volume concern, not a playback one — keep the track running.
      safePlay(Audio2.current).catch(() => {});
    }
  });

  /* ── 4 · Floating hearts ────────────────────────────────────────────────── */

  const HEART_COLORS = ['#ff5a78', '#ff97ab', '#d81e3f', '#ffd76e', '#ffb3c1'];

  function seedHearts(container, count) {
    if (!container || reduceMotion) return;

    const frag = document.createDocumentFragment();
    for (let i = 0; i < count; i++) {
      const h = document.createElement('span');
      h.className = 'heart';
      h.style.left      = `${rand(2, 94).toFixed(2)}%`;
      h.style.setProperty('--s',     `${rand(11, 27).toFixed(1)}px`);
      h.style.setProperty('--dur',   `${rand(9, 19).toFixed(1)}s`);
      h.style.setProperty('--delay', `${(-rand(0, 18)).toFixed(1)}s`);
      h.style.setProperty('--peak',  rand(0.28, 0.7).toFixed(2));
      h.style.setProperty('--sway',  `${rand(-34, 34).toFixed(0)}px`);
      h.style.color = HEART_COLORS[i % HEART_COLORS.length];
      frag.appendChild(h);
    }
    container.appendChild(frag);
  }

  seedHearts($('#hearts-gate'), 22);

  /* ── 5 · Act 1 · Consent gate ───────────────────────────────────────────── */

  const consentBox   = $('#consent-box');
  const consentBtn   = $('#consent-btn');
  const gateHint     = $('#gate-hint');
  const gateScene    = $('#scene-gate');
  const letterScene  = $('#scene-letter');

  consentBox.addEventListener('change', () => {
    consentBtn.disabled = !consentBox.checked;
    gateHint.textContent = consentBox.checked
      ? 'Thank you. Take your time in here.'
      : 'Tick the box to continue.';
    gateHint.classList.toggle('is-ready', consentBox.checked);
  });

  consentBtn.addEventListener('click', () => {
    if (!consentBox.checked) return;

    Audio2.startLoop();               // must stay inside the gesture

    document.body.classList.remove('is-locked');
    gateScene.classList.add('is-leaving');

    window.setTimeout(() => {
      show('#scene-letter');
      window.scrollTo(0, 0);
      seedHearts($('#hearts-letter'), 12);
      typewriter.start();

      // Give the loop a head start, then fetch the big final track behind it.
      window.setTimeout(() => Audio2.warmFinal(), 4000);
    }, 700);
  });

  /* ── 6 · Act 2 · The typewriter ─────────────────────────────────────────── */

  const letterEl  = $('#letter');
  const caretEl   = $('#caret');
  const scrollCue = $('#scroll-cue');
  const descentEl = $('#descent');

  const BODY = document.createTextNode('');
  letterEl.insertBefore(BODY, caretEl);

  /* Deliberately unhurried — the letter should feel handwritten, not printed.
     72ms per character plus the pauses below works out at roughly 9 characters
     a second, so the full 1,113-character letter unfolds over about two
     minutes. Tapping the text switches to 3x, which takes it to ~40 seconds. */
  const PUNCT_PAUSE = {
    '.': 420, ',': 240, '!': 460, '?': 460, '…': 620,
    '\n': 700, '—': 280, ';': 300, ':': 300,
  };
  const BASE_MS = 72;

  const typewriter = {
    idx: 0,
    acc: 0,
    last: 0,
    speed: 1,
    running: false,
    done: false,
    following: true,
    lastFollow: 0,

    start() {
      $('#letter-full').textContent = LETTER;

      if (reduceMotion) { this.finish(); return; }

      this.running = true;
      requestAnimationFrame((ts) => this.tick(ts));
    },

    tick(ts) {
      if (!this.running) return;

      if (!this.last) this.last = ts;
      const dt = Math.min(ts - this.last, 140);
      this.last = ts;
      this.acc += dt * this.speed;

      let guard = 0;
      while (this.idx < LETTER.length && guard++ < 90) {
        const ch = LETTER[this.idx];
        const cost = BASE_MS + (PUNCT_PAUSE[ch] || 0);
        if (this.acc < cost) break;
        this.acc -= cost;
        this.idx++;

        // Never split a surrogate pair (emoji) across frames.
        const code = ch.charCodeAt(0);
        if (code >= 0xD800 && code <= 0xDBFF && this.idx < LETTER.length) this.idx++;
      }

      BODY.data = LETTER.slice(0, this.idx);

      if (this.idx >= LETTER.length) { this.finish(); return; }
      requestAnimationFrame((next) => this.tick(next));
    },

    finish() {
      if (this.done) return;
      this.done = true;
      this.running = false;
      this.idx = LETTER.length;
      BODY.data = LETTER;

      caretEl.style.display = 'none';

      unlockDescent();
      scrollCue.classList.remove('is-hidden');
      say('The letter is finished. Scroll down when you are ready.');
    },

    cycleSpeed() {
      if (this.done) return;
      this.speed = this.speed === 1 ? 3 : 1;
      say(this.speed === 3 ? 'Reading faster.' : 'Normal speed.');
    },  };

  letterEl.addEventListener('click', () => typewriter.cycleSpeed());
  scrollCue.addEventListener('click', () => {
    descentEl.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' });
  });

  /* Auto-follow: nudge the page down only once the caret drops into the lower
     quarter of the screen, so the text advances line by line instead of the
     page constantly creeping. Yields immediately to a deliberate swipe up. */
  let touchStartY = 0;

  window.addEventListener('touchstart', () => { touchStartY = window.scrollY; },
    { passive: true });

  window.addEventListener('touchend', () => {
    if (window.scrollY < touchStartY - 40) typewriter.following = false;
  }, { passive: true });

  function autoFollow(now) {
    if (!typewriter.running || !typewriter.following) return;

    const caretTop = caretEl.getBoundingClientRect().top;
    const restLine = window.innerHeight * 0.78;   // where we let the caret sit
    if (caretTop < restLine) return;

    if (now - typewriter.lastFollow < 260) return;
    typewriter.lastFollow = now;

    window.scrollBy({
      top: caretTop - window.innerHeight * 0.62,
      behavior: reduceMotion ? 'auto' : 'smooth',
    });
  }

  /* ── 7 · Act 3 · The descent ────────────────────────────────────────────── */

  const zoomEl     = $('#descent-zoom');
  const vignetteEl = $('.vignette');
  const locket     = $('#locket');
  const descentCue = $('#descent-cue');
  const descentSkip = $('#descent-skip');

  let descentTotal = 0;
  let lastP = -1;

  function measureDescent() {
    descentTotal = Math.max(1, descentEl.offsetHeight - window.innerHeight);
  }

  /* The descent is display:none until the letter is done, so it has no
     measurable height before then — reveal it and measure in one step. */
  function unlockDescent() {
    descentEl.classList.remove('is-off');
    measureDescent();
    lastP = -1;
    updateDescent();
  }

  function updateDescent() {
    if (descentEl.classList.contains('is-off')) return;

    // A resize while hidden (or a late font swap) can leave a stale height.
    if (descentTotal <= 1) measureDescent();

    const p = clamp(-descentEl.getBoundingClientRect().top / descentTotal, 0, 1);
    if (Math.abs(p - lastP) < 0.0015) return;
    lastP = p;

    const eased = Math.pow(p, 2.15);
    zoomEl.style.setProperty('--zoom', (1 + eased * 5.4).toFixed(3));
    if (vignetteEl) vignetteEl.style.setProperty('--vig', (0.28 + p * 0.55).toFixed(3));

    const live = p > 0.5;
    locket.dataset.live = String(live);
    locket.tabIndex = live ? 0 : -1;
    locket.setAttribute('aria-hidden', String(!live));

    descentCue.style.opacity = p > 0.72 ? '0' : '1';
    descentSkip.classList.toggle('is-hidden', p < 0.55);
  }

  locket.addEventListener('click', () => {
    if (locket.dataset.live !== 'true') return;
    challenge.begin();
  });

  descentSkip.addEventListener('click', () => challenge.begin());

  /* ── 8 · Act 4 · Cut the thread ─────────────────────────────────────────── */

  const challengeScene = $('#scene-challenge');
  const stage   = $('#challenge-stage');
  const thread  = $('#thread');
  const hitsBox = $('#hits');
  const burstBox = $('#burst');
  const target  = $('#target');
  const targetImg = $('#target-img');
  const hud     = $('.hud__count');
  const triesEl = $('#tries');
  const dialog  = $('#challenge-dialog');
  const dialogStart = $('#dialog-start');
  const revealScene = $('#scene-reveal');

  thread.innerHTML =
    '<defs><linearGradient id="threadGrad" x1="0" y1="0" x2="0" y2="1">' +
    '<stop offset="0" stop-color="#ffe9b8"/>' +
    '<stop offset=".55" stop-color="#ffd76e"/>' +
    '<stop offset="1" stop-color="#ff97ab"/>' +
    '</linearGradient></defs><path id="thread-path" d=""/>';

  const threadPath = $('#thread-path', thread);

  const challenge = {
    armed: false,
    resolved: false,
    attempts: 3,
    fray: 0,
    pos: { x: 0, y: 0 },
    redrawing: false,

    begin() {
      if (this.armed || this.resolved) return;
      show('#scene-challenge');
      window.scrollTo(0, 0);

      // The image is deliberately not in the markup — fetch it as we arrive.
      if (!targetImg.src) targetImg.src = 'assets/target.png';

      requestAnimationFrame(() => {
        this.layout();
        dialog.classList.remove('is-hidden');
        dialogStart.focus();
      });
    },

    layout() {
      const w = stage.clientWidth || window.innerWidth;
      const h = stage.clientHeight || window.innerHeight;
      thread.setAttribute('viewBox', `0 0 ${w} ${h}`);
      thread.setAttribute('width', w);
      thread.setAttribute('height', h);

      if (!this.pos.x) {
        this.pos = { x: w / 2, y: h * 0.46 };
      } else {
        this.pos.x = clamp(this.pos.x, 60, w - 60);
        this.pos.y = clamp(this.pos.y, 130, h - 130);
      }
      this.place();
    },

    place() {
      target.style.left = `${this.pos.x}px`;
      target.style.top  = `${this.pos.y}px`;
      this.drawThread();
    },

    /* Keep the thread glued to the target while its position animates. */
    followFor(ms) {
      if (this.redrawing) return;
      this.redrawing = true;
      const until = performance.now() + ms;
      const loop = () => {
        this.drawThread();
        if (performance.now() < until) requestAnimationFrame(loop);
        else this.redrawing = false;
      };
      requestAnimationFrame(loop);
    },

    drawThread() {
      const sb = stage.getBoundingClientRect();
      const tb = target.getBoundingClientRect();
      const w = sb.width;

      const tx = tb.left - sb.left + tb.width / 2;
      const ty = tb.top - sb.top + tb.height * 0.04;

      const cx = w / 2;
      const amp = 5 + this.fray * 9;
      const N = 18;
      let d = '';

      for (let i = 0; i <= N; i++) {
        const t = i / N;
        const x = cx + (tx - cx) * t;
        const y = -24 + (ty + 24) * t;
        const off = Math.sin(t * Math.PI * (2 + this.fray * 1.5)) *
                    amp * Math.sin(t * Math.PI);
        d += `${i === 0 ? 'M' : 'L'} ${(x + off).toFixed(1)} ${y.toFixed(1)} `;
      }

      threadPath.setAttribute('d', d.trim());
      threadPath.setAttribute('stroke-width', Math.max(1.4, 4.2 - this.fray * 0.9).toFixed(2));
      threadPath.setAttribute(
        'stroke-dasharray',
        this.fray === 0 ? 'none' : `${Math.max(4, 11 - this.fray * 3)} ${this.fray * 2.6}`
      );
    },

    relocate() {
      const sb = stage.getBoundingClientRect();
      const size = target.offsetWidth || 96;
      const pad = size / 2 + 34;

      const minX = pad;
      const maxX = Math.max(pad + 1, sb.width - pad);
      const minY = pad + 92;                       // clear of the HUD
      const maxY = Math.max(minY + 1, sb.height - pad - 96);

      // Land somewhere clearly different — the floor is on the target's size so
      // a bigger target still makes an obvious jump.
      const minJump = Math.max(sb.width * 0.32, size * 0.85);
      let x = this.pos.x;
      let y = this.pos.y;
      let guard = 0;
      do {
        x = rand(minX, maxX);
        y = rand(minY, maxY);
      } while (Math.hypot(x - this.pos.x, y - this.pos.y) < minJump && guard++ < 24);

      this.pos = { x, y };
      this.place();
      this.followFor(520);
    },

    /* One attempt, however it lands. A tap on the target frays a strand; a tap
       that misses sends it somewhere else. Either way the count drops, and the
       thread only lets go on the third. */
    strike(landed, x, y) {
      if (!this.armed || this.resolved) return;

      this.ripple(x, y, landed ? '#ffd76e' : '#ff5a78');
      this.attempts--;
      this.fray = clamp(3 - this.attempts, 0, 3);
      this.paintHud();

      if (this.attempts <= 0) {
        this.sever();
        return;
      }

      if (landed) this.jolt();
      else this.relocate();

      say(`${this.attempts} ${this.attempts === 1 ? 'try' : 'tries'} left.`);
    },

    onTap(event) {
      if (!this.armed || this.resolved) return;

      const sb = stage.getBoundingClientRect();
      const landed = Boolean(event.target.closest && event.target.closest('.target'));
      this.strike(landed, event.clientX - sb.left, event.clientY - sb.top);
    },

    /* A hit frays the thread but does not end the game. */
    jolt() {
      target.removeAttribute('data-jolt');
      void target.offsetWidth;               // restart the animation
      target.setAttribute('data-jolt', 'true');
      window.setTimeout(() => target.removeAttribute('data-jolt'), 500);
      this.drawThread();
    },

    ripple(x, y, color) {
      const r = document.createElement('span');
      r.className = 'ripple';
      r.style.left = `${x}px`;
      r.style.top  = `${y}px`;
      r.style.borderColor = color;
      hitsBox.appendChild(r);
      window.setTimeout(() => r.remove(), 700);
    },

    paintHud() {
      triesEl.textContent = String(Math.max(0, this.attempts));
      hud.classList.add('is-bump');
      window.setTimeout(() => hud.classList.remove('is-bump'), 460);
      hud.classList.toggle('is-empty', this.attempts <= 0);
    },

    sever() {
      if (this.resolved) return;

      this.resolved = true;
      this.armed = false;
      this.fray = 3;
      this.paintHud();

      target.dataset.hit = 'true';
      this.drawThread();

      // Let the strands spring apart.
      threadPath.style.strokeDasharray = '5 5';
      threadPath.style.strokeWidth = '1.1';
      threadPath.style.opacity = '0';

      const tb = target.getBoundingClientRect();
      petals(hitsBox, tb.left + tb.width / 2, tb.top + tb.height / 2, 30);

      say('The thread let go.');

      window.setTimeout(() => {
        target.dataset.cut = 'true';
      }, reduceMotion ? 0 : 520);

      window.setTimeout(() => reveal(), reduceMotion ? 500 : 1250);
    },
  };

  dialogStart.addEventListener('click', () => {
    dialog.classList.add('is-hidden');
    challenge.armed = true;
    stage.setAttribute('tabindex', '-1');
    stage.focus({ preventScroll: true });
    target.setAttribute('role', 'button');
    target.setAttribute('tabindex', '0');
    target.setAttribute('aria-hidden', 'false');
    target.setAttribute('aria-label', 'Cut the thread');
    say('Tap the target. Three tries.');
  });

  /* The dialog is a single-action gate: there is nothing behind it to reach and
     nothing to dismiss, so keep focus on the one way forward. */
  dialog.addEventListener('keydown', (event) => {
    if (event.key === 'Tab') {
      event.preventDefault();
      dialogStart.focus();
    }
  });

  stage.addEventListener('pointerdown', (event) => challenge.onTap(event));

  target.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;

    event.preventDefault();
    const sb = stage.getBoundingClientRect();
    const tb = target.getBoundingClientRect();
    challenge.strike(true,
      tb.left - sb.left + tb.width / 2,
      tb.top - sb.top + tb.height / 2);
  });

  /* ── 9 · Petals ─────────────────────────────────────────────────────────── */

  const PETAL_COLORS = ['#ff5a78', '#ff97ab', '#ffd76e', '#d81e3f', '#fff0f3', '#ffb3c1'];

  function petals(container, cx, cy, count) {
    if (!container) return;

    const cb = container.getBoundingClientRect();
    const ox = cx - cb.left;
    const oy = cy - cb.top;
    const frag = document.createDocumentFragment();

    for (let i = 0; i < count; i++) {
      const p = document.createElement('span');
      p.className = 'petal';
      const angle = rand(0, Math.PI * 2);
      const dist  = rand(90, 260);
      p.style.left = `${ox}px`;
      p.style.top  = `${oy}px`;
      p.style.background = PETAL_COLORS[i % PETAL_COLORS.length];
      p.style.width = p.style.height = `${rand(7, 17).toFixed(1)}px`;
      p.style.setProperty('--dx', `${(Math.cos(angle) * dist).toFixed(0)}px`);
      p.style.setProperty('--dy', `${(Math.sin(angle) * dist).toFixed(0)}px`);
      p.style.setProperty('--dur', `${rand(0.7, 1.5).toFixed(2)}s`);
      frag.appendChild(p);
    }

    container.appendChild(frag);
    window.setTimeout(() => {
      container.querySelectorAll('.petal').forEach((n) => n.remove());
    }, 1800);
  }

  /* ── 10 · Act 5 · Reveal ────────────────────────────────────────────────── */

  const revealImg = $('#reveal-img');

  function reveal() {
    show('#scene-reveal');
    window.scrollTo(0, 0);
    Audio2.crossToFinal();

    // Both the photo and the blurred backdrop are fetched only now.
    if (!revealImg.src) revealImg.src = 'assets/happy-birthday.png';
    revealScene.classList.add('is-lit');

    requestAnimationFrame(() => {
      seedHearts($('#hearts-reveal'), 20);

      if (!reduceMotion) {
        const rb = burstBox.getBoundingClientRect();
        petals(burstBox, rb.left + rb.width / 2, rb.top + rb.height * 0.42, 26);
      }
      say('Happy 23rd birthday, Adina.');
    });
  }

  $('#mute-btn').addEventListener('click', (event) => {
    const muted = Audio2.toggleMute();
    const el = event.currentTarget;
    el.textContent = muted ? 'Unmute' : 'Mute';
    el.setAttribute('aria-pressed', String(muted));
  });

  $('#replay-btn').addEventListener('click', () => window.location.reload());

  /* ── 11 · Scroll + resize plumbing ──────────────────────────────────────── */

  let ticking = false;

  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame((now) => {
      autoFollow(now);
      updateDescent();
      ticking = false;
    });
  }

  window.addEventListener('scroll', onScroll, { passive: true });

  window.addEventListener('resize', () => {
    measureDescent();
    if (!challengeScene.classList.contains('is-off')) challenge.layout();
    lastP = -1;
    updateDescent();
  });

  window.addEventListener('orientationchange', () => {
    window.setTimeout(() => {
      measureDescent();
      if (!challengeScene.classList.contains('is-off')) challenge.layout();
      lastP = -1;
      updateDescent();
    }, 260);
  });

  measureDescent();
  updateDescent();
  $('#letter-full').textContent = LETTER;
})();
