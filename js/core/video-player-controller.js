class VideoPlayerController {
  constructor(apiClient, events) {
    this.api = apiClient;
    this.events = events;
    this.currentFile = null;
    this.isPlaying = false;
    this.isFullscreen = false;
    this.panel = null;
    this._isStarting = false;
    this._progressInterval = null;
    this._duration = 0;
    this._currentTime = 0;
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

    // Обработчик клика по прогрессбару
    const progressBar = document.getElementById("videoProgressBar");
    if (progressBar) {
      progressBar.addEventListener("click", (e) =>
        this._handleProgressBarClick(e),
      );
      progressBar.addEventListener("mousemove", (e) =>
        this._handleProgressBarHover(e),
      );
      progressBar.addEventListener("mouseleave", () =>
        this._hideProgressHover(),
      );
    }
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

      // Обновляем информацию о файле
      this._updateFileInfo(path);

      const response = await this.api.post("/api/open", { path });
      if (response.success) {
        this.isPlaying = true;
        Utils.showNotification(
          `Воспроизведение: ${path.split("/").pop()}`,
          "success",
        );
        this._startProgressPolling();
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

  _updateFileInfo(path) {
    const fileName = path.split("/").pop();
    const fileNameEl = document.getElementById("videoFileName");
    if (fileNameEl) {
      fileNameEl.textContent = this._escape(fileName);
    }
  }

  _startProgressPolling() {
    if (this._progressInterval) {
      clearInterval(this._progressInterval);
    }

    this._progressInterval = setInterval(async () => {
      if (!this.currentFile) return;

      try {
        const response = await this.api.get("/api/video/status");
        if (response.success) {
          if (response.playing) {
            this.isPlaying = !response.paused;
            this._currentTime = response.currentTime || 0;
            this._duration = response.duration || 0;
            this._updateProgressBar(this._currentTime, this._duration);
            this._updateTimeDisplay(this._currentTime, this._duration);
            this._updatePlayPauseButton();
          } else if (!response.playing && this.currentFile) {
            // Видео закончилось или было закрыто
            if (response.reason === "process_dead") {
              this.stop();
            }
          }
        }
      } catch (error) {
        console.error("Failed to get video status:", error);
      }
    }, 500);
  }

  _updateProgressBar(currentTime, duration) {
    const progressFill = document.getElementById("videoProgressFill");
    if (progressFill && duration > 0) {
      const percent = (currentTime / duration) * 100;
      progressFill.style.width = `${percent}%`;
    }
  }

  _updateTimeDisplay(currentTime, duration) {
    const currentTimeEl = document.getElementById("videoCurrentTime");
    const durationEl = document.getElementById("videoDuration");

    if (currentTimeEl) {
      currentTimeEl.textContent = this._formatTime(currentTime);
    }
    if (durationEl && duration > 0) {
      durationEl.textContent = this._formatTime(duration);
    } else if (durationEl) {
      durationEl.textContent = "0:00";
    }
  }

  _updatePlayPauseButton() {
    const playPauseBtn = document.getElementById("playPauseBtn");
    if (playPauseBtn) {
      playPauseBtn.innerHTML = this.isPlaying
        ? '<i class="fas fa-pause"></i>'
        : '<i class="fas fa-play"></i>';
    }
  }

  async _handleProgressBarClick(e) {
    const progressBar = document.getElementById("videoProgressBar");
    if (!progressBar) return;

    const rect = progressBar.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    const seekTime = this._duration * percent;

    console.log(
      `Progress bar click: percent=${percent}, seekTime=${seekTime}, duration=${this._duration}`,
    );

    if (this._duration > 0 && seekTime >= 0 && seekTime <= this._duration) {
      await this.seekTo(seekTime);
    }
  }

  async _handleProgressBarHover(e) {
    const progressBar = document.getElementById("videoProgressBar");
    const hoverFill = document.getElementById("videoProgressHover");
    if (!progressBar || !hoverFill) return;

    const rect = progressBar.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    hoverFill.style.width = `${percent * 100}%`;

    // Показываем время при наведении
    const hoverTime = this._duration * percent;
    const timeTooltip = document.getElementById("videoProgressTooltip");
    if (timeTooltip) {
      timeTooltip.textContent = this._formatTime(hoverTime);
      timeTooltip.style.left = `${e.clientX - rect.left - 25}px`;
      timeTooltip.style.display = "block";
    }
  }

  _hideProgressHover() {
    const hoverFill = document.getElementById("videoProgressHover");
    const timeTooltip = document.getElementById("videoProgressTooltip");
    if (hoverFill) {
      hoverFill.style.width = "0%";
    }
    if (timeTooltip) {
      timeTooltip.style.display = "none";
    }
  }

  async seekTo(time) {
    console.log(`Seeking to: ${time} seconds`);
    try {
      const response = await this.api.post("/api/mpv/seek", { time: time });
      if (response.success) {
        console.log(`Seek successful, new time: ${response.time}`);
        this._currentTime = response.time;
        this._updateProgressBar(this._currentTime, this._duration);
        this._updateTimeDisplay(this._currentTime, this._duration);
      } else {
        console.error("Seek failed:", response.error);
        Utils.showNotification("Ошибка перемотки", "error");
      }
    } catch (error) {
      console.error("Seek request failed:", error);
      Utils.showNotification("Ошибка перемотки", "error");
    }
  }

  async togglePlayPause() {
    const command = this.isPlaying ? "pause" : "play";
    await this.api.post("/api/mpv/control", { command: command });
    this.isPlaying = !this.isPlaying;
    this._updateUI();
  }

  async seek(seconds) {
    const newTime = Math.max(
      0,
      Math.min(this._duration, this._currentTime + seconds),
    );
    await this.seekTo(newTime);
  }

  async toggleFullscreen() {
    await this.api.post("/api/mpv/control", { command: "fullscreen" });
    this.isFullscreen = !this.isFullscreen;
    this._updateUI();
  }

  async stop() {
    if (this._progressInterval) {
      clearInterval(this._progressInterval);
      this._progressInterval = null;
    }

    await this.api.post("/api/mpv/control", { command: "stop" });
    this.currentFile = null;
    this.isPlaying = false;
    this._duration = 0;
    this._currentTime = 0;
    this.hide();
    this.events.emit("playback:videoStopped");
  }

  async deleteCurrentFile() {
    if (!this.currentFile) return;
    const confirmed = await CustomDeleteDialogInstance.showConfirm(
      this.currentFile.split("/").pop(),
      false,
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
    // Сброс прогресса при показе
    this._updateProgressBar(0, 0);
    this._updateTimeDisplay(0, 0);
  }

  hide() {
    if (this.panel) this.panel.style.display = "none";
    if (this._progressInterval) {
      clearInterval(this._progressInterval);
      this._progressInterval = null;
    }
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

  _formatTime(seconds) {
    if (!seconds || seconds < 0) return "0:00";
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
  }

  _escape(str) {
    if (!str) return "";
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }
}
