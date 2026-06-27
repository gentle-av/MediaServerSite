import { AudioStream } from "../modules/videos/stream/AudioStream.js";
import { ApiClient } from "../core/api/ApiClient.js";

export class AudioStreamSelector {
  constructor(playerAPI, streamManager) {
    this.api = playerAPI;
    this.streamManager = streamManager;
    this.isOpen = false;
    this.button = null;
    this.popup = null;
    this.currentVideo = null;
    this._statusCheckInterval = null;
    this._isInitialized = false;
  }

  init() {
    if (this._isInitialized) return;
    this._isInitialized = true;
    this.createButton();
    this.createPopup();
    this.bindEvents();
    this.subscribeToVideoChanges();
  }

  createButton() {
    const existing = document.getElementById("audioStreamBtn");
    if (existing) existing.remove();
    this.button = document.createElement("button");
    this.button.id = "audioStreamBtn";
    this.button.className = "universal-bottom-player-btn audio-stream-btn";
    this.button.innerHTML = '<i class="fas fa-volume-up"></i>';
    this.button.title = "Аудиодорожки";
    this.button.style.display = "none";
    const container = document.querySelector(
      ".universal-bottom-player-controls",
    );
    if (container) {
      const settingsBtn = container.querySelector(
        ".universal-bottom-settings-toggle, #universalBottomSettingsToggle",
      );
      if (settingsBtn) {
        container.insertBefore(this.button, settingsBtn);
      } else {
        container.appendChild(this.button);
      }
    }
  }

  createPopup() {
    const existing = document.getElementById("audioStreamPopup");
    if (existing) existing.remove();
    this.popup = document.createElement("div");
    this.popup.id = "audioStreamPopup";
    this.popup.className = "audio-stream-popup hidden";
    this.popup.innerHTML = `
      <div class="audio-stream-popup-header">
        <span>Аудиодорожки</span>
        <button class="audio-stream-close">×</button>
      </div>
      <div class="audio-stream-list"></div>
      <div class="audio-stream-loading"><i class="fas fa-spinner fa-spin"></i> Загрузка...</div>
      <div class="audio-stream-empty">Нет доступных дорожек</div>
    `;
    document.body.appendChild(this.popup);
    this.list = this.popup.querySelector(".audio-stream-list");
    this.loading = this.popup.querySelector(".audio-stream-loading");
    this.empty = this.popup.querySelector(".audio-stream-empty");
  }

