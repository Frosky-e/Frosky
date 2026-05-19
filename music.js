"use strict";

/* ════════════════════════════════════════════════════════════
   music.js  —  Full music player for Frosky's site
   Uses the existing <audio id="bg-audio"> element.
   Add more songs to the SONGS array as needed.
════════════════════════════════════════════════════════════ */

(function () {
  /* ── Song Library ──────────────────────────────────────────
     Add more songs here. For the default audio file set
     src to the same path used in index.html.
     art: optional image path. Leave "" for the note icon.
  ────────────────────────────────────────────────────────── */
  const SONGS = [
    {
      title: "Far From Home",
      artist: "Road 96",
      src: "audio/WhatsApp Audio 2026-05-17 at 12.22.15 PM.mpeg",
      art: "Images/FarFromHome.webp",
    },

    {
      title: "Stray",
      artist: "Stray OST",
      src: "audio/Stray.mpeg",
      art: "Images/stray2.webp",
    },
  ];

  // ── PRELOAD BACKGROUND IMAGES ──
  const preloadImages = ["Images/bg_hq.webp", "Images/stray3.webp"];

  preloadImages.forEach((src) => {
    const img = new Image();
    img.src = src;
  });

  /* ── DOM refs ──────────────────────────────────────────── */
  const audio = document.getElementById("bg-audio");
  if (!audio) return;

  const playlistEl = document.getElementById("playlist");
  const playerArt = document.getElementById("playerArt");
  const playerSongName = document.getElementById("playerSongName");
  const playerArtist = document.getElementById("playerArtist");
  const bgLayer = document.querySelector(".bg-layer");
  const progressFill = document.getElementById("progressFill");
  const progressThumb = document.getElementById("progressThumb");
  const progressTrack = document.getElementById("progressTrack");
  const playerCurrent = document.getElementById("playerCurrent");
  const playerDuration = document.getElementById("playerDuration");
  const playPauseBtn = document.getElementById("playPauseBtn");
  const playIcon = document.getElementById("playIcon");
  const prevBtn = document.getElementById("prevBtn");
  const nextBtn = document.getElementById("nextBtn");
  const shuffleBtn = document.getElementById("shuffleBtn");
  const repeatBtn = document.getElementById("repeatBtn");
  const visualizer = document.getElementById("visualizer");
  const playerVolBtn = document.getElementById("playerVolBtn");
  const playerVolIcon = document.getElementById("playerVolIcon");
  const playerVolFill = document.getElementById("playerVolFill");
  const playerVolThumb = document.getElementById("playerVolThumb");
  const playerVolTrack = document.getElementById("playerVolTrack");

  /* ── State ─────────────────────────────────────────────── */
  let currentIndex = 0;
  let isPlaying = false;
  let isShuffle = false;
  let repeatMode = 0; // 0=off 1=all 2=one
  let isDraggingProgress = false;
  let isDraggingVol = false;

  /* ── Build Playlist UI ─────────────────────────────────── */
  function buildPlaylist() {
    if (!playlistEl) return;
    playlistEl.innerHTML = "";

    SONGS.forEach((song, i) => {
      const li = document.createElement("li");
      li.className = "playlist-item";
      li.setAttribute("role", "listitem");
      li.setAttribute("tabindex", "0");
      li.setAttribute("aria-label", `${song.title} by ${song.artist}`);

      li.innerHTML = `
        <div class="pl-thumb">
          ${song.art ? `<img src="${song.art}" alt="${song.title}" loading="lazy">` : `<i class="bi bi-music-note"></i>`}
        </div>
        <div class="pl-meta">
          <div class="pl-title">${song.title}</div>
          <div class="pl-artist">${song.artist}</div>
        </div>
        <span class="pl-num">${i + 1}</span>
        <span class="pl-playing-dot" aria-hidden="true">
          <span class="pl-bars">
            <span></span><span></span><span></span>
          </span>
        </span>
      `;

      li.addEventListener("click", () => loadSong(i, true));
      li.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          loadSong(i, true);
        }
      });

      playlistEl.appendChild(li);
    });
  }

  /* ── Load & Play ────────────────────────────────────────── */
  function loadSong(index, autoPlay = false) {
    currentIndex = index;
    const song = SONGS[index];

    // Update audio source
    audio.src = song.src;
    audio.load();

    // Update player art
    playerArt.innerHTML = song.art
      ? `<img src="${song.art}" alt="${song.title}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`
      : `<i class="bi bi-music-note-beamed"></i>`;
    // Update info
    playerSongName.textContent = song.title;
    playerArtist.textContent = song.artist;

    // Change background image based on song
    if (bgLayer) {
      if (song.title === "Stray") {
        // Background image
        bgLayer.style.backgroundImage = 'url("Images/stray3.webp")';

        // STRAY THEME (green cinematic)
        document.documentElement.style.setProperty("--clr-bg", "#07110a");

        document.documentElement.style.setProperty(
          "--clr-card",
          "rgba(12, 28, 18, 0.58)",
        );

        document.documentElement.style.setProperty(
          "--clr-border",
          "rgba(120, 180, 120, 0.14)",
        );

        document.documentElement.style.setProperty(
          "--clr-muted",
          "rgba(180, 220, 180, 0.58)",
        );

        document.documentElement.style.setProperty(
          "--clr-glow",
          "rgba(120, 180, 120, 0.18)",
        );
        document.body.classList.add("stray-theme");
      } else {
        // Default Road 96 theme
        bgLayer.style.backgroundImage = 'url("Images/bg_hq.webp")';

        document.documentElement.style.setProperty("--clr-bg", "#03091a");

        document.documentElement.style.setProperty(
          "--clr-card",
          "rgba(3, 12, 35, 0.55)",
        );

        document.documentElement.style.setProperty(
          "--clr-border",
          "rgba(100, 160, 255, 0.12)",
        );

        document.documentElement.style.setProperty(
          "--clr-muted",
          "rgba(180, 210, 255, 0.55)",
        );

        document.documentElement.style.setProperty(
          "--clr-glow",
          "rgba(100, 160, 255, 0.22)",
        );
        document.body.classList.remove("stray-theme");
      }
    }

    // Reset progress
    progressFill.style.width = "0%";
    progressThumb.style.left = "0%";
    playerCurrent.textContent = "0:00";
    playerDuration.textContent = "0:00";

    // Highlight active playlist item
    updateActiveItem();

    if (autoPlay) {
      audio
        .play()
        .then(() => setPlaying(true))
        .catch(() => {});
    } else {
      setPlaying(false);
    }
  }

  function updateActiveItem() {
    const items = playlistEl?.querySelectorAll(".playlist-item");
    if (!items) return;
    items.forEach((item, i) => {
      item.classList.toggle("active", i === currentIndex);
      const bars = item.querySelector(".pl-bars");
      if (bars) {
        if (i === currentIndex) {
          bars.classList.toggle("paused", !isPlaying);
        } else {
          bars.classList.remove("paused");
        }
      }
    });
  }

  /* ── Playing State ─────────────────────────────────────── */
  function setPlaying(state) {
    isPlaying = state;
    playIcon.className = state ? "bi bi-pause-fill" : "bi bi-play-fill";
    playPauseBtn.setAttribute("aria-label", state ? "Pause" : "Play");

    playerArt.classList.toggle("playing", state);
    const artImg = playerArt.querySelector("img");
    if (artImg) artImg.classList.toggle("spinning", state);

    if (visualizer) {
      visualizer.classList.toggle("active", state);
      visualizer.classList.toggle("paused", !state);
    }

    updateActiveItem();
  }

  /* ── Controls ───────────────────────────────────────────── */
  playPauseBtn?.addEventListener("click", () => {
    if (audio.paused) {
      audio
        .play()
        .then(() => setPlaying(true))
        .catch(() => {});
    } else {
      audio.pause();
      setPlaying(false);
    }
  });

  prevBtn?.addEventListener("click", () => {
    if (audio.currentTime > 3) {
      audio.currentTime = 0;
      return;
    }
    let prev = currentIndex - 1;
    if (prev < 0) prev = SONGS.length - 1;
    loadSong(prev, isPlaying);
  });

  nextBtn?.addEventListener("click", () => {
    playNext();
  });

  function playNext() {
    let next;
    if (repeatMode === 2) {
      next = currentIndex;
    } else if (isShuffle) {
      do {
        next = Math.floor(Math.random() * SONGS.length);
      } while (SONGS.length > 1 && next === currentIndex);
    } else {
      next = (currentIndex + 1) % SONGS.length;
    }
    loadSong(next, isPlaying);
  }

  shuffleBtn?.addEventListener("click", () => {
    isShuffle = !isShuffle;
    shuffleBtn.classList.toggle("ctrl-active", isShuffle);
    shuffleBtn.title = isShuffle ? "Shuffle: ON" : "Shuffle: OFF";
  });

  repeatBtn?.addEventListener("click", () => {
    repeatMode = (repeatMode + 1) % 3;
    const icons = ["bi bi-repeat", "bi bi-repeat", "bi bi-repeat-1"];
    repeatBtn.querySelector("i").className = icons[repeatMode];
    repeatBtn.classList.toggle("ctrl-active", repeatMode > 0);
    const labels = ["Repeat: OFF", "Repeat: ALL", "Repeat: ONE"];
    repeatBtn.title = labels[repeatMode];
  });

  /* ── Audio events ────────────────────────────────────────── */
  audio.addEventListener("play", () => setPlaying(true));
  audio.addEventListener("pause", () => setPlaying(false));

  audio.addEventListener("ended", () => {
    if (repeatMode === 2) {
      audio.currentTime = 0;
      audio.play().catch(() => {});
    } else if (repeatMode === 1 || SONGS.length > 1) {
      playNext();
    } else {
      setPlaying(false);
    }
  });

  audio.addEventListener("timeupdate", () => {
    if (isDraggingProgress) return;
    const pct = audio.duration ? audio.currentTime / audio.duration : 0;
    const pctStr = (pct * 100).toFixed(2) + "%";
    progressFill.style.width = pctStr;
    progressThumb.style.left = pctStr;
    playerCurrent.textContent = formatTime(audio.currentTime);
  });

  audio.addEventListener("durationchange", () => {
    playerDuration.textContent = audio.duration
      ? formatTime(audio.duration)
      : "0:00";
  });

  audio.addEventListener("loadedmetadata", () => {
    playerDuration.textContent = formatTime(audio.duration);
  });

  /* ── Progress bar interaction ────────────────────────────── */
  function seekTo(clientX) {
    const rect = progressTrack.getBoundingClientRect();

    let pct = (clientX - rect.left) / rect.width;
    pct = Math.max(0, Math.min(1, pct));

    if (audio.duration) {
      // smoother seek
      requestAnimationFrame(() => {
        audio.currentTime = pct * audio.duration;
      });
    }

    progressFill.style.width = `${pct * 100}%`;
    progressThumb.style.left = `${pct * 100}%`;
  }

  progressTrack?.addEventListener("mousedown", (e) => {
    isDraggingProgress = true;
    seekTo(e.clientX);
  });

  progressTrack?.addEventListener(
    "touchstart",
    (e) => {
      isDraggingProgress = true;
      seekTo(e.touches[0].clientX);
    },
    { passive: true },
  );

  document.addEventListener("mousemove", (e) => {
    if (isDraggingProgress) seekTo(e.clientX);
  });

  document.addEventListener(
    "touchmove",
    (e) => {
      if (isDraggingProgress) seekTo(e.touches[0].clientX);
    },
    { passive: true },
  );

  document.addEventListener("mouseup", () => {
    isDraggingProgress = false;
  });
  document.addEventListener("touchend", () => {
    isDraggingProgress = false;
  });

  /* ── Volume interaction ──────────────────────────────────── */
  function updateVolUI(vol) {
    playerVolFill.style.width = vol * 100 + "%";
    playerVolThumb.style.left = vol * 100 + "%";
    if (vol === 0) {
      playerVolIcon.className = "bi bi-volume-mute-fill";
    } else if (vol < 0.4) {
      playerVolIcon.className = "bi bi-volume-down-fill";
    } else {
      playerVolIcon.className = "bi bi-volume-up-fill";
    }
    // Sync with the main volume slider
    const mainSlider = document.getElementById("volumeSlider");
    if (mainSlider) mainSlider.value = vol;
    const mainIcon = document.getElementById("volumeIcon");
    if (mainIcon) {
      if (vol === 0) mainIcon.className = "bi bi-volume-mute-fill";
      else if (vol < 0.4) mainIcon.className = "bi bi-volume-down-fill";
      else mainIcon.className = "bi bi-volume-up-fill";
    }
  }

  function setVol(clientX) {
    const rect = playerVolTrack.getBoundingClientRect();

    let vol = (clientX - rect.left) / rect.width;
    vol = Math.max(0, Math.min(1, vol));

    requestAnimationFrame(() => {
      audio.volume = vol;
      audio.muted = vol === 0;
    });

    updateVolUI(vol);
  }

  playerVolTrack?.addEventListener("mousedown", (e) => {
    isDraggingVol = true;
    setVol(e.clientX);
  });

  playerVolTrack?.addEventListener(
    "touchstart",
    (e) => {
      isDraggingVol = true;
      setVol(e.touches[0].clientX);
    },
    { passive: true },
  );

  document.addEventListener("mousemove", (e) => {
    if (isDraggingVol) setVol(e.clientX);
  });

  document.addEventListener(
    "touchmove",
    (e) => {
      if (isDraggingVol) setVol(e.touches[0].clientX);
    },
    { passive: true },
  );

  document.addEventListener("mouseup", () => {
    isDraggingVol = false;
  });
  document.addEventListener("touchend", () => {
    isDraggingVol = false;
  });

  playerVolBtn?.addEventListener("click", () => {
    if (audio.muted || audio.volume === 0) {
      audio.muted = false;
      audio.volume = 1;
      updateVolUI(1);
    } else {
      audio.muted = true;
      updateVolUI(0);
    }
  });

  // Keep volume UI in sync with main volume slider
  const mainVolumeSlider = document.getElementById("volumeSlider");
  mainVolumeSlider?.addEventListener("input", () => {
    updateVolUI(parseFloat(mainVolumeSlider.value));
  });

  /* ── Helpers ─────────────────────────────────────────────── */
  function formatTime(s) {
    if (!s || isNaN(s)) return "0:00";
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  }

  /* ── Init ────────────────────────────────────────────────── */
  buildPlaylist();
  loadSong(0, false);
  updateVolUI(audio.volume);

  // Reflect current audio state if already playing (e.g. user came back)
  if (!audio.paused) setPlaying(true);
})();
