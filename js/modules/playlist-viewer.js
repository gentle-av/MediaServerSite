const PlaylistViewer = {
  musiumUrl: null,
  musiumAvailable: false,
  playlist: [],
  currentIndex: -1,
  updateInterval: null,
  mediaServerUrl: null,
  initialized: false,
  retryCount: 0,
  maxRetries: 5,

  getMusiumUrl() {
    if (this.musiumUrl) return this.musiumUrl;
    if (typeof AudioPlayer !== "undefined" && AudioPlayer.musiumUrl) {
      this.musiumUrl = AudioPlayer.musiumUrl;
      return this.musiumUrl;
    }
    return `http://${window.location.hostname}:8084`;
  },

  setMusiumUrl(url) {
    this.musiumUrl = url;
  },

  async callMusium(endpoint, method = "GET", data = null) {
    try {
      const url = `${this.getMusiumUrl()}${endpoint}`;
      const options = {
        method: method,
        headers: { "Content-Type": "application/json" },
      };
      if (method === "POST" && data) {
        options.body = JSON.stringify(data);
      }
      const response = await fetch(url, options);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error(`Musium error for ${endpoint}:`, error);
      return null;
    }
  },

  async fetchTrackMetadata(path) {
    try {
      const url = `${this.getMediaServerUrl()}/api/music/info?path=${encodeURIComponent(path)}`;
      const response = await fetch(url, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });
      const data = await response.json();
      if (data.status === "success") {
        return {
          name: data.title || data.filename,
          artist: data.artist || "Unknown",
          duration: data.duration || 0,
        };
      }
      return null;
    } catch (error) {
      console.error("Error fetching metadata:", error);
      return null;
    }
  },

  async getTrackDuration(filePath) {
    try {
      const url = `${this.getMediaServerUrl()}/api/music/info?path=${encodeURIComponent(filePath)}`;
      const response = await fetch(url, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });
      const data = await response.json();
      if (data.status === "success" && data.duration) {
        return data.duration;
      }
      return 0;
    } catch (error) {
      console.error("Error fetching duration:", error);
      return 0;
    }
  },

  getMediaServerUrl() {
    if (this.mediaServerUrl) return this.mediaServerUrl;
    return `http://${window.location.hostname}:${window.location.port}`;
  },

  setMediaServerUrl(url) {
    this.mediaServerUrl = url;
  },

  async enrichPlaylistWithMetadata(playlistData) {
    if (!playlistData || !playlistData.playlist) return playlistData;
    for (let i = 0; i < playlistData.playlist.length; i++) {
      const track = playlistData.playlist[i];
      if (track.duration && track.duration > 0) {
        continue;
      }
      try {
        const url = `${this.getMediaServerUrl()}/api/music/file-metadata?path=${encodeURIComponent(track.path)}`;
        const response = await fetch(url);
        const data = await response.json();
        if (data.status === "success" && data.data && data.data.file) {
          track.duration = data.data.file.duration || 0;
          if (!track.title && data.data.file.title)
            track.title = data.data.file.title;
          if (!track.artist && data.data.file.artist)
            track.artist = data.data.file.artist;
        }
        await this.delay(50);
      } catch (e) {
        console.error("Failed to get metadata for:", track.path, e);
      }
      if (track.name && track.name.match(/\.(flac|mp3|m4a|wav)$/i)) {
        track.name = track.name.replace(/\.(flac|mp3|m4a|wav)$/i, "");
        track.title = track.name;
      }
    }
    return playlistData;
  },

  async checkMusiumAvailable() {
    try {
      const result = await this.callMusium("/api/playbackState", "GET");
      if (result && result.success) {
        this.musiumAvailable = true;
        this.retryCount = 0;
        this.startAutoUpdate();
        return true;
      }
    } catch (error) {
      console.log("Musium not running:", error.message);
    }
    this.musiumAvailable = false;
    this.stopAutoUpdate();
    return false;
  },

  setupCloseHandler() {
    const closeBtn = document.getElementById("playlistSidebarClose");
    const overlay = document.getElementById("playlistOverlay");
    if (closeBtn) {
      const newCloseBtn = closeBtn.cloneNode(true);
      closeBtn.parentNode.replaceChild(newCloseBtn, closeBtn);
      newCloseBtn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.closePlaylist();
      });
    }
    if (overlay) {
      const newOverlay = overlay.cloneNode(true);
      overlay.parentNode.replaceChild(newOverlay, overlay);
      newOverlay.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.closePlaylist();
      });
    }
  },

  closePlaylist() {
    const sidebar = document.getElementById("playlistSidebar");
    const overlay = document.getElementById("playlistOverlay");
    if (sidebar) sidebar.classList.remove("open");
    if (overlay) overlay.classList.remove("open");
  },

  async refresh() {
    console.log("PlaylistViewer.refresh called");
    const available = await this.checkMusiumAvailable();
    if (available) {
      await this.updateDisplay();
      if (typeof AudioPlayer !== "undefined") {
        setTimeout(() => {
          AudioPlayer.updateUI();
        }, 100);
      }
    } else {
      const container = document.getElementById("playlistContainer");
      if (container) {
        if (this.retryCount < this.maxRetries) {
          this.retryCount++;
          container.innerHTML = `<div class="playlist-empty"><i class="fas fa-spinner fa-spin"></i><p>Подключение к аудиоплееру... (${this.retryCount}/${this.maxRetries})</p></div>`;
          setTimeout(() => this.refresh(), 2000);
        } else {
          container.innerHTML = `<div class="playlist-empty"><i class="fas fa-exclamation-triangle"></i><p>Аудиоплеер не запущен</p><p class="playlist-empty-hint">Нажмите "Добавить в плейлист" чтобы запустить</p></div>`;
        }
      }
      if (typeof AudioPlayer !== "undefined") {
        setTimeout(() => {
          AudioPlayer.updateUI();
        }, 100);
      }
    }
  },

  async fetchPlaylist() {
    if (!this.musiumAvailable) return null;
    const result = await this.callMusium("/api/getPlaylist", "GET");
    if (result && result.success && result.data) {
      this.playlist = result.data.playlist || [];
      this.currentIndex = result.data.currentIndex || -1;
      return result.data;
    }
    return null;
  },

  async fetchStatus() {
    if (!this.musiumAvailable) return null;
    const result = await this.callMusium("/api/playbackState", "GET");
    if (result && result.success && result.data) {
      return result.data;
    }
    return null;
  },

  async sendCommand(endpoint, data = {}) {
    if (!this.musiumAvailable) return null;
    const result = await this.callMusium(endpoint, "POST", data);
    return result;
  },

  async playTrack(index) {
    console.log(`Play track at index: ${index}`);
    await this.sendCommand("/api/playIndex", { index: index });
    await this.delay(200);
    await this.updateDisplay();
    if (typeof AudioPlayer !== "undefined") {
      AudioPlayer.updateUI();
    }
  },

  async removeTrack(index) {
    console.log(`Remove track at index: ${index}`);
    const trackElement = document.getElementById(`track-${index}`);
    let scrollPosition = 0;
    if (trackElement) {
      scrollPosition = trackElement.offsetTop;
    }
    await this.sendCommand("/api/remove", { index: index });
    await this.fetchPlaylist();
    await this.updateDisplay();
    const container = document.getElementById("playlistContainer");
    if (container && scrollPosition > 0) {
      container.scrollTop = scrollPosition;
    }
  },

  async clearPlaylist() {
    console.log("Clear playlist");
    await this.sendCommand("/api/clear");
    await this.fetchPlaylist();
    await this.updateDisplay();
  },

  async previousTrack() {
    console.log("Previous track");
    await this.sendCommand("/api/previous");
    await this.delay(200);
    await this.updateDisplay();
    if (typeof AudioPlayer !== "undefined") {
      AudioPlayer.updateUI();
    }
  },

  async nextTrack() {
    console.log("Next track");
    await this.sendCommand("/api/next");
    await this.delay(200);
    await this.updateDisplay();
    if (typeof AudioPlayer !== "undefined") {
      AudioPlayer.updateUI();
    }
  },

  delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  },

  async playPause() {
    console.log("playPause called");
    const status = await this.fetchStatus();
    if (status && status.isPlaying) {
      await this.sendCommand("/api/pause");
    } else {
      await this.sendCommand("/api/play");
    }
    await this.updateProgress();
  },

  async stopPlayback() {
    console.log("Stop playback");
    await this.sendCommand("/api/stop");
    await this.refresh();
  },

  formatTime(seconds) {
    if (!seconds || seconds < 0) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  },

  escapeHtml(str) {
    if (!str) return "";
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  },

  async updateDisplay() {
    const container = document.getElementById("playlistContainer");
    if (!container) {
      return;
    }
    const savedScrollTop = container.scrollTop;
    let playlistData = await this.fetchPlaylist();
    const status = await this.fetchStatus();
    if (!playlistData || playlistData.playlist.length === 0) {
      container.innerHTML = `<div class="playlist-empty"><i class="fas fa-music"></i><p>Плейлист пуст</p><p class="playlist-empty-hint">Добавьте треки из библиотеки</p></div>`;
      return;
    }
    playlistData = await this.enrichPlaylistWithMetadata(playlistData);
    let currentTrackDisplay = "—";
    let currentArtistName = "";
    let currentTrackId = null;
    if (
      playlistData.currentIndex >= 0 &&
      playlistData.playlist[playlistData.currentIndex]
    ) {
      const currentTrack = playlistData.playlist[playlistData.currentIndex];
      let trackName =
        currentTrack.title || currentTrack.name || currentTrack.filename || "—";
      if (trackName && trackName.match(/\.(flac|mp3|m4a|wav)$/i)) {
        trackName = trackName.replace(/\.(flac|mp3|m4a|wav)$/i, "");
      }
      currentTrackDisplay = trackName;
      if (currentTrack.artist && currentTrack.artist !== "Unknown")
        currentArtistName = currentTrack.artist;
      currentTrackId = `track-${playlistData.currentIndex}`;
    }
    let html = `<div class="playlist-controls"><button class="playlist-control-btn" id="playlistPlayPauseBtn" title="${status && status.isPlaying ? "Пауза" : "Воспроизвести"}"><i class="fas ${status && status.isPlaying ? "fa-pause" : "fa-play"}"></i></button><button class="playlist-control-btn" id="playlistPrevBtn" title="Предыдущий"><i class="fas fa-step-backward"></i></button><button class="playlist-control-btn" id="playlistNextBtn" title="Следующий"><i class="fas fa-step-forward"></i></button><button class="playlist-control-btn" id="playlistStopBtn" title="Стоп"><i class="fas fa-stop"></i></button><button class="playlist-control-btn" id="playlistClearBtn" title="Очистить плейлист"><i class="fas fa-trash-alt"></i></button></div><div class="playlist-info"><div class="playlist-current-track"><i class="fas fa-headphones"></i><div class="playlist-current-info"><div class="playlist-current-name" id="playlistCurrentName">${this.escapeHtml(currentTrackDisplay)}</div>${currentArtistName ? `<div class="playlist-current-artist" id="playlistCurrentArtist">${this.escapeHtml(currentArtistName)}</div>` : ""}</div></div><div class="playlist-progress"><span id="playlistCurrentTime">${this.formatTime(status ? status.position : 0)}</span><div class="progress-bar" id="playlistProgressBar"><div class="progress-fill" id="playlistProgressFill" style="width: ${status && status.duration ? (status.position / status.duration) * 100 : 0}%"></div></div><span id="playlistTotalTime">${this.formatTime(status ? status.duration : 0)}</span></div></div><div class="playlist-tracks" id="playlistTracksList">`;
    const tracksByArtist = new Map();
    for (let idx = 0; idx < playlistData.playlist.length; idx++) {
      const track = playlistData.playlist[idx];
      const artist =
        track.artist && track.artist !== "Unknown" ? track.artist : "Разное";
      if (!tracksByArtist.has(artist)) {
        tracksByArtist.set(artist, []);
      }
      tracksByArtist.get(artist).push({ idx, track });
    }
    let globalTrackIndex = 0;
    for (const [artist, tracks] of tracksByArtist) {
      html += `<div class="playlist-artist-group"><div class="playlist-artist-header" data-artist="${this.escapeHtml(artist)}"><i class="fas fa-user group-icon"></i><span class="playlist-artist-name">${this.escapeHtml(artist)}</span><i class="fas fa-chevron-down group-arrow"></i></div><div class="playlist-artist-tracks">`;
      for (const { idx, track } of tracks) {
        const isCurrent = idx === playlistData.currentIndex;
        const trackNumber = track.track || globalTrackIndex + 1;
        let trackName =
          track.title ||
          track.name ||
          track.filename ||
          `Трек ${globalTrackIndex + 1}`;
        if (trackName && trackName.match(/\.(flac|mp3|m4a|wav)$/i)) {
          trackName = trackName.replace(/\.(flac|mp3|m4a|wav)$/i, "");
        }
        const trackDuration = track.duration || 0;
        const currentClass = isCurrent ? "current" : "";
        html += `<div class="playlist-track ${currentClass}" data-index="${idx}" id="track-${idx}">
            <div class="playlist-track-number">${trackNumber}</div>
            <div class="playlist-track-name" title="${this.escapeHtml(trackName)}">${this.escapeHtml(trackName)}</div>
            <div class="playlist-track-duration">${this.formatTime(trackDuration)}</div>
            <div class="playlist-track-controls">
              <button class="playlist-track-play" data-index="${idx}" title="Воспроизвести"><i class="fas fa-play"></i></button>
              <button class="playlist-track-remove" data-index="${idx}" title="Удалить"><i class="fas fa-trash"></i></button>
            </div>
        </div>`;
        globalTrackIndex++;
      }
      html += `</div></div>`;
    }
    html += `</div>`;
    container.innerHTML = html;
    if (currentTrackId) {
      const currentTrackElement = document.getElementById(currentTrackId);
      if (currentTrackElement) {
        currentTrackElement.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }
    } else if (savedScrollTop > 0) {
      container.scrollTop = savedScrollTop;
    }
    this.attachEventListeners();
    this.attachGroupToggleListeners();
  },

  attachGroupToggleListeners() {
    document.querySelectorAll(".playlist-artist-header").forEach((header) => {
      header.removeEventListener("click", this.handleGroupToggle);
      this.handleGroupToggle = (e) => {
        e.stopPropagation();
        header.classList.toggle("collapsed");
        const tracksContainer = header.nextElementSibling;
        if (
          tracksContainer &&
          tracksContainer.classList.contains("playlist-artist-tracks")
        ) {
          tracksContainer.classList.toggle("collapsed");
        }
        const arrow = header.querySelector(".group-arrow");
        if (arrow) {
          arrow.classList.toggle("rotated");
        }
      };
      header.addEventListener("click", this.handleGroupToggle);
    });
  },

  attachEventListeners() {
    const playPauseBtn = document.getElementById("playlistPlayPauseBtn");
    if (playPauseBtn) {
      playPauseBtn.removeEventListener("click", this.playPauseHandler);
      this.playPauseHandler = () => this.playPause();
      playPauseBtn.addEventListener("click", this.playPauseHandler);
    }
    const prevBtn = document.getElementById("playlistPrevBtn");
    if (prevBtn) {
      prevBtn.removeEventListener("click", this.prevHandler);
      this.prevHandler = () => this.previousTrack();
      prevBtn.addEventListener("click", this.prevHandler);
    }
    const nextBtn = document.getElementById("playlistNextBtn");
    if (nextBtn) {
      nextBtn.removeEventListener("click", this.nextHandler);
      this.nextHandler = () => this.nextTrack();
      nextBtn.addEventListener("click", this.nextHandler);
    }
    const stopBtn = document.getElementById("playlistStopBtn");
    if (stopBtn) {
      stopBtn.removeEventListener("click", this.stopHandler);
      this.stopHandler = () => this.stopPlayback();
      stopBtn.addEventListener("click", this.stopHandler);
    }
    const clearBtn = document.getElementById("playlistClearBtn");
    if (clearBtn) {
      clearBtn.removeEventListener("click", this.clearHandler);
      this.clearHandler = () => this.clearPlaylist();
      clearBtn.addEventListener("click", this.clearHandler);
    }
    document.querySelectorAll(".playlist-track-play").forEach((btn) => {
      btn.removeEventListener("click", this.handlePlayClick);
      this.handlePlayClick = async (e) => {
        e.stopPropagation();
        const index = parseInt(btn.dataset.index);
        await this.playTrack(index);
      };
      btn.addEventListener("click", this.handlePlayClick);
    });
    document.querySelectorAll(".playlist-track-remove").forEach((btn) => {
      btn.removeEventListener("click", this.handleRemoveClick);
      this.handleRemoveClick = async (e) => {
        e.stopPropagation();
        const index = parseInt(btn.dataset.index);
        await this.removeTrack(index);
      };
      btn.addEventListener("click", this.handleRemoveClick);
    });
    document.querySelectorAll(".playlist-track").forEach((track) => {
      track.removeEventListener("click", this.handleTrackClick);
      this.handleTrackClick = async () => {
        const index = parseInt(track.dataset.index);
        await this.playTrack(index);
      };
      track.addEventListener("click", this.handleTrackClick);
    });
  },

  async updateProgress() {
    const status = await this.fetchStatus();
    if (!status) return;
    const currentTimeSpan = document.getElementById("playlistCurrentTime");
    const totalTimeSpan = document.getElementById("playlistTotalTime");
    const progressFill = document.getElementById("playlistProgressFill");
    const playPauseBtn = document.getElementById("playlistPlayPauseBtn");
    if (currentTimeSpan) {
      currentTimeSpan.textContent = this.formatTime(status.position);
    }
    if (totalTimeSpan) {
      totalTimeSpan.textContent = this.formatTime(status.duration);
    }
    if (progressFill && status.duration > 0) {
      const percent = (status.position / status.duration) * 100;
      progressFill.style.width = percent + "%";
    }
    if (playPauseBtn) {
      if (status.isPlaying) {
        playPauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
        playPauseBtn.title = "Пауза";
      } else {
        playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
        playPauseBtn.title = "Воспроизвести";
      }
    }
  },

  startAutoUpdate() {
    this.stopAutoUpdate();
    this.updateInterval = setInterval(() => {
      this.updateProgress();
      this.updateCurrentTrackHighlight();
    }, 500);
  },

  stopAutoUpdate() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  },

  async updateCurrentTrackHighlight() {
    const status = await this.fetchStatus();
    if (!status) return;
    const currentIndex = status.currentIndex;
    document.querySelectorAll(".playlist-track").forEach((track) => {
      track.classList.remove("current");
    });
    const currentTrack = document.querySelector(
      `.playlist-track[data-index="${currentIndex}"]`,
    );
    if (currentTrack) {
      currentTrack.classList.add("current");
    }
    const playlistData = await this.fetchPlaylist();
    if (
      playlistData &&
      playlistData.playlist &&
      playlistData.playlist[currentIndex]
    ) {
      const currentTrackData = playlistData.playlist[currentIndex];
      let trackName =
        currentTrackData.title ||
        currentTrackData.name ||
        currentTrackData.filename ||
        "—";
      if (trackName && trackName.match(/\.(flac|mp3|m4a|wav)$/i)) {
        trackName = trackName.replace(/\.(flac|mp3|m4a|wav)$/i, "");
      }
      const trackArtist =
        currentTrackData.artist && currentTrackData.artist !== "Unknown"
          ? currentTrackData.artist
          : "";
      const currentTrackNameEl = document.querySelector(
        ".playlist-current-name",
      );
      const currentTrackArtistEl = document.querySelector(
        ".playlist-current-artist",
      );
      if (currentTrackNameEl) {
        currentTrackNameEl.textContent = trackName;
      }
      if (currentTrackArtistEl) {
        if (trackArtist) {
          currentTrackArtistEl.textContent = trackArtist;
          currentTrackArtistEl.style.display = "block";
        } else {
          currentTrackArtistEl.style.display = "none";
        }
      }
    }
  },

  reset() {
    this.initialized = false;
    this.musiumAvailable = false;
    this.playlist = [];
    this.currentIndex = -1;
  },

  async init() {
    console.log("[PlaylistViewer] init called, initialized:", this.initialized);
    if (this.initialized) {
      console.log("[PlaylistViewer] Already initialized, skipping");
      return;
    }
    this.initialized = true;
    console.log("PlaylistViewer.init called");
    if (typeof AudioPlayer !== "undefined" && AudioPlayer.musiumUrl) {
      this.setMusiumUrl(AudioPlayer.musiumUrl);
    }
    this.setupCloseHandler();
    await this.refresh();
  },
};