  bindEvents() {
    this.button?.addEventListener("click", (e) => {
      e.stopPropagation();
      this.toggle();
    });
    this.popup
      ?.querySelector(".audio-stream-close")
      ?.addEventListener("click", (e) => {
        e.stopPropagation();
        this.close();
      });
    document.addEventListener("click", (e) => {
      if (
        this.isOpen &&
        !this.popup?.contains(e.target) &&
        !this.button?.contains(e.target)
      ) {
        this.close();
      }
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && this.isOpen) this.close();
    });
    window.addEventListener("resize", () => {
      if (this.isOpen) this.positionPopup();
    });
  }

  subscribeToVideoChanges() {
    document.addEventListener("video:play", async (e) => {
      const path = e.detail?.path || e.detail;
      if (path) {
        this.currentVideo = path;
        this.button.style.display = "flex";
        await this.loadStreams(path);
      }
    });
    document.addEventListener("video:stopped", () => {
      this.currentVideo = null;
      this.button.style.display = "none";
      this.close();
    });
    if (window.eventBus) {
      window.eventBus.on("video:play", async (path) => {
        this.currentVideo = path;
        this.button.style.display = "flex";
        await this.loadStreams(path);
      });
      window.eventBus.on("video:stopped", () => {
        this.currentVideo = null;
        this.button.style.display = "none";
        this.close();
      });
    }
    // Уменьшаем интервал до 1 секунды для более быстрого обновления
    this._statusCheckInterval = setInterval(async () => {
      if (!this.api) return;
      try {
        const status = await this.api.getVideoStatus();
        if (status?.success && status.currentFile) {
          if (this.currentVideo !== status.currentFile) {
            this.currentVideo = status.currentFile;
            this.button.style.display = "flex";
            await this.loadStreams(status.currentFile);
          } else {
            await this.streamManager.refreshSelected(this.currentVideo);
            const streams = this.streamManager.getCurrentStreams();
            if (this.isOpen) {
              this.renderStreams(streams);
            }
          }
        } else if (this.currentVideo) {
          this.currentVideo = null;
          this.button.style.display = "none";
          this.close();
        }
      } catch (e) {}
    }, 1000);
  }

  async loadStreams(videoPath) {
    this.showLoading();
    try {
      const streams = await this.streamManager.getStreams(videoPath);
      this.renderStreams(streams);
      return streams;
    } catch (error) {
      console.error("Failed to load audio streams:", error);
      this.showEmpty();
      return [];
    }
  }

  renderStreams(streams) {
    this.list.innerHTML = "";
    if (!streams || streams.length === 0) {
      this.showEmpty();
      return;
    }
    streams.forEach((stream) => {
      const item = document.createElement("div");
      item.className = `audio-stream-item ${stream.isSelected ? "selected" : ""}`;
      item.dataset.index = stream.streamIndex;
      const codec = stream.codecName
        ? `<span class="audio-stream-codec">${this.escapeHtml(stream.codecName)}</span>`
        : "";
      const channels =
        stream.channels > 0
          ? `<span class="audio-stream-channels">${stream.channels}ch</span>`
          : "";
      const flags = [];
      if (stream.isDefault) flags.push("★");
      if (stream.isForced) flags.push("!");
      item.innerHTML = `
        <span class="audio-stream-name">${this.escapeHtml(stream.displayName)}</span>
        ${codec} ${channels}
        ${flags.length ? `<span class="audio-stream-flags">${flags.join(" ")}</span>` : ""}
        ${stream.isSelected ? '<span class="audio-stream-check"><i class="fas fa-check"></i></span>' : ""}
      `;
      item.addEventListener("click", async (e) => {
        e.stopPropagation();
        const selected = await this.streamManager.selectTrack(
          stream.streamIndex,
          this.currentVideo,
        );
        if (selected) {
          const updatedStreams = await this.streamManager.getStreams(
            this.currentVideo,
          );
          this.renderStreams(updatedStreams);
          setTimeout(() => this.close(), 300);
        }
      });
      this.list.appendChild(item);
    });
    this.hideLoading();
    this.hideEmpty();
  }

  escapeHtml(str) {
    if (!str) return "";
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  showLoading() {
    if (this.loading) this.loading.style.display = "flex";
    if (this.list) this.list.style.display = "none";
    if (this.empty) this.empty.style.display = "none";
  }

  hideLoading() {
    if (this.loading) this.loading.style.display = "none";
    if (this.list) this.list.style.display = "block";
  }

  showEmpty() {
    if (this.empty) this.empty.style.display = "block";
    if (this.list) this.list.style.display = "none";
    if (this.loading) this.loading.style.display = "none";
  }

  hideEmpty() {
    if (this.empty) this.empty.style.display = "none";
  }

  toggle() {
    this.isOpen ? this.close() : this.open();
  }

  async open() {
    if (this.isOpen) return;
    this.isOpen = true;
    this.popup.classList.remove("hidden");
    this.popup.classList.add("visible");
    this.positionPopup();
    if (this.currentVideo) {
      await this.loadStreams(this.currentVideo);
    } else {
      this.showEmpty();
    }
  }

  close() {
    this.isOpen = false;
    this.popup.classList.add("hidden");
    this.popup.classList.remove("visible");
  }

  positionPopup() {
    if (!this.button || !this.popup) return;
    const btnRect = this.button.getBoundingClientRect();
    const popupWidth = 300;
    let left = btnRect.left - popupWidth / 2 + btnRect.width / 2;
    let top = btnRect.bottom + 8;
    if (left + popupWidth > window.innerWidth - 10) {
      left = window.innerWidth - popupWidth - 10;
    }
    if (left < 10) left = 10;
    const popupHeight = this.popup.scrollHeight || 320;
    if (top + popupHeight > window.innerHeight - 10) {
      top = btnRect.top - popupHeight - 8;
    }
    if (top < 10) top = 10;
    this.popup.style.left = `${left}px`;
    this.popup.style.top = `${top}px`;
  }

  destroy() {
    if (this._statusCheckInterval) {
      clearInterval(this._statusCheckInterval);
    }
    this.button?.remove();
    this.popup?.remove();
  }
}
