"use strict";

(function () {
  const canvas = document.getElementById("snowCanvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");

  /* ── Config ─────────────────────────────────────────────── */
  const isMobile = /Mobi|Android/i.test(navigator.userAgent);
  const COUNT = isMobile ? 25 : 70;
  const SPEED = isMobile ? 0.2 : 0.35;

  let W = 0,
    H = 0,
    flakes = [],
    rafId = null;

  /* ── Setup ──────────────────────────────────────────────── */
  function resize() {
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
    if (flakes.length)
      flakes.forEach((f) => {
        f.x = Math.random() * W;
      });
  }

  function mkFlake() {
    return {
      x: Math.random() * W,
      y: Math.random() * -H,
      r: Math.random() * 2.8 + 0.6, // smaller, more elegant
      d: Math.random() * 0.9 + 0.4, // drift speed
      o: Math.random() * 0.55 + 0.35, // opacity 35–90%
      sw: Math.random() * Math.PI * 2, // phase for side drift
    };
  }

  function init() {
    flakes = [];
    for (let i = 0; i < COUNT; i++) flakes.push(mkFlake());
  }

  /* ── Animation ──────────────────────────────────────────── */
  let angle = 0;

  function draw(ts) {
    ctx.clearRect(0, 0, W, H);
    angle += 0.003;

    for (let i = 0; i < flakes.length; i++) {
      const f = flakes[i];

      // Side drift (gentle sine wave)
      f.x += Math.sin(angle + f.sw) * 0.45;
      f.y += Math.pow(f.d, 1.2) * SPEED;

      // Draw
      ctx.beginPath();
      ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,255,255,${f.o})`;
      ctx.fill();

      // Reset when off screen
      if (f.y > H + 4) {
        flakes[i] = { ...mkFlake(), x: Math.random() * W, y: -4 };
      }
      if (f.x > W + 4) f.x = -4;
      if (f.x < -4) f.x = W + 4;
    }

    rafId = requestAnimationFrame(draw);
  }

  /* ── Visibility optimization ─────────────────────────────── */
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      cancelAnimationFrame(rafId);
    } else {
      rafId = requestAnimationFrame(draw);
    }
  });

  /* ── Resize debounce ─────────────────────────────────────── */
  let resizeTimer;
  window.addEventListener(
    "resize",
    () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(resize, 120);
    },
    { passive: true },
  );

  /* ── Start ──────────────────────────────────────────────── */
  resize();
  init();
  rafId = requestAnimationFrame(draw);
})();
