const AudioPlayer = {
  currentAlbum: null,
  currentTrackIndex: -1,
  tracks: [],
  isPlaying: false,
  audioElement: null,
  playlist: [],
  serverUrl: null,
  playerAvailable: false,
  pendingAction: null,
  panelUpdateInterval: null,
  lastPlaylistLength: 0,
  lastCurrentFilePath: null,
  initialized: false,

  getServerUrl() {
    if (!this.serverUrl) {
      this.serverUrl = `http://${window.location.hostname}:${window.location.port}`;
    }
    return this.serverUrl;
  },

  async checkPlayerAvailable() {
    try {
      const response = await fetch(`${this.getServerUrl()}/api/playbackState`);
      if (response.ok) {
        const data = await response.json();
        this.playerAvailable = data.success === true;
        return this.playerAvailable;
      }
    } catch (error) {
      console.log("[AudioPlayer] Player not available:", error.message);
    }
    this.playerAvailable = false;
    return false;
  },

  async sendToPlayer(endpoint, data = null, method = "POST") {
    if (!this.playerAvailable) {
      await this.checkPlayerAvailable();
      if (!this.playerAvailable) return null;
    }
    try {
      const url = `${this.getServerUrl()}${endpoint}`;
      const options = {
        method: method,
        headers: { "Content-Type": "application/json" },
      };
      if (data && method === "POST") {
        options.body = JSON.stringify(data);
      }
      const response = await fetch(url, options);
      const result = await response.json();
      return result;
    } catch (error) {
      console.error(`Player API error: ${endpoint}`, error);
      this.playerAvailable = false;
      return null;
    }
  },

  async getPlaybackState() {
    return await this.sendToPlayer("/api/playbackState", null, "GET");
  },

  async getPlaylist() {
    return await this.sendToPlayer("/api/getPlaylist", null, "GET");
  },

  async getCurrentTrack() {
    return await this.sendToPlayer("/api/currentTrack", null, "GET");
  },

  async getCurrentTime() {
    return await this.sendToPlayer("/api/currentTime", null, "GET");
  },

  async play() {
    return await this.sendToPlayer("/api/play");
  },

  async pause() {
    return await this.sendToPlayer("/api/pause");
  },

  async stop() {
    return await this.sendToPlayer("/api/stop");
  },

  async next() {
    return await this.sendToPlayer("/api/next");
  },

  async previous() {
    return await this.sendToPlayer("/api/previous");
  },

  async setPlaylist(tracks) {
    return await this.sendToPlayer("/api/setPlaylist", { tracks: tracks });
  },

  async addToPlaylist(track) {
    return await this.sendToPlayer("/api/addToPlaylist", { track: track });
  },

  async addAfterCurrent(track) {
    return await this.sendToPlayer("/api/addAfterCurrent", { track: track });
  },

  async clearPlaylist() {
    return await this.sendToPlayer("/api/clear");
  },

  async playIndex(index) {
    return await this.sendToPlayer("/api/playIndex", { index: index });
  },

  async replacePlaylistWithTrack(track) {
    return await this.sendToPlayer("/api/track", { track: track });
  },

  async ensurePlayerRunning() {
    const available = await this.checkPlayerAvailable();
    if (available) return true;
    Utils.showNotification("Плеер недоступен, проверьте подключение", "error");
    return false;
  },

  async playSingleTrack(album, trackIndex) {
    const track = album.tracks[trackIndex];
    const started = await this.ensurePlayerRunning();
    if (!started) return;
    const result = await this.replacePlaylistWithTrack(track.path);
    if (result && result.success) {
      Utils.showNotification(`Воспроизведение: ${track.name}`, "success");
      this.currentAlbum = album;
      this.tracks = [...album.tracks];
      this.currentTrackIndex = trackIndex;
      await this.updateUI();
      if (typeof PlaylistViewer !== "undefined") {
        PlaylistViewer.refresh();
      }
    }
  },

  async addAlbumToPlaylist(album) {
    const started = await this.ensurePlayerRunning();
    if (!started) return;
    let addedCount = 0;
    for (const track of album.tracks) {
      const result = await this.addToPlaylist(track.path);
      if (result && result.success) addedCount++;
      await this.delay(100);
    }
    Utils.showNotification(`Добавлено ${addedCount} треков`, "success");
    if (typeof PlaylistViewer !== "undefined") {
      await this.delay(500);
      PlaylistViewer.refresh();
    }
  },

  async replacePlaylistWithAlbum(album) {
    const started = await this.ensurePlayerRunning();
    if (!started) return;
    const trackPaths = album.tracks.map((t) => t.path);
    const result = await this.setPlaylist(trackPaths);
    if (result && result.success) {
      Utils.showNotification(`Плейлист заменен: ${album.title}`, "success");
      this.currentAlbum = album;
      this.tracks = [...album.tracks];
      this.currentTrackIndex = 0;
      if (typeof PlaylistViewer !== "undefined") {
        PlaylistViewer.refresh();
      }
      await this.updateUI();
    }
  },

  async replacePlaylistWithTrack(album, trackIndex) {
    const track = album.tracks[trackIndex];
    const started = await this.ensurePlayerRunning();
    if (!started) return;
    const result = await this.replacePlaylistWithTrack(track.path);
    if (result && result.success) {
      Utils.showNotification(`Плейлист заменен: ${track.name}`, "success");
      if (typeof PlaylistViewer !== "undefined") {
        PlaylistViewer.refresh();
      }
    }
  },

  async addTrackAfterCurrent(album, trackIndex) {
    const track = album.tracks[trackIndex];
    const started = await this.ensurePlayerRunning();
    if (!started) return;
    const result = await this.addAfterCurrent(track.path);
    if (result && result.success) {
      Utils.showNotification(`Трек добавлен: ${track.name}`, "success");
      if (typeof PlaylistViewer !== "undefined") {
        PlaylistViewer.refresh();
      }
    }
  },

  async togglePlayPause() {
    const state = await this.getPlaybackState();
    if (state && state.data) {
      if (state.data.isPlaying) {
        await this.pause();
      } else {
        await this.play();
      }
    }
    await this.updateUI();
  },

  async nextTrack() {
    await this.next();
    await this.delay(200);
    await this.updateUI();
    if (typeof PlaylistViewer !== "undefined") {
      PlaylistViewer.refresh();
    }
  },

  async previousTrack() {
    await this.previous();
    await this.delay(200);
    await this.updateUI();
    if (typeof PlaylistViewer !== "undefined") {
      PlaylistViewer.refresh();
    }
  },

  async stopPlayback() {
    await this.stop();
    await this.updateUI();
  },

  async init() {
    if (this.initialized) return;
    this.initialized = true;
    await this.checkPlayerAvailable();
    this.setupEventListeners();
    this.initUI();
    await this.updateUI();
    if (this.playerAvailable) {
      this.startStatusPolling();
    }
  },

  setupEventListeners() {
    const playBtn = document.getElementById("playerPlayBtn");
    const prevBtn = document.getElementById("playerPrevBtn");
    const nextBtn = document.getElementById("playerNextBtn");
    const stopBtn = document.getElementById("playerStopBtn");
    if (playBtn)
      playBtn.addEventListener("click", () => this.togglePlayPause());
    if (prevBtn) prevBtn.addEventListener("click", () => this.previousTrack());
    if (nextBtn) nextBtn.addEventListener("click", () => this.nextTrack());
    if (stopBtn) stopBtn.addEventListener("click", () => this.stopPlayback());
  },

  startStatusPolling() {
    if (this.panelUpdateInterval) clearInterval(this.panelUpdateInterval);
    this.panelUpdateInterval = setInterval(() => this.updateUI(), 1000);
  },

  async updateUI() {
    if (!this.playerAvailable) {
      await this.checkPlayerAvailable();
      if (!this.playerAvailable) {
        const panel = document.getElementById("audioPlayerControlPanel");
        if (panel) panel.classList.remove("active");
        return;
      }
    }
    const state = await this.getPlaybackState();
    if (!state || !state.success) return;
    const hasTracks = state.data && state.data.currentTrack;
    const panel = document.getElementById("audioPlayerControlPanel");
    if (!hasTracks) {
      if (panel) panel.classList.remove("active");
      return;
    }
    if (panel && !panel.classList.contains("active")) {
      panel.classList.add("active");
    }
    const trackInfo = await this.getCurrentTrack();
    const timeInfo = await this.getCurrentTime();
    if (trackInfo && trackInfo.success && trackInfo.data) {
      const trackName = trackInfo.data.track
        ? trackInfo.data.track.split("/").pop()
        : "—";
      if (this.panelTrackName) this.panelTrackName.textContent = trackName;
    }
    if (timeInfo && timeInfo.success && timeInfo.data) {
      if (this.panelTimeCurrent) {
        this.panelTimeCurrent.textContent = this.formatTime(
          timeInfo.data.currentTime || 0,
        );
      }
      if (this.panelProgressFill && timeInfo.data.duration) {
        const percent =
          (timeInfo.data.currentTime / timeInfo.data.duration) * 100;
        this.panelProgressFill.style.width = percent + "%";
      }
    }
    if (state && state.data) {
      if (this.panelPlayPauseBtn) {
        if (state.data.isPlaying) {
          this.panelPlayPauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
        } else {
          this.panelPlayPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
        }
      }
    }
  },

  initUI() {
    this.panelPlayPauseBtn = document.getElementById("panelPlayPauseBtn");
    this.panelPrevBtn = document.getElementById("panelPrevBtn");
    this.panelNextBtn = document.getElementById("panelNextBtn");
    this.panelStopBtn = document.getElementById("panelStopBtn");
    this.panelClearBtn = document.getElementById("panelClearBtn");
    this.panelProgressBar = document.getElementById("panelProgressBar");
    this.panelTrackName = document.getElementById("panelTrackName");
    this.panelTrackArtist = document.getElementById("panelTrackArtist");
    this.panelTimeCurrent = document.getElementById("panelTimeCurrent");
    this.panelTimeTotal = document.getElementById("panelTimeTotal");
    this.panelProgressFill = document.getElementById("panelProgressFill");
    if (this.panelPlayPauseBtn) {
      this.panelPlayPauseBtn.addEventListener("click", () =>
        this.togglePlayPause(),
      );
    }
    if (this.panelPrevBtn) {
      this.panelPrevBtn.addEventListener("click", () => this.previousTrack());
    }
    if (this.panelNextBtn) {
      this.panelNextBtn.addEventListener("click", () => this.nextTrack());
    }
    if (this.panelStopBtn) {
      this.panelStopBtn.addEventListener("click", () => this.stopPlayback());
    }
    if (this.panelClearBtn) {
      this.panelClearBtn.addEventListener("click", () => this.clearPlaylist());
    }
  },

  async clearPlaylist() {
    await this.clearPlaylist();
    if (typeof PlaylistViewer !== "undefined") {
      PlaylistViewer.refresh();
    }
    Utils.showNotification("Плейлист очищен", "success");
    await this.updateUI();
  },

  formatTime(seconds) {
    if (!seconds || seconds < 0) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  },

  delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  },
};
