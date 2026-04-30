class VideoLibrary {
  constructor(apiClient, events, navigationManager) {
    this.api = apiClient;
    this.events = events;
    this.navigation = navigationManager;
    this.currentPath = "/mnt/video";
    this.history = [];
    this.container = document.getElementById("videoContent");
    this.breadcrumbs = document.getElementById("videoBreadcrumbs");
    this.thumbnailCache = new Map();
    this._debounceTimeout = null;
    this._boundHandleOrientation = this._handleOrientationChange.bind(this);
    this._isRestoring = false;
    this._bindEvents();
    this.loadDirectory(this.currentPath, false);
    window.addEventListener("orientationchange", this._boundHandleOrientation);
    window.addEventListener("resize", this._boundHandleOrientation);
  }

  async checkActivePlayback() {
    if (this._isRestoring) return false;
    this._isRestoring = true;
    try {
      const status = await this.api.get("/api/video/status");
      if (status.success && status.playing && status.currentFile) {
        console.log(
          "[VideoLibrary] Restoring active playback:",
          status.currentFile,
        );
        this.currentPlayingPath = status.currentFile;
        this._restorePlaybackControl(status);
        return true;
      }
    } catch (error) {
      console.error("Failed to check playback status:", error);
    } finally {
      this._isRestoring = false;
    }
    return false;
  }

  _restorePlaybackControl(status) {
    const playerPage = document.getElementById("playerControlPage");
    if (playerPage) {
      playerPage.style.display = "flex";
      playerPage.classList.add("active");
    }
    const fileNameSpan = document.getElementById("videoFileName");
    if (fileNameSpan && status.currentFile) {
      const fileName = status.currentFile.split("/").pop();
      fileNameSpan.textContent = fileName;
    }
    this._updateTimeDisplay(status.currentTime || 0, status.duration || 0);
    const playPauseBtn = document.getElementById("playPauseBtn");
    if (playPauseBtn) {
      const icon = playPauseBtn.querySelector("i");
      if (status.paused) {
        icon.className = "fas fa-play";
        playPauseBtn.title = "Воспроизвести";
      } else {
        icon.className = "fas fa-pause";
        playPauseBtn.title = "Пауза";
      }
    }
    this._loadVideoPreview(status.currentFile);
    this._startStatusPolling();
    this._setupControlButtons();
  }

  _startStatusPolling() {
    if (this._statusPollingInterval) {
      clearInterval(this._statusPollingInterval);
    }
    this._statusPollingInterval = setInterval(async () => {
      try {
        const status = await this.api.get("/api/video/status");
        if (status.success && status.playing) {
          this._updateTimeDisplay(status.currentTime, status.duration);
          const playPauseBtn = document.getElementById("playPauseBtn");
          if (playPauseBtn) {
            const icon = playPauseBtn.querySelector("i");
            const shouldBePause = !status.paused;
            if (shouldBePause && icon.className !== "fas fa-pause") {
              icon.className = "fas fa-pause";
              playPauseBtn.title = "Пауза";
            } else if (!shouldBePause && icon.className !== "fas fa-play") {
              icon.className = "fas fa-play";
              playPauseBtn.title = "Воспроизвести";
            }
          }
        } else if (!status.playing) {
          this._cleanup();
        }
      } catch (error) {
        console.error("Status polling error:", error);
      }
    }, 1000);
  }

  _stopStatusPolling() {
    if (this._statusPollingInterval) {
      clearInterval(this._statusPollingInterval);
      this._statusPollingInterval = null;
    }
  }

  _updateTimeDisplay(currentTime, duration) {
    const currentTimeSpan = document.getElementById("videoCurrentTime");
    const durationSpan = document.getElementById("videoDuration");
    const progressFill = document.getElementById("videoProgressFill");
    if (currentTimeSpan) {
      currentTimeSpan.textContent = this._formatTime(currentTime);
    }
    if (durationSpan && duration) {
      durationSpan.textContent = this._formatTime(duration);
    }
    if (progressFill && duration > 0) {
      const percent = (currentTime / duration) * 100;
      progressFill.style.width = `${percent}%`;
    }
  }

  _formatTime(seconds) {
    if (!seconds || isNaN(seconds)) return "0:00";
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
  }

  _hidePlaybackControl() {
    const playerPage = document.getElementById("playerControlPage");
    if (playerPage) {
      playerPage.style.display = "none";
      playerPage.classList.remove("active");
    }
    this._cleanup();
  }

  _cleanup() {
    this._stopStatusPolling();
    if (this._cleanupTimeout) {
      clearTimeout(this._cleanupTimeout);
      this._cleanupTimeout = null;
    }
    if (this._debounceTimeout) {
      clearTimeout(this._debounceTimeout);
      this._debounceTimeout = null;
    }
    if (this._progressCleanupInterval) {
      clearInterval(this._progressCleanupInterval);
      this._progressCleanupInterval = null;
    }
    this._controlsSetup = false;
    this.currentPlayingPath = null;
    if (this.activeVideos) {
      this.activeVideos.clear();
    }
    const previewImg = document.getElementById("videoPreviewImg");
    if (previewImg) {
      previewImg.onload = null;
      previewImg.src = "";
    }
  }

  playVideo(path) {
    if (this._debounceTimeout) {
      clearTimeout(this._debounceTimeout);
    }
    this._debounceTimeout = setTimeout(() => {
      this._executePlayVideo(path);
    }, 300);
  }

  async _executePlayVideo(path) {
    if (this.activeVideos && this.activeVideos.has(path)) {
      console.log("playVideo ignored - video already playing:", path);
      return;
    }
    this._cleanup();
    if (!this.activeVideos) {
      this.activeVideos = new Set();
    }
    if (this.currentPlayingPath) {
      await this.api.post("/api/video/close");
    }
    this.currentPlayingPath = path;
    const fileName = path.split("/").pop();
    const playerPage = document.getElementById("playerControlPage");
    if (playerPage) {
      playerPage.style.display = "flex";
      playerPage.classList.add("active");
      const fileNameSpan = document.getElementById("videoFileName");
      if (fileNameSpan) {
        fileNameSpan.textContent = fileName;
      }
      const placeholder = document.getElementById("videoPreviewPlaceholder");
      const previewImg = document.getElementById("videoPreviewImg");
      if (placeholder) placeholder.style.display = "flex";
      if (previewImg) previewImg.style.display = "none";
    }
    const data = await this.api.post("/api/open", { path });
    if (data.success) {
      console.log("Video started successfully, socket:", data.socket);
      this.activeVideos.add(path);
      this._loadVideoPreview(path);
      this._startStatusPolling();
      this._setupControlButtons();
      this._startMemoryCleanup();
      setTimeout(() => {
        if (this.activeVideos && this.activeVideos.has(path)) {
          this.activeVideos.delete(path);
        }
      }, 3600000);
    } else {
      console.error("Failed to start video:", data.error);
      Utils.showNotification(data.error || "Ошибка воспроизведения", "error");
      this._hidePlaybackControl();
    }
  }

  _startMemoryCleanup() {
    if (this._progressCleanupInterval) {
      clearInterval(this._progressCleanupInterval);
    }
    this._progressCleanupInterval = setInterval(() => {
      const playerPage = document.getElementById("playerControlPage");
      if (!playerPage || playerPage.style.display !== "flex") {
        this._cleanup();
        return;
      }
      const progressFill = document.getElementById("videoProgressFill");
      if (progressFill && progressFill.style.width === "100%") {
        this._cleanupTimeout = setTimeout(() => {
          this._checkIfVideoFinished();
        }, 5000);
      }
    }, 30000);
  }

  async _checkIfVideoFinished() {
    try {
      const status = await this.api.get("/api/video/status");
      if (
        status.success &&
        status.playing &&
        status.currentTime >= status.duration - 1
      ) {
        this._cleanup();
        this._hidePlaybackControl();
      }
    } catch (error) {
      console.error("Check video finished error:", error);
    }
  }

  async _loadVideoPreview(path) {
    try {
      const thumbnailUrl = `/api/thumbnail?path=${encodeURIComponent(path)}&width=640&quality=85`;
      const response = await fetch(thumbnailUrl);
      const data = await response.json();
      if (data.success && data.thumbnail) {
        const previewImg = document.getElementById("videoPreviewImg");
        const placeholder = document.getElementById("videoPreviewPlaceholder");
        if (previewImg && placeholder) {
          previewImg.onload = () => {
            previewImg.style.display = "block";
            placeholder.style.display = "none";
          };
          previewImg.src = data.thumbnail;
        }
      }
    } catch (error) {
      console.error("Failed to load preview:", error);
    }
  }

  _setupControlButtons() {
    if (this._controlsSetup) return;
    this._controlsSetup = true;
    const playPauseBtn = document.getElementById("playPauseBtn");
    const seekBackwardBtn = document.getElementById("seekBackwardBtn");
    const seekForwardBtn = document.getElementById("seekForwardBtn");
    const fullscreenBtn = document.getElementById("fullscreenBtn");
    const deleteFileBtn = document.getElementById("deleteFileBtn");
    const closeFileBtn = document.getElementById("closeFileBtn");
    const closeControlPage = document.getElementById("closeControlPage");
    const progressBar = document.getElementById("videoProgressBar");
    if (playPauseBtn && !playPauseBtn._hasListener) {
      playPauseBtn._hasListener = true;
      playPauseBtn.onclick = () => this._togglePlayPause();
    }
    if (seekBackwardBtn && !seekBackwardBtn._hasListener) {
      seekBackwardBtn._hasListener = true;
      seekBackwardBtn.onclick = () => this._seek(-10);
    }
    if (seekForwardBtn && !seekForwardBtn._hasListener) {
      seekForwardBtn._hasListener = true;
      seekForwardBtn.onclick = () => this._seek(10);
    }
    if (fullscreenBtn && !fullscreenBtn._hasListener) {
      fullscreenBtn._hasListener = true;
      fullscreenBtn.onclick = () => this._toggleFullscreen();
    }
    if (deleteFileBtn && !deleteFileBtn._hasListener) {
      deleteFileBtn._hasListener = true;
      deleteFileBtn.onclick = () => this._deleteCurrentVideo();
    }
    if (closeFileBtn && !closeFileBtn._hasListener) {
      closeFileBtn._hasListener = true;
      closeFileBtn.onclick = () => this._closeVideo();
    }
    if (closeControlPage && !closeControlPage._hasListener) {
      closeControlPage._hasListener = true;
      closeControlPage.onclick = () => this._minimizeControl();
    }
    if (progressBar && !progressBar._hasListener) {
      progressBar._hasListener = true;
      progressBar.onclick = (e) => this._seekToPosition(e);
    }
  }

  async _togglePlayPause() {
    try {
      const status = await this.api.get("/api/video/status");
      if (status.success && status.playing) {
        const command = status.paused ? "play" : "pause";
        await this.api.post("/api/mpv/control", { command });
      }
    } catch (error) {
      console.error("Toggle play/pause error:", error);
    }
  }

  async _seek(seconds) {
    try {
      const status = await this.api.get("/api/video/status");
      if (status.success && status.playing) {
        const newTime = Math.max(0, status.currentTime + seconds);
        await this.api.post("/api/mpv/seek", { time: newTime });
      }
    } catch (error) {
      console.error("Seek error:", error);
    }
  }

  async _seekToPosition(event) {
    const progressBar = document.getElementById("videoProgressBar");
    const rect = progressBar.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const percent = x / rect.width;
    try {
      const status = await this.api.get("/api/video/status");
      if (status.success && status.playing && status.duration > 0) {
        const newTime = percent * status.duration;
        await this.api.post("/api/mpv/seek", { time: newTime });
      }
    } catch (error) {
      console.error("Seek to position error:", error);
    }
  }

  _toggleFullscreen() {
    const playerPage = document.getElementById("playerControlPage");
    if (!document.fullscreenElement) {
      playerPage.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  }

  async _deleteCurrentVideo() {
    if (!this.currentPlayingPath) return;
    const confirmed = await CustomDeleteDialogInstance.showConfirm(
      this.currentPlayingPath.split("/").pop(),
      false,
    );
    if (confirmed) {
      await this._closeVideo();
      await this.api.post("/api/trash", { path: this.currentPlayingPath });
      Utils.showNotification("Видео удалено", "success");
      if (this.refresh) {
        this.refresh();
      }
    }
  }

  async _closeVideo() {
    this._cleanup();
    try {
      await this.api.post("/api/video/close");
    } catch (error) {
      console.error("Close video error:", error);
    }
    this.currentPlayingPath = null;
    this._hidePlaybackControl();
    this._controlsSetup = false;
  }

  _minimizeControl() {
    const playerPage = document.getElementById("playerControlPage");
    if (playerPage) {
      playerPage.classList.toggle("minimized");
    }
  }

  destroy() {
    this._cleanup();
    if (this.container) {
      this.container.innerHTML = "";
    }
    if (this.thumbnailCache) {
      this.thumbnailCache.clear();
    }
    if (this.activeVideos) {
      this.activeVideos.clear();
    }
    this.currentPath = null;
    this.history = [];
    window.removeEventListener(
      "orientationchange",
      this._boundHandleOrientation,
    );
    window.removeEventListener("resize", this._boundHandleOrientation);
  }

  _bindEvents() {
    this.events.on("video:play", (path) => this.playVideo(path));
    this.events.on("video:delete", (data) =>
      this.deleteItem(data.path, data.name, data.isDir),
    );
    this.events.on("navigation:videoPage", () => this.refresh());
    this.events.on("video:refresh", () => this.refresh());
  }

  async loadDirectory(path, addToHistory = true) {
    this.currentPath = path;
    if (addToHistory) this.history.push(path);
    this._updateBreadcrumbs();
    this._showLoading();
    const data = await this.api.post("/api/list", { path });
    if (data.success) {
      this._renderContent(data.items);
    } else {
      this._showError(data.error || "Ошибка загрузки");
    }
  }

  async _loadThumbnail(videoPath) {
    if (this.thumbnailCache.has(videoPath)) {
      return this.thumbnailCache.get(videoPath);
    }
    const url = `/api/thumbnail?path=${encodeURIComponent(videoPath)}`;
    try {
      const response = await fetch(url);
      const data = await response.json();
      if (data.success && data.thumbnail) {
        this.thumbnailCache.set(videoPath, data.thumbnail);
        return data.thumbnail;
      }
    } catch (error) {
      console.error("Failed to load thumbnail:", error);
    }
    return null;
  }

  _renderContent(items) {
    const visibleItems = items.filter((item) => !item.name.startsWith("."));
    if (visibleItems.length === 0) {
      this.container.innerHTML =
        '<div class="empty"><i class="fas fa-folder-open"></i> Папка пуста</div>';
      return;
    }
    this.container.innerHTML = visibleItems
      .map(
        (item) => `
    <div class="item-card" data-path="${item.path}" data-is-dir="${item.isDirectory}" data-name="${this._escape(item.name)}">
        <div class="item-card-content">
            ${
              item.isDirectory
                ? `<div class="thumbnail-placeholder folder-placeholder" data-folder-path="${item.path}" style="background-image: url(''); background-size: cover; background-position: center;">
                    <i class="fas fa-folder folder-icon"></i>
                  </div>`
                : `<div class="thumbnail-placeholder video-placeholder" data-video-path="${item.path}" style="background-image: url(''); background-size: cover; background-position: center;">
                    <i class="fas fa-play-circle video-icon-loading"></i>
                  </div>`
            }
            <div class="item-name" title="${this._escape(item.name)}">${this._escape(item.name)}</div>
            ${!item.isDirectory ? `<div class="item-size">${item.size || ""}</div>` : ""}
        </div>
        <div class="swipe-actions">
            <button class="swipe-delete-btn" data-path="${item.path}" data-name="${this._escape(item.name)}" data-is-dir="${item.isDirectory}">
                <i class="fas fa-trash-alt"></i>
            </button>
        </div>
    </div>
  `,
      )
      .join("");
    this._attachItemEvents();
    this._loadVisibleThumbnails();
    this._loadVisibleFolderPreviews();
  }

  async _loadVisibleThumbnails() {
    const placeholders = this.container.querySelectorAll(
      ".thumbnail-placeholder[data-video-path]",
    );
    for (const placeholder of placeholders) {
      const videoPath = placeholder.dataset.videoPath;
      const thumbnail = await this._loadThumbnail(videoPath);
      if (thumbnail && placeholder.parentElement) {
        placeholder.style.backgroundImage = `url('${thumbnail}')`;
        placeholder.style.backgroundSize = "cover";
        placeholder.style.backgroundPosition = "center";
      }
    }
  }

  _attachItemEvents() {
    this.container.querySelectorAll(".item-card").forEach((card) => {
      if (card._eventsAttached) return;
      card._eventsAttached = true;
      const path = card.dataset.path;
      const isDir = card.dataset.isDir === "true";
      const name = card.querySelector(".item-name")?.textContent || "";
      const clickHandler = async (e) => {
        if (e.target.closest(".swipe-delete-btn")) return;
        if (isDir) {
          await this.loadDirectory(path, true);
        } else {
          this.events.emit("video:play", path);
        }
      };
      card.addEventListener("click", clickHandler);
      card._clickHandler = clickHandler;
      const deleteBtn = card.querySelector(".swipe-delete-btn");
      if (deleteBtn && !deleteBtn._handlerAdded) {
        deleteBtn._handlerAdded = true;
        const deleteHandler = async (e) => {
          e.stopPropagation();
          const confirmed = await CustomDeleteDialogInstance.showConfirm(
            name,
            isDir,
          );
          if (confirmed) {
            await this.deleteItem(path, name, isDir);
            if (CustomDeleteDialogInstance.close) {
              CustomDeleteDialogInstance.close();
            }
          }
        };
        deleteBtn.addEventListener("click", deleteHandler);
        deleteBtn._deleteHandler = deleteHandler;
      }
      const contextHandler = (e) => {
        e.preventDefault();
        e.stopPropagation();
        this._showContextMenu(e.clientX, e.clientY, path, name, isDir);
      };
      if (!card._contextHandler) {
        card.addEventListener("contextmenu", contextHandler);
        card._contextHandler = contextHandler;
      }
    });
  }

  _showContextMenu(x, y, path, name, isDirectory) {
    this._hideContextMenu();
    const menu = document.createElement("div");
    menu.className = "context-menu";
    menu.style.left = x + "px";
    menu.style.top = y + "px";
    menu.innerHTML = `
            <div class="context-menu-item delete-item" data-action="delete">
                <i class="fas fa-trash-alt"></i>
                <span>Удалить</span>
            </div>
        `;
    document.body.appendChild(menu);
    this._currentContextMenu = menu;
    const deleteBtn = menu.querySelector(".delete-item");
    deleteBtn.addEventListener("click", async (e) => {
      e.stopPropagation();
      this._hideContextMenu();
      const confirmed = await CustomDeleteDialogInstance.showConfirm(
        name,
        isDirectory,
      );
      if (confirmed) {
        await this.deleteItem(path, name, isDirectory);
        if (CustomDeleteDialogInstance.close) {
          CustomDeleteDialogInstance.close();
        }
      }
    });
    const closeMenu = (e) => {
      if (!menu.contains(e.target)) {
        this._hideContextMenu();
        document.removeEventListener("click", closeMenu);
        document.removeEventListener("contextmenu", closeMenu);
      }
    };
    setTimeout(() => {
      document.addEventListener("click", closeMenu);
      document.addEventListener("contextmenu", closeMenu);
    }, 0);
  }

  _hideContextMenu() {
    if (this._currentContextMenu && this._currentContextMenu.parentNode) {
      this._currentContextMenu.parentNode.removeChild(this._currentContextMenu);
      this._currentContextMenu = null;
    }
  }

  async deleteItem(path, name, isDirectory) {
    const response = await this.api.post("/api/trash", { path });
    if (response.success) {
      Utils.showNotification(
        `${isDirectory ? "Папка" : "Файл"} "${name}" ${isDirectory ? "удалена" : "удален"}`,
        "success",
      );
      this.thumbnailCache.clear();
      await this.loadDirectory(this.currentPath, false);
    } else {
      Utils.showNotification(response.error || "Ошибка удаления", "error");
    }
  }

  refresh() {
    if (this.currentPath) {
      this.thumbnailCache.clear();
      this.loadDirectory(this.currentPath, false);
    }
  }

  _handleOrientationChange() {
    const playerPage = document.getElementById("playerControlPage");
    if (playerPage && playerPage.classList.contains("active")) {
      setTimeout(() => {
        playerPage.classList.remove("active");
        void playerPage.offsetHeight;
        playerPage.classList.add("active");
        playerPage.style.display = "flex";
      }, 10);
      const progressFill = document.getElementById("videoProgressFill");
      if (progressFill && this.currentVideoElement) {
        const currentTime = this.currentVideoElement?.currentTime || 0;
        const duration = this.currentVideoElement?.duration || 1;
        const percent = (currentTime / duration) * 100;
        progressFill.style.width = `${percent}%`;
      }
    }
  }

  _updateBreadcrumbs() {
    if (!this.breadcrumbs) return;
    this.breadcrumbs.innerHTML = "";
    const rootPath = "/mnt/video";
    const rootBreadcrumb = document.createElement("div");
    rootBreadcrumb.className = "breadcrumb-root";
    rootBreadcrumb.innerHTML =
      '<i class="fas fa-film"></i><span>Главная</span>';
    rootBreadcrumb.addEventListener("click", () => {
      this.loadDirectory(rootPath, true);
    });
    this.breadcrumbs.appendChild(rootBreadcrumb);
    if (this.currentPath === rootPath) return;
    let relativePath = this.currentPath.substring(rootPath.length);
    if (relativePath.startsWith("/")) relativePath = relativePath.substring(1);
    const pathParts = relativePath.split("/").filter((part) => part.length > 0);
    let currentPath = rootPath;
    for (let i = 0; i < pathParts.length; i++) {
      const part = pathParts[i];
      currentPath += "/" + part;
      const crumb = document.createElement("div");
      crumb.className = "breadcrumb";
      crumb.innerHTML = `<i class="fas fa-folder"></i><span class="breadcrumb-text" title="${this._escape(part)}">${this._escape(part)}</span>`;
      if (i === pathParts.length - 1) {
        crumb.classList.add("active");
      } else {
        crumb.addEventListener("click", (e) => {
          e.stopPropagation();
          this.loadDirectory(currentPath, true);
        });
      }
      this.breadcrumbs.appendChild(crumb);
    }
  }

  _showLoading() {
    if (this.container) {
      this.container.innerHTML =
        '<div class="loading"><i class="fas fa-spinner fa-spin"></i> Загрузка...</div>';
    }
  }

  _showError(message) {
    if (this.container) {
      this.container.innerHTML = `<div class="empty"><i class="fas fa-exclamation-triangle"></i> ${this._escape(message)}</div>`;
    }
  }

  _escape(str) {
    if (!str) return "";
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  async _getFirstVideoInFolder(folderPath) {
    const data = await this.api.post("/api/list", { path: folderPath });
    if (data.success) {
      const firstVideo = data.items.find(
        (item) => !item.isDirectory && item.isVideo,
      );
      if (firstVideo) {
        return firstVideo.path;
      }
    }
    return null;
  }

  async _loadFolderThumbnail(folderPath, placeholder) {
    const videoPath = await this._getFirstVideoInFolder(folderPath);
    if (videoPath) {
      const thumbnail = await this._loadThumbnail(videoPath);
      if (thumbnail) {
        placeholder.style.backgroundImage = `url('${thumbnail}')`;
        placeholder.style.backgroundSize = "cover";
        placeholder.style.backgroundPosition = "center";
      }
    }
  }

  async _loadVisibleFolderPreviews() {
    const placeholders = this.container.querySelectorAll(
      ".thumbnail-placeholder.folder-placeholder[data-folder-path]",
    );
    for (const placeholder of placeholders) {
      const folderPath = placeholder.dataset.folderPath;
      const firstVideoPath = await this._getFirstVideoInFolder(folderPath);
      if (firstVideoPath) {
        const thumbnail = await this._loadThumbnail(firstVideoPath);
        if (thumbnail) {
          placeholder.style.backgroundImage = `url('${thumbnail}')`;
          placeholder.style.backgroundSize = "cover";
          placeholder.style.backgroundPosition = "center";
        }
      }
    }
  }

  goBack() {
    if (this.history.length > 1) {
      this.history.pop();
      const previousPath = this.history[this.history.length - 1];
      this.loadDirectory(previousPath, false);
    }
  }

  async renameItem(path, name, isDirectory) {
    const newName = prompt(
      `Введите новое имя для ${isDirectory ? "папки" : "файла"}:`,
      name,
    );
    if (!newName || newName === name) return;
    const dirPath = path.substring(0, path.lastIndexOf("/"));
    const newPath = dirPath + "/" + newName;
    const response = await this.api.post("/api/rename", { path, newPath });
    if (response.success) {
      Utils.showNotification(
        `${isDirectory ? "Папка" : "Файл"} переименован в "${newName}"`,
        "success",
      );
      this.thumbnailCache.clear();
      await this.loadDirectory(this.currentPath, false);
    } else {
      Utils.showNotification(
        response.error || "Ошибка переименования",
        "error",
      );
    }
  }

  async copyItem(path, name, isDirectory) {
    const response = await this.api.post("/api/copy", { path });
    if (response.success) {
      Utils.showNotification(
        `${isDirectory ? "Папка" : "Файл"} "${name}" скопирован`,
        "success",
      );
      this.thumbnailCache.clear();
      await this.loadDirectory(this.currentPath, false);
    } else {
      Utils.showNotification(response.error || "Ошибка копирования", "error");
    }
  }

  async moveItem(path, name, isDirectory) {
    const targetPath = prompt("Введите путь назначения:", "/mnt/video/");
    if (!targetPath) return;
    const response = await this.api.post("/api/move", {
      path,
      newPath: targetPath + "/" + name,
    });
    if (response.success) {
      Utils.showNotification(
        `${isDirectory ? "Папка" : "Файл"} "${name}" перемещен`,
        "success",
      );
      this.thumbnailCache.clear();
      await this.loadDirectory(this.currentPath, false);
    } else {
      Utils.showNotification(response.error || "Ошибка перемещения", "error");
    }
  }

  clearHistory() {
    this.history = [this.currentPath];
  }

  getCurrentPath() {
    return this.currentPath;
  }

  async refreshCurrentDirectory() {
    await this.loadDirectory(this.currentPath, false);
  }
}
