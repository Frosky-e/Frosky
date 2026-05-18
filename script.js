"use strict";

document.addEventListener("DOMContentLoaded", () => {
  /* ── Elements ─────────────────────────────────────────── */
  const splash = document.getElementById("splash");
  const mainContent = document.getElementById("main-content");
  const audio = document.getElementById("bg-audio");
  const volumeSlider = document.getElementById("volumeSlider");
  const volumeIcon = document.getElementById("volumeIcon");
  const volumeControl = document.getElementById("volumeControl");
  const volBtn = document.getElementById("volBtn");
  const viewCountEl = document.getElementById("view-count");

  /* ── Initial state ────────────────────────────────────── */
  audio.volume = 1;

  /* ── Splash: click / Enter key ────────────────────────── */
  function enterSite() {
    splash.style.opacity = "0";
    splash.style.pointerEvents = "none";

    setTimeout(() => {
      splash.style.display = "none";
      mainContent.classList.add("visible");
      mainContent.removeAttribute("aria-hidden");
      audio.play().catch(() => {
        /* autoplay blocked – ok */
      });
    }, 600);
  }

  splash.addEventListener("click", enterSite);
  splash.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") enterSite();
  });

  /* ── Volume slider ────────────────────────────────────── */
  volumeSlider.addEventListener("input", () => {
    const vol = parseFloat(volumeSlider.value);
    audio.volume = vol;
    audio.muted = vol === 0;
    updateVolumeIcon(vol);
  });

  function updateVolumeIcon(vol) {
    if (vol === 0) {
      volumeIcon.className = "bi bi-volume-mute-fill";
    } else if (vol < 0.4) {
      volumeIcon.className = "bi bi-volume-down-fill";
    } else {
      volumeIcon.className = "bi bi-volume-up-fill";
    }
  }

  /* ── Volume icon button: expand or mute/unmute ────────── */
  let collapseTimer;

  volBtn.addEventListener("click", (e) => {
    e.stopPropagation();

    // First click → only expand smoothly
    if (!volumeControl.classList.contains("expanded")) {
      expandVolume();

      // animation complete hone do
      return;
    }

    // Expanded hone ke baad hi mute/unmute
    if (audio.muted || audio.volume === 0) {
      audio.muted = false;
      audio.volume = 1;
      volumeSlider.value = 1;
      updateVolumeIcon(1);
    } else {
      audio.muted = true;
      volumeSlider.value = 0;
      updateVolumeIcon(0);
    }
  });

  /* Expand on clicking anywhere on the widget */
  volumeControl.addEventListener("click", (e) => {
    if (e.target === volBtn || e.target === volumeIcon) return;
    if (!volumeControl.classList.contains("expanded")) {
      expandVolume();
    }
  });

  /* Collapse when clicking elsewhere */
  document.addEventListener("click", (e) => {
    if (
      volumeControl.classList.contains("expanded") &&
      !volumeControl.contains(e.target)
    ) {
      collapseVolume();
    }
  });

  function expandVolume() {
    volumeControl.classList.add("expanded");
    clearTimeout(collapseTimer);
    collapseTimer = setTimeout(collapseVolume, 5000);
  }

  function collapseVolume() {
    volumeControl.classList.remove("expanded");
    clearTimeout(collapseTimer);
  }

  /* Reset collapse timer when user interacts with slider */
  volumeSlider.addEventListener("input", () => {
    clearTimeout(collapseTimer);
    collapseTimer = setTimeout(collapseVolume, 5000);
  });

  /* ── Touch scroll: allow on main-content ─────────────── */
  document.body.addEventListener(
    "touchmove",
    (e) => {
      const mc = document.getElementById("main-content");
      if (mc && !mc.contains(e.target)) {
        e.preventDefault();
      }
    },
    { passive: false },
  );

  /* ── Discord Live Presence via Lanyard ───────────────── */
  const DISCORD_ID = "1090116632380186695";
  const avatarEl = document.getElementById("discord-avatar");
  const statusDotEl = document.getElementById("status-dot");
  const activityEl = document.getElementById("discord-activity");

  const decorationEl = document.getElementById("discord-decoration");

  const STATUS_CLASS = {
    online: "status-online",
    idle: "status-idle",
    dnd: "status-dnd",
    offline: "status-offline",
    invisible: "status-offline",
  };

  function applyPresence(data) {
    // ── Avatar (live from Discord CDN) ──
    if (data.discord_user && data.discord_user.avatar) {
      const hash = data.discord_user.avatar;
      const ext = hash.startsWith("a_") ? "gif" : "webp";
      const newSrc = `https://cdn.discordapp.com/avatars/${DISCORD_ID}/${hash}.${ext}?size=128`;
      if (avatarEl.src !== newSrc) avatarEl.src = newSrc;
    }

    // ── Avatar Decoration ──
    const deco = data.discord_user && data.discord_user.avatar_decoration_data;
    if (deco && deco.asset) {
      // Discord decoration CDN — animated PNG (APNG)
      const decoSrc = `https://cdn.discordapp.com/avatar-decoration-presets/${deco.asset}.png?size=96&passthrough=true`;
      if (decorationEl.src !== decoSrc) {
        decorationEl.src = decoSrc;
        decorationEl.style.display = "block";
      }
    } else {
      decorationEl.style.display = "none";
      decorationEl.src = "";
    }

    // ── Status dot ──
    const status = data.discord_status || "offline";
    statusDotEl.className = `status-dot ${STATUS_CLASS[status] || "status-offline"}`;
    statusDotEl.setAttribute("aria-label", `Status: ${status}`);

    // ── Platform badge (mobile / desktop / web) ──
    const platformEl = document.getElementById("platform-badge");
    if (platformEl) {
      if (status === "offline" || status === "invisible") {
        platformEl.style.display = "none";
        platformEl.className = "platform-badge";
      } else if (data.active_on_discord_mobile) {
        platformEl.style.display = "flex";
        platformEl.className = "platform-badge platform-mobile";
        platformEl.title = "On Mobile";
      } else if (data.active_on_discord_desktop) {
        platformEl.style.display = "flex";
        platformEl.className = "platform-badge platform-desktop";
        platformEl.title = "On Desktop";
      } else if (data.active_on_discord_web) {
        platformEl.style.display = "flex";
        platformEl.className = "platform-badge platform-web";
        platformEl.title = "On Web";
      } else {
        platformEl.style.display = "none";
      }
    }

    // ── Activity (game / listening / custom) ──
    let activityText = "";

    // Check Spotify first
    if (data.listening_to_spotify && data.spotify) {
      const sp = data.spotify;
      activityText = `🎵 ${sp.song} — ${sp.artist}`;
    } else if (data.activities && data.activities.length > 0) {
      // Pick first non-custom activity, fallback to custom
      const act =
        data.activities.find((a) => a.type !== 4) || data.activities[0];
      if (act.type === 4 && act.state) {
        // Custom status emoji + text
        activityText = act.state;
      } else if (act.name) {
        activityText = `🎮 ${act.name}`;
      }
    }

    activityEl.textContent = activityText;
    activityEl.classList.toggle("has-activity", !!activityText);
  }

  // Poll REST once, then upgrade to WebSocket
  function fetchPresenceREST() {
    fetch(`https://api.lanyard.rest/v1/users/${DISCORD_ID}`)
      .then((r) => r.json())
      .then((json) => {
        if (json.success) applyPresence(json.data);
      })
      .catch(() => {});
  }

  function connectLanyardWS() {
    const ws = new WebSocket("wss://api.lanyard.rest/socket");
    let heartbeatInterval;

    ws.addEventListener("open", () => {});

    ws.addEventListener("message", (e) => {
      const msg = JSON.parse(e.data);

      // Opcode 1 = Hello → send subscribe
      if (msg.op === 1) {
        const interval = msg.d.heartbeat_interval;
        ws.send(JSON.stringify({ op: 2, d: { subscribe_to_id: DISCORD_ID } }));

        heartbeatInterval = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN)
            ws.send(JSON.stringify({ op: 3 }));
        }, interval);
      }

      // Opcode 0 = Event (INIT_STATE or PRESENCE_UPDATE)
      if (msg.op === 0 && msg.d) {
        applyPresence(msg.d);
      }
    });

    ws.addEventListener("close", () => {
      clearInterval(heartbeatInterval);
      // Reconnect after 5s
      setTimeout(connectLanyardWS, 5000);
    });

    ws.addEventListener("error", () => ws.close());
  }

  // Start: REST first for instant data, then WebSocket for live updates
  fetchPresenceREST();
  connectLanyardWS();

  /* ── Page view counter ───────────────────────────────── */

  const VISITED_KEY = "frosky_visited_v3";

  async function updateViews() {
    try {
      const alreadyVisited = localStorage.getItem(VISITED_KEY);

      // New visitor → increment
      if (!alreadyVisited) {
        const postRes = await fetch("/.netlify/functions/views", {
          method: "POST",
        });

        const postData = await postRes.json();

        showCount(postData.count || 0);

        localStorage.setItem(VISITED_KEY, "true");
      } else {
        // Existing visitor → just fetch count
        const getRes = await fetch("/.netlify/functions/views");
        const getData = await getRes.json();

        showCount(getData.count || 0);
      }
    } catch (err) {
      console.error("View counter error:", err);
      viewCountEl.textContent = "0";
    }
  }

  function showCount(n) {
    viewCountEl.textContent = Number(n).toLocaleString();
  }

  updateViews();

  /* ── Gamer stat → smooth scroll to Games ── */

  const gamerStat = document.querySelector(".gamer-stat");
  const gamesSection = document.getElementById("games");

  if (gamerStat && gamesSection) {
    gamerStat.addEventListener("click", () => {
      targetScroll = gamesSection.offsetTop;

      if (!isAnimating) {
        smoothScroll();
      }
    });
  }

  /* ── About nav → smooth scroll ──────────────────────────── */
  const aboutBtn = document.querySelector('.nav-link[href="#about"]');
  if (aboutBtn) {
    aboutBtn.addEventListener("click", (e) => {
      e.preventDefault();
      const aboutSection = document.getElementById("about");
      if (aboutSection) {
        document.getElementById("main-content").scrollTo({
          top: aboutSection.offsetTop,
          behavior: "smooth",
        });
      }
    });
  }

  /* ── Back to top button (butter smooth) ─────────────────── */
  const backToTop = document.getElementById("backToTop");

  if (backToTop) {
    backToTop.addEventListener("click", () => {
      // use existing smooth engine
      targetScroll = 0;

      if (!isAnimating) {
        smoothScroll();
      }
    });
  }

  /* ── Parallax on About section ───────────────────────────── */
  const aboutSection = document.getElementById("about");
  const parallaxBg = document.querySelector(".about-parallax-bg");

  function updateParallax() {
    if (!aboutSection || !parallaxBg) return;
    const scrollTop = mainContent.scrollTop;
    const aboutTop = aboutSection.offsetTop;
    const offset = (scrollTop - aboutTop) * 0.22;
    parallaxBg.style.setProperty("--parallax-offset", offset + "px");
  }

  /* ── IntersectionObserver: trigger about section animations ─ */
  if (aboutSection) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            aboutSection.classList.add("in-view");
          }
        });
      },
      { root: mainContent, threshold: 0.15 },
    );
    observer.observe(aboutSection);
    mainContent.addEventListener("scroll", updateParallax, { passive: true });
  }

  /* ── Butter Smooth Scroll ── */

  let currentScroll = 0;
  let targetScroll = 0;
  let isAnimating = false;

  mainContent.addEventListener(
    "wheel",
    (e) => {
      e.preventDefault();

      targetScroll += e.deltaY * 1.05;

      const maxScroll = mainContent.scrollHeight - mainContent.clientHeight;

      targetScroll = Math.max(0, Math.min(targetScroll, maxScroll));

      if (!isAnimating) {
        smoothScroll();
      }
    },
    { passive: false },
  );

  function smoothScroll() {
    isAnimating = true;

    const isMobile = window.innerWidth < 768;

    const ease = isMobile ? 0.24 : 0.18;

    currentScroll += (targetScroll - currentScroll) * ease;

    mainContent.scrollTop = currentScroll;

    updateParallax();

    if (Math.abs(targetScroll - currentScroll) > 0.3) {
      requestAnimationFrame(smoothScroll);
    } else {
      currentScroll = targetScroll;
      mainContent.scrollTop = currentScroll;
      isAnimating = false;
    }
  }
  /* ── Stable scroll hint animation fix ── */

  const scrollHint = document.querySelector(".scroll-hint");

  function resetScrollHintAnimation() {
    if (!scrollHint) return;

    const mobile = window.matchMedia("(max-width:768px)").matches;

    // completely reset animation
    scrollHint.style.animation = "none";
    scrollHint.style.transform = "translate3d(-50%,0,0)";

    requestAnimationFrame(() => {
      scrollHint.offsetHeight;

      scrollHint.style.animation = mobile
        ? "fadeUp 0.6s ease 0.5s both, subtleFloatMobile 5.5s ease-in-out infinite"
        : "fadeUp 0.6s ease 0.5s both, subtleFloat 4.5s ease-in-out infinite";
    });
  }

  /* Tab switch fix */
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) {
      resetScrollHintAnimation();
    }
  });

  /* Desktop ↔ Mobile switch fix */
  window.addEventListener("resize", resetScrollHintAnimation);
  /* Initial load fix */
  window.addEventListener("load", () => {
    requestAnimationFrame(() => {
      resetScrollHintAnimation();
    });
  });
});
