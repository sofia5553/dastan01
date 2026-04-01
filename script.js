(() => {
  const body = document.body;
  const pageId = body ? body.dataset.page : "";

  const normalizeNavLinksForGithubPages = () => {
    const isGithubPages = window.location.hostname.endsWith(".github.io");
    if (!isGithubPages) {
      return;
    }

    const pathParts = window.location.pathname.split("/").filter(Boolean);
    if (pathParts.length === 0) {
      return;
    }

    const firstPart = pathParts[0];
    const repoBase = firstPart.endsWith(".html") ? "/" : `/${firstPart}/`;
    const targets = {
      "1": "index.html",
      "2": "page2.html",
      "3": "page3.html",
      "4": "page4.html",
      "5": "page5.html",
      "6": "page6.html"
    };

    document.querySelectorAll(".nav-card").forEach((card) => {
      const target = targets[card.dataset.page];
      if (target) {
        card.setAttribute("href", `${repoBase}${target}`);
      }
    });
  };

  normalizeNavLinksForGithubPages();

  const navCards = document.querySelectorAll(".nav-card");
  navCards.forEach((card) => {
    if (card.dataset.page === pageId) {
      card.classList.add("is-active");
    }
  });

  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const revealBlocks = document.querySelectorAll(".reveal");

  if (prefersReduced) {
    revealBlocks.forEach((block) => block.classList.add("is-visible"));
  } else {
    const observer = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            obs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 }
    );

    revealBlocks.forEach((block) => observer.observe(block));
  }

  function initPageThree() {
    const question = document.getElementById("we-question");
    const yesBtn = document.getElementById("yes-btn");
    const noBtn = document.getElementById("no-btn");
    const choiceZone = document.getElementById("choice-zone");
    const bubble = document.getElementById("we-bubble");

    if (!question || !yesBtn || !noBtn || !choiceZone || !bubble) {
      return;
    }

    let finished = false;
    let escapedOnce = false;
    let currentNoPosition = { left: 0, top: 0 };

    const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

    const setNoPosition = (left, top) => {
      const safeLeft = Math.max(6, left);
      const safeTop = Math.max(6, top);
      noBtn.style.right = "auto";
      noBtn.style.transform = "none";
      noBtn.style.left = `${safeLeft}px`;
      noBtn.style.top = `${safeTop}px`;
      currentNoPosition = { left: safeLeft, top: safeTop };
    };

    const getChoiceMetrics = () => {
      const zoneRect = choiceZone.getBoundingClientRect();
      const yesRect = yesBtn.getBoundingClientRect();

      return {
        zoneWidth: choiceZone.clientWidth,
        zoneHeight: choiceZone.clientHeight,
        yesLeft: yesRect.left - zoneRect.left,
        yesTop: yesRect.top - zoneRect.top,
        yesWidth: yesRect.width,
        yesHeight: yesRect.height,
        noWidth: noBtn.offsetWidth,
        noHeight: noBtn.offsetHeight
      };
    };

    const overlapsYes = (left, top, m) => {
      const gap = 10;
      return (
        left < m.yesLeft + m.yesWidth + gap &&
        left + m.noWidth > m.yesLeft - gap &&
        top < m.yesTop + m.yesHeight + gap &&
        top + m.noHeight > m.yesTop - gap
      );
    };

    const getDistanceFromYes = (left, top, m) => {
      const yesCenterX = m.yesLeft + m.yesWidth / 2;
      const yesCenterY = m.yesTop + m.yesHeight / 2;
      const noCenterX = left + m.noWidth / 2;
      const noCenterY = top + m.noHeight / 2;
      return Math.hypot(noCenterX - yesCenterX, noCenterY - yesCenterY);
    };

    const placeNoNearYes = () => {
      const m = getChoiceMetrics();
      const gap = 12;
      let left = m.yesLeft + m.yesWidth + gap;

      if (left + m.noWidth > m.zoneWidth - 6) {
        left = Math.max(6, m.yesLeft - m.noWidth - gap);
      }

      const top = clamp(m.yesTop, 6, Math.max(m.zoneHeight - m.noHeight - 6, 6));
      setNoPosition(left, top);
    };

    const pickFarPosition = (m) => {
      const maxX = Math.max(m.zoneWidth - m.noWidth - 6, 6);
      const maxY = Math.max(m.zoneHeight - m.noHeight - 6, 6);
      const safeDistance = window.innerWidth <= 520 ? 130 : 100;

      const candidates = [
        { left: 6, top: 6 },
        { left: maxX, top: 6 },
        { left: 6, top: maxY },
        { left: maxX, top: maxY },
        { left: Math.round(maxX / 2), top: 6 },
        { left: Math.round(maxX / 2), top: maxY },
        { left: 6, top: Math.round(maxY / 2) },
        { left: maxX, top: Math.round(maxY / 2) }
      ];

      for (let i = 0; i < 12; i += 1) {
        candidates.push({
          left: Math.floor(Math.random() * (maxX - 6 + 1)) + 6,
          top: Math.floor(Math.random() * (maxY - 6 + 1)) + 6
        });
      }

      const valid = candidates
        .filter((position) => !overlapsYes(position.left, position.top, m))
        .map((position) => ({
          ...position,
          distance: getDistanceFromYes(position.left, position.top, m)
        }))
        .sort((a, b) => b.distance - a.distance);

      const minShift = 34;
      const movedCandidates = valid.filter((position) => (
        Math.hypot(position.left - currentNoPosition.left, position.top - currentNoPosition.top) >= minShift
      ));

      const usable = movedCandidates.length > 0 ? movedCandidates : valid;
      if (usable.length === 0) {
        return { left: maxX, top: maxY };
      }

      const farEnough = usable.filter((position) => position.distance >= safeDistance);
      const rankedPool = farEnough.length > 0 ? farEnough : usable;
      const pool = rankedPool.slice(0, Math.min(4, rankedPool.length));
      return pool[Math.floor(Math.random() * pool.length)];
    };

    const runAway = () => {
      if (finished) {
        return;
      }

      escapedOnce = true;
      const m = getChoiceMetrics();
      const best = pickFarPosition(m);
      setNoPosition(best.left, best.top);
    };

    const handleResize = () => {
      if (finished) {
        return;
      }

      const m = getChoiceMetrics();
      const maxLeft = Math.max(m.zoneWidth - m.noWidth - 6, 6);
      const maxTop = Math.max(m.zoneHeight - m.noHeight - 6, 6);

      if (!escapedOnce) {
        placeNoNearYes();
        return;
      }

      const clampedLeft = clamp(currentNoPosition.left, 6, maxLeft);
      const clampedTop = clamp(currentNoPosition.top, 6, maxTop);
      setNoPosition(clampedLeft, clampedTop);

      if (overlapsYes(clampedLeft, clampedTop, m)) {
        runAway();
      }
    };

    requestAnimationFrame(placeNoNearYes);
    window.addEventListener("resize", handleResize);

    noBtn.addEventListener("pointerenter", runAway);
    noBtn.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      runAway();
    });
    noBtn.addEventListener("click", (event) => {
      event.preventDefault();
    });

    yesBtn.addEventListener("click", () => {
      finished = true;
      window.removeEventListener("resize", handleResize);
      yesBtn.classList.add("is-hidden");
      noBtn.classList.add("is-hidden");
      question.textContent = "\u041c\u044b!!!";
      question.classList.add("pulse-heart");
      bubble.classList.remove("is-hidden");
      bubble.classList.add("pulse-heart");
    });

    const question2 = document.getElementById("we-question-2");
    const yes2 = document.getElementById("yes-btn-2");
    if (question2 && yes2) {
      yes2.addEventListener("click", () => {
        yes2.classList.add("is-hidden");
        question2.textContent = "\u0423\u0420\u0410 \u042d\u0422\u041e \u042f \u0418 \u041b\u042e\u0411\u0418\u041c\u0410\u042f!!";
        question2.classList.add("pulse-heart");
      });
    }

    const question3 = document.getElementById("we-question-3");
    const yes3 = document.getElementById("yes-btn-3");
    const heart = document.getElementById("heart-bouncer");

    if (question3 && yes3 && heart) {
      yes3.addEventListener("click", () => {
        question3.textContent = "\u0414\u0410, \u042d\u0422\u041e \u0422\u041e\u0416\u0415 \u041c\u042b!!";
        question3.classList.add("pulse-heart");
        heart.classList.remove("is-hidden");
      });
    }
  }

  const PLAYER_STATE_KEY = "gift-player-state-v2";
  const PLAYER_TRACKS_KEY = "gift-player-tracks-v1";

  const readStorageJson = (key, fallback) => {
    try {
      const raw = sessionStorage.getItem(key);
      if (!raw) {
        return fallback;
      }
      return JSON.parse(raw);
    } catch {
      return fallback;
    }
  };

  const writeStorageJson = (key, value) => {
    try {
      sessionStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* ignore storage write failures */
    }
  };

  const removeStorageItem = (key) => {
    try {
      sessionStorage.removeItem(key);
    } catch {
      /* ignore storage remove failures */
    }
  };

  const getNavCards = () => Array.from(document.querySelectorAll(".nav-card"));

  const readPlayerStateFromUrl = () => {
    try {
      const params = new URLSearchParams(window.location.search);
      const raw = params.get("ps");
      if (!raw) {
        return null;
      }
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== "object") {
        return null;
      }
      return parsed;
    } catch {
      return null;
    }
  };

  const writePlayerStateToUrl = (state) => {
    try {
      const url = new URL(window.location.href);
      if (!state) {
        url.searchParams.delete("ps");
      } else {
        url.searchParams.set("ps", JSON.stringify(state));
      }
      window.history.replaceState(null, "", url.toString());
    } catch {
      /* ignore URL rewrite failures */
    }
  };

  const writePlayerStateToNavLinks = (state) => {
    getNavCards().forEach((card) => {
      if (!card.dataset.baseHref) {
        const originalHref = card.getAttribute("href") || "";
        const withoutQuery = originalHref.split("?")[0];
        card.dataset.baseHref = withoutQuery;
      }

      const baseHref = card.dataset.baseHref || "";
      if (!state) {
        card.setAttribute("href", baseHref);
      } else {
        card.setAttribute("href", `${baseHref}?ps=${encodeURIComponent(JSON.stringify(state))}`);
      }
    });
  };

  const relayPlayerState = (state) => {
    writePlayerStateToUrl(state);
    writePlayerStateToNavLinks(state);
  };

  const clearPlayerStateEverywhere = () => {
    removeStorageItem(PLAYER_STATE_KEY);
    relayPlayerState(null);
  };

  const normalizePlaylistTracks = (tracks) => (
    (Array.isArray(tracks) ? tracks : [])
      .map((track) => ({
        trackIndex: Number(track.trackIndex),
        title: String(track.title || "").trim(),
        url: String(track.url || "").trim()
      }))
      .filter((track) => Number.isFinite(track.trackIndex))
      .sort((a, b) => a.trackIndex - b.trackIndex)
  );

  const findNextPlayableTrack = (tracks, currentIndex) => {
    if (tracks.length === 0) {
      return null;
    }

    const currentPosition = tracks.findIndex((track) => track.trackIndex === currentIndex);
    if (currentPosition === -1) {
      return tracks.find((track) => track.url) || null;
    }

    for (let offset = 1; offset <= tracks.length; offset += 1) {
      const nextPosition = (currentPosition + offset) % tracks.length;
      const candidate = tracks[nextPosition];
      if (candidate && candidate.url) {
        return candidate;
      }
    }

    return null;
  };

  const isLikelyAudioUrl = (url) => (
    typeof url === "string" &&
    /\.(mp3|m4a|ogg|wav|aac)(?:[?#].*)?$/i.test(url.trim())
  );

  const getResolvedAudioSource = (audio) => {
    if (!audio) {
      return "";
    }

    const rawSrc = (audio.getAttribute("src") || "").trim();
    if (!rawSrc) {
      return "";
    }

    const resolved = (() => {
      try {
        return new URL(rawSrc, window.location.href).href;
      } catch {
        return rawSrc;
      }
    })();

    return isLikelyAudioUrl(resolved) ? resolved : "";
  };

  const savePlayerState = (audio, payload) => {
    const safeSrc = getResolvedAudioSource(audio);
    if (!safeSrc) {
      clearPlayerStateEverywhere();
      return;
    }

    const state = {
      src: safeSrc,
      currentTime: Number.isFinite(audio.currentTime) ? Math.max(0, Math.round(audio.currentTime * 10) / 10) : 0,
      isPlaying: !audio.paused,
      trackIndex: payload.trackIndex ?? null,
      title: payload.title || "",
      updatedAt: Date.now()
    };
    writeStorageJson(PLAYER_STATE_KEY, state);
    relayPlayerState(state);
  };

  const ensureFloatingPlayer = () => {
    const applyFloatingLayout = (host) => {
      const isPhone = window.matchMedia("(max-width: 700px)").matches;
      host.style.position = "fixed";
      host.style.zIndex = "1000";
      host.style.background = "rgba(247, 252, 255, 0.96)";
      host.style.border = "1px solid #bfd7ed";
      host.style.boxShadow = "0 10px 20px rgba(120, 152, 185, 0.2)";
      host.style.display = "grid";
      host.style.gap = "8px";
      host.style.backdropFilter = "blur(8px)";

      if (isPhone) {
        host.style.left = "8px";
        host.style.right = "8px";
        host.style.bottom = "calc(10px + env(safe-area-inset-bottom))";
        host.style.width = "auto";
        host.style.borderRadius = "12px";
        host.style.padding = "10px";
      } else {
        host.style.left = "auto";
        host.style.right = "12px";
        host.style.bottom = "12px";
        host.style.width = "min(360px, calc(100vw - 24px))";
        host.style.borderRadius = "14px";
        host.style.padding = "10px";
      }
    };

    let host = document.getElementById("floating-player-host");
    if (!host) {
      host = document.createElement("div");
      host.id = "floating-player-host";
      applyFloatingLayout(host);

      const title = document.createElement("p");
      title.id = "floating-player-title";
      title.style.margin = "0";
      title.style.fontSize = "0.92rem";
      title.style.color = "#55718f";
      title.textContent = "Музыка";

      const audio = document.createElement("audio");
      audio.id = "floating-player-audio";
      audio.controls = true;
      audio.preload = "metadata";
      audio.style.width = "100%";

      const stopBtn = document.createElement("button");
      stopBtn.type = "button";
      stopBtn.textContent = "Остановить";
      stopBtn.style.border = "1px solid #b9d3ea";
      stopBtn.style.borderRadius = "999px";
      stopBtn.style.background = "#f3f9ff";
      stopBtn.style.color = "#57738f";
      stopBtn.style.padding = "0.4rem 0.8rem";
      stopBtn.style.cursor = "pointer";
      stopBtn.style.minHeight = "38px";

      host.append(title, audio, stopBtn);
      document.body.appendChild(host);
    } else {
      applyFloatingLayout(host);
    }

    window.addEventListener("resize", () => applyFloatingLayout(host));

    return {
      host,
      title: host.querySelector("#floating-player-title"),
      audio: host.querySelector("#floating-player-audio"),
      stopBtn: host.querySelector("button")
    };
  };

  const initBackgroundPlayerBridge = () => {
    if (pageId === "5") {
      return;
    }

    const fromStorage = readStorageJson(PLAYER_STATE_KEY, null);
    const fromUrl = readPlayerStateFromUrl();
    const state = (fromStorage && isLikelyAudioUrl(fromStorage.src))
      ? fromStorage
      : ((fromUrl && isLikelyAudioUrl(fromUrl.src)) ? fromUrl : null);

    if (!state) {
      return;
    }

    writeStorageJson(PLAYER_STATE_KEY, state);
    relayPlayerState(state);

    const floating = ensureFloatingPlayer();
    const audio = floating.audio;
    const titleNode = floating.title;
    const stopBtn = floating.stopBtn;
    const tracks = normalizePlaylistTracks(readStorageJson(PLAYER_TRACKS_KEY, []));

    let currentTrackIndex = Number.isFinite(Number(state.trackIndex)) ? Number(state.trackIndex) : null;
    let currentTitle = state.title || "Музыка из плейлиста";

    titleNode.textContent = `Сейчас: ${currentTitle}`;
    audio.src = state.src;

    const startFrom = Number(state.currentTime);
    if (Number.isFinite(startFrom) && startFrom > 0) {
      audio.currentTime = startFrom;
    }

    const persistState = () => {
      savePlayerState(audio, {
        trackIndex: currentTrackIndex,
        title: currentTitle
      });
    };

    const playNext = () => {
      const saved = readStorageJson(PLAYER_STATE_KEY, null);
      const activeIndex = Number.isFinite(Number(saved?.trackIndex)) ? Number(saved.trackIndex) : currentTrackIndex;
      const next = findNextPlayableTrack(tracks, activeIndex);
      if (!next) {
        clearPlayerStateEverywhere();
        return;
      }

      titleNode.textContent = `Сейчас: ${next.title || "Трек"}`;
      audio.src = next.url;
      audio.currentTime = 0;
      currentTrackIndex = next.trackIndex;
      currentTitle = next.title || "Трек";
      savePlayerState(audio, {
        trackIndex: currentTrackIndex,
        title: currentTitle
      });
      audio.play().catch(() => {
        persistState();
      });
    };

    stopBtn.addEventListener("click", () => {
      audio.pause();
      audio.currentTime = 0;
      audio.removeAttribute("src");
      clearPlayerStateEverywhere();
      titleNode.textContent = "Музыка остановлена";
    });

    audio.addEventListener("timeupdate", persistState);
    audio.addEventListener("play", persistState);
    audio.addEventListener("pause", persistState);
    audio.addEventListener("ended", playNext);
    audio.addEventListener("error", persistState);
    window.addEventListener("beforeunload", persistState);

    if (state.isPlaying) {
      audio.play().catch(() => {
        persistState();
      });
    }
  };

  function initPageFive() {
    const playlist = document.getElementById("playlist");
    const trackStatus = document.getElementById("track-status");
    const audio = document.getElementById("playlist-audio");

    if (!playlist || !trackStatus || !audio) {
      return;
    }

    const trackButtons = Array.from(playlist.querySelectorAll(".track-btn"))
      .sort((a, b) => Number(a.dataset.track) - Number(b.dataset.track));

    const playlistTracks = normalizePlaylistTracks(trackButtons.map((button) => ({
      trackIndex: Number(button.dataset.track),
      title: button.textContent.trim(),
      url: (button.dataset.audioUrl || "").trim()
    })));
    writeStorageJson(PLAYER_TRACKS_KEY, playlistTracks);

    let activeTrackIndex = null;

    const clearPlayingState = () => {
      playlist.querySelectorAll(".track-item").forEach((item) => {
        item.classList.remove("is-playing");
      });
    };

    const setPlayingState = (trackIndex) => {
      clearPlayingState();
      const button = trackButtons.find((btn) => Number(btn.dataset.track) === trackIndex);
      if (!button) {
        return;
      }
      const item = button.closest(".track-item");
      if (item) {
        item.classList.add("is-playing");
      }
    };

    const getTrackByIndex = (trackIndex) => (
      playlistTracks.find((track) => track.trackIndex === trackIndex) || null
    );

    const persistState = () => {
      if (typeof activeTrackIndex !== "number") {
        return;
      }

      const activeTrack = getTrackByIndex(activeTrackIndex);
      if (!activeTrack) {
        return;
      }

      savePlayerState(audio, {
        trackIndex: activeTrackIndex,
        title: activeTrack.title
      });
    };

    const playTrack = (trackIndex, reason = "manual") => {
      const track = getTrackByIndex(trackIndex);
      if (!track || !track.url) {
        activeTrackIndex = null;
        clearPlayingState();
        trackStatus.textContent = "У этого трека нет ссылки на аудио.";
        return;
      }

      activeTrackIndex = trackIndex;
      if (audio.src !== track.url) {
        audio.src = track.url;
      }

      trackStatus.textContent = reason === "auto"
        ? `Следующий трек: ${track.title}`
        : `Загружаю: ${track.title}`;

      audio.play().catch(() => {
        clearPlayingState();
        trackStatus.textContent = "Не удалось воспроизвести ссылку. Проверь, что это прямая ссылка на mp3/m4a/ogg.";
      });
    };

    const restoreFromSavedState = () => {
      const fromStorage = readStorageJson(PLAYER_STATE_KEY, null);
      const fromUrl = readPlayerStateFromUrl();
      const saved = (fromStorage && isLikelyAudioUrl(fromStorage.src))
        ? fromStorage
        : ((fromUrl && isLikelyAudioUrl(fromUrl.src)) ? fromUrl : null);

      if (!saved) {
        return;
      }

      const savedIndex = Number(saved.trackIndex);
      const trackFromState = Number.isFinite(savedIndex)
        ? getTrackByIndex(savedIndex)
        : playlistTracks.find((track) => track.url && track.url === saved.src);

      if (!trackFromState || !trackFromState.url) {
        return;
      }

      activeTrackIndex = trackFromState.trackIndex;
      audio.src = trackFromState.url;
      const savedTime = Number(saved.currentTime);
      if (Number.isFinite(savedTime) && savedTime > 0) {
        audio.currentTime = savedTime;
      }

      trackStatus.textContent = saved.isPlaying
        ? `Возобновляю: ${trackFromState.title}`
        : `Готово к продолжению: ${trackFromState.title}`;

      if (saved.isPlaying) {
        audio.play().catch(() => {
          trackStatus.textContent = `Нажми Play, чтобы продолжить: ${trackFromState.title}`;
        });
      }
    };

    audio.addEventListener("play", () => {
      if (typeof activeTrackIndex === "number") {
        const track = getTrackByIndex(activeTrackIndex);
        setPlayingState(activeTrackIndex);
        trackStatus.textContent = `Играет: ${track ? track.title : "Трек"}`;
        persistState();
      }
    });

    audio.addEventListener("pause", () => {
      if (audio.ended) {
        return;
      }

      clearPlayingState();
      if (typeof activeTrackIndex === "number") {
        const track = getTrackByIndex(activeTrackIndex);
        trackStatus.textContent = `Пауза: ${track ? track.title : "Трек"}`;
        persistState();
      }
    });

    audio.addEventListener("timeupdate", persistState);

    audio.addEventListener("ended", () => {
      clearPlayingState();
      if (typeof activeTrackIndex !== "number") {
        return;
      }

      const nextTrack = findNextPlayableTrack(playlistTracks, activeTrackIndex);
      if (!nextTrack) {
        activeTrackIndex = null;
        trackStatus.textContent = "Треки закончились.";
        clearPlayerStateEverywhere();
        return;
      }

      playTrack(nextTrack.trackIndex, "auto");
    });

    audio.addEventListener("error", () => {
      clearPlayingState();
      trackStatus.textContent = "Не удалось воспроизвести ссылку. Проверь, что это прямая ссылка на mp3/m4a/ogg.";
      persistState();
    });

    playlist.addEventListener("click", (event) => {
      const button = event.target.closest(".track-btn");
      if (!button) {
        return;
      }

      const clickedTrackIndex = Number(button.dataset.track);
      if (!Number.isFinite(clickedTrackIndex)) {
        return;
      }

      const clickedTrack = getTrackByIndex(clickedTrackIndex);
      if (!clickedTrack || !clickedTrack.url) {
        trackStatus.textContent = "У этого трека нет ссылки на аудио.";
        return;
      }

      if (activeTrackIndex === clickedTrackIndex && !audio.paused) {
        audio.pause();
        return;
      }

      if (activeTrackIndex === clickedTrackIndex && audio.paused) {
        audio.play().catch(() => {
          trackStatus.textContent = "Не удалось продолжить трек. Проверь ссылку.";
        });
        return;
      }

      playTrack(clickedTrackIndex, "manual");
    });

    window.addEventListener("beforeunload", persistState);
    restoreFromSavedState();

    if (!playlistTracks.some((track) => track.url)) {
      trackStatus.textContent = "Добавь прямые ссылки на аудио в data-audio-url у треков.";
    }
  }

  initPageThree();
  initPageFive();
  initBackgroundPlayerBridge();
})();
