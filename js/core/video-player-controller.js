class VideoPlayerController {
  constructor(apiClient, events) {
    this.api = apiClient;
    this.events = events;
    this.currentFile = null;
    this.isPlaying = false;
    this.isFullscreen = false;
    this.panel = null;
    this._isStarting = false;
    this._bindEvents();
    this._initPanel();
  }

  _initPanel() {
    this.panel = document.getElementById("playerControlPage");
    if (!this.panel) {
      const observer = new MutationObserver(() => {
        this.panel = document.getElementById("playerControlPage");
        if (this.panel) {
          this._bindUIEvents();
          observer.disconnect();
        }
      });
      observer.observe(document.body, { childList: true, subtree: true });
      setTimeout(() => observer.disconnect(), 5000);
    } else {
      this._bindUIEvents();
    }
  }

  _bindEvents() {
    this.events.on("playback:videoStart", (path) => this.startPlayback(path));
    this.events.on("player:show", () => this.show());
    this.events.on("player:hide", () => this.hide());
  }

  _bindUIEvents() {
    if (this._uiBound) return;
    this._uiBound = true;
    document
      .getElementById("playPauseBtn")
      ?.addEventListener("click", () => this.togglePlayPause());
    document
      .getElementById("seekForwardBtn")
      ?.addEventListener("click", () => this.seek(10));
    document
      .getElementById("seekBackwardBtn")
      ?.addEventListener("click", () => this.seek(-10));
    document
      .getElementById("fullscreenBtn")
      ?.addEventListener("click", () => this.toggleFullscreen());
    document
      .getElementById("closeFileBtn")
      ?.addEventListener("click", () => this.stop());
    document
      .getElementById("deleteFileBtn")
      ?.addEventListener("click", () => this.deleteCurrentFile());
    document
      .getElementById("closeControlPage")
      ?.addEventListener("click", () => this.hide());
  }

  async startPlayback(path) {
    console.log(
      "startPlayback called, _isStarting:",
      this._isStarting,
      "path:",
      path,
    );
    if (!this.panel) {
      this.panel = document.getElementById("playerControlPage");
    }
    if (!this.panel) {
      console.error("Player control panel not found");
      return;
    }
    if (this._isStarting) {
      console.log("Already starting playback, ignoring");
      return;
    }
    if (this.currentFile === path && this.panel.style.display === "flex") {
      console.log("Already playing this file, ignoring");
      return;
    }
    console.log("startPlayback proceeding...");
    this._isStarting = true;
    try {
      this.currentFile = path;
      this.show();
      const response = await this.api.post("/api/open", { path });
      if (response.success) {
        this.isPlaying = true;
        Utils.showNotification(
          `Воспроизведение: ${path.split("/").pop()}`,
          "success",
        );
      } else {
        Utils.showNotification("Ошибка воспроизведения", "error");
        this.hide();
      }
      this._updateUI();
    } finally {
      setTimeout(() => {
        this._isStarting = false;
        console.log("_isStarting reset to false");
      }, 500);
    }
  }

  async togglePlayPause() {
    await this.api.post("/api/mpv/control", {
      command: this.isPlaying ? "set pause yes" : "set pause no",
    });
    this.isPlaying = !this.isPlaying;
    this._updateUI();
  }

  async seek(seconds) {
    await this.api.post("/api/mpv/control", { command: `seek ${seconds}` });
  }

  async toggleFullscreen() {
    await this.api.post("/api/mpv/control", { command: "cycle fullscreen" });
    this.isFullscreen = !this.isFullscreen;
    this._updateUI();
  }

  async stop() {
    await this.api.post("/api/mpv/control", { command: "stop" });
    this.currentFile = null;
    this.isPlaying = false;
    this.hide();
    this.events.emit("playback:videoStopped");
  }

  async deleteCurrentFile() {
    if (!this.currentFile) return;
    const confirmed = await CustomDeleteDialogInstance.showConfirm(
      this.currentFile.split("/").pop(),
    );
    if (confirmed) {
      await this.api.post("/api/trash", { path: this.currentFile });
      await this.stop();
      this.events.emit("video:refresh");
      Utils.showNotification("Файл удален", "success");
    }
  }

  show() {
    if (this.panel) this.panel.style.display = "flex";
  }

  hide() {
    if (this.panel) this.panel.style.display = "none";
  }

  _updateUI() {
    const playPauseBtn = document.getElementById("playPauseBtn");
    if (playPauseBtn) {
      playPauseBtn.innerHTML = this.isPlaying
        ? '<i class="fas fa-pause"></i>'
        : '<i class="fas fa-play"></i>';
    }

    const placeholder = document.querySelector(".player-placeholder");
    if (placeholder && this.currentFile) {
      placeholder.innerHTML = `
        <i class="fas fa-${this.isPlaying ? "play" : "pause"}-circle" style="font-size: 60px; color: var(--yellow);"></i>
        <div>${this._escape(this.currentFile.split("/").pop())}</div>
        <div style="font-size: 0.9rem; color: var(--fg3);">${this.isPlaying ? "Воспроизводится" : "На паузе"}</div>
      `;
    }
  }

  _escape(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }
}
