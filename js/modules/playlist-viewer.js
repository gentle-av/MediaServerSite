const PlaylistViewer = {
  playlist: [],
  currentIndex: -1,
  updateInterval: null,
  initialized: false,
  playerAvailable: false,

  getServerUrl() {
    return `http://${window.location.hostname}:${window.location.port}`;
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
      console.log("[PlaylistViewer] Player not available");
    }
    this.playerAvailable = false;
    return false;
  },

  async getPlaylist() {
    if (!this.playerAvailable) return null;
    try {
      const response = await fetch(`${this.getServerUrl()}/api/getPlaylist`);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error getting playlist:", error);
      return null;
    }
  },

  async refresh() {
    const available = await this.checkPlayerAvailable();
    if (!available) {
      this.showEmptyPlaylist("Плеер недоступен");
      return;
    }
    const playlistData = await this.getPlaylist();
    if (playlistData && playlistData.success && playlistData.data) {
      this.renderPlaylist(playlistData.data);
    } else {
      this.showEmptyPlaylist("Плейлист пуст");
    }
  },

  renderPlaylist(playlist) {
    const container = document.getElementById("playlistContainer");
    if (!container) return;
    if (
      !playlist ||
      (playlist.isArray && playlist.length === 0) ||
      (playlist.tracks && playlist.tracks.length === 0)
    ) {
      this.showEmptyPlaylist("Плейлист пуст");
      return;
    }
    const tracks = playlist.tracks || playlist;
    let html = `<div class="playlist-tracks-list">`;
    for (let i = 0; i < tracks.length; i++) {
      const track = tracks[i];
      const trackName =
        typeof track === "string"
          ? track.split("/").pop()
          : track.name || track.title || "Неизвестный трек";
      html += `
        <div class="playlist-track-item" data-index="${i}">
          <div class="playlist-track-number">${i + 1}</div>
          <div class="playlist-track-info">
            <div class="playlist-track-name">${this.escapeHtml(trackName)}</div>
          </div>
          <div class="playlist-track-remove-btn" data-index="${i}">
            <i class="fas fa-trash"></i>
          </div>
        </div>
      `;
    }
    html += `</div>`;
    container.innerHTML = html;
    this.attachPlaylistEvents();
  },

  attachPlaylistEvents() {
    const container = document.getElementById("playlistContainer");
    if (!container) return;
    container.querySelectorAll(".playlist-track-item").forEach((item) => {
      const newItem = item.cloneNode(true);
      item.parentNode.replaceChild(newItem, item);
      newItem.addEventListener("click", async (e) => {
        if (e.target.closest(".playlist-track-remove-btn")) return;
        const index = parseInt(newItem.dataset.index);
        await this.playTrack(index);
      });
    });
    container.querySelectorAll(".playlist-track-remove-btn").forEach((btn) => {
      const newBtn = btn.cloneNode(true);
      btn.parentNode.replaceChild(newBtn, btn);
      newBtn.addEventListener("click", async (e) => {
        e.stopPropagation();
        const index = parseInt(newBtn.dataset.index);
        await this.removeTrack(index);
      });
    });
  },

  async playTrack(index) {
    try {
      const response = await fetch(`${this.getServerUrl()}/api/playIndex`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ index: index }),
      });
      const data = await response.json();
      if (data.success && typeof AudioPlayer !== "undefined") {
        AudioPlayer.updateUI();
      }
    } catch (error) {
      console.error("Error playing track:", error);
    }
  },

  async removeTrack(index) {
    Utils.showNotification("Удаление трека пока не реализовано", "info");
  },

  showEmptyPlaylist(message) {
    const container = document.getElementById("playlistContainer");
    if (!container) return;
    container.innerHTML = `
      <div class="playlist-empty">
        <i class="fas fa-music" style="font-size: 48px; opacity: 0.5;"></i>
        <p>${message}</p>
        <small>Нажмите на альбом, чтобы начать воспроизведение</small>
      </div>
    `;
  },

  showPlaylistSection() {
    const modal = document.getElementById("albumModal");
    if (modal && modal.classList.contains("active")) {
      modal.classList.remove("active");
    }
    const playlistSection = document.getElementById("playlistSection");
    if (playlistSection) {
      playlistSection.style.display = "block";
      const playlistToggleBtn = document.getElementById("playlistToggleBtn");
      if (playlistToggleBtn) playlistToggleBtn.classList.add("active");
      this.init();
      setTimeout(() => this.refresh(), 100);
      setTimeout(() => {
        if (
          playlistSection &&
          typeof playlistSection.scrollIntoView === "function"
        ) {
          try {
            playlistSection.scrollIntoView({
              behavior: "smooth",
              block: "start",
            });
          } catch (e) {
            console.error("scrollIntoView error:", e);
          }
        }
      }, 200);
    }
  },

  async init() {
    if (this.initialized) return;
    this.initialized = true;
    this.showEmptyPlaylist("Плейлист пуст");
    await this.refresh();
  },

  escapeHtml(str) {
    if (!str) return "";
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  },

  delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  },
};
