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

    if (!volumeControl.classList.contains("expanded")) {
      expandVolume();
      return;
    }

    // Toggle mute
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

  /* ── Touch scroll prevention ──────────────────────────── */
  let touchStartY = 0;

  document.addEventListener(
    "touchstart",
    (e) => {
      touchStartY = e.touches[0].clientY;
    },
    { passive: true },
  );

  document.addEventListener(
    "touchmove",
    (e) => {
      const dy = e.touches[0].clientY - touchStartY;
      // Only allow pull-to-refresh (downward at top); block all else
      if (!(dy > 0 && window.scrollY === 0)) {
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

  const VISITED_KEY = "frosky_visited_v2";

  function showCount(n) {
    viewCountEl.textContent = Number(n).toLocaleString();
  }

  const alreadyVisited = localStorage.getItem(VISITED_KEY);

  if (alreadyVisited) {
    fetch("/.netlify/functions/views")
      .then((r) => r.json())
      .then((d) => {
        showCount(d.count || 0);
      })
      .catch(() => {
        viewCountEl.textContent = "0";
      });
  } else {
    fetch("/.netlify/functions/views", {
      method: "POST",
    })
      .then((r) => r.json())
      .then((d) => {
        showCount(d.count || 0);
        localStorage.setItem(VISITED_KEY, "true");
      })
      .catch(() => {
        viewCountEl.textContent = "0";
      });
  }
});
