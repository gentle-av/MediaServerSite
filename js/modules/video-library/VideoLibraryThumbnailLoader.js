export class VideoLibraryThumbnailLoader {
  constructor(api, state) {
    this.api = api;
    this.state = state;
  }

  async loadThumbnail(videoPath) {
    const cached = this.state.getThumbnail(videoPath);
    if (cached) return cached;
    const url = `/api/thumbnail?path=${encodeURIComponent(videoPath)}`;
    try {
      const response = await fetch(url);
      const data = await response.json();
      if (data.success && data.thumbnail) {
        this.state.setThumbnail(videoPath, data.thumbnail);
        return data.thumbnail;
      }
    } catch (error) {
      console.error("Failed to load thumbnail:", error);
    }
    return null;
  }

  async loadVisibleThumbnails(container) {
    const placeholders = container.querySelectorAll(
      ".thumbnail-placeholder[data-video-path]",
    );
    for (const placeholder of placeholders) {
      const videoPath = placeholder.dataset.videoPath;
      const thumbnail = await this.loadThumbnail(videoPath);
      if (thumbnail) {
        this._applyThumbnail(placeholder, thumbnail);
      }
    }
  }

  async loadVisibleFolderPreviews(container) {
    const placeholders = container.querySelectorAll(
      ".thumbnail-placeholder.folder-placeholder[data-folder-path]",
    );
    for (const placeholder of placeholders) {
      const folderPath = placeholder.dataset.folderPath;
      const firstVideoPath = await this._getFirstVideoInFolder(folderPath);
      if (firstVideoPath) {
        const thumbnail = await this.loadThumbnail(firstVideoPath);
        if (thumbnail) {
          this._applyFolderThumbnail(placeholder, thumbnail);
        }
      }
    }
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

  _applyThumbnail(placeholder, thumbnail) {
    placeholder.style.backgroundImage = `url('${thumbnail}')`;
    placeholder.style.backgroundSize = "cover";
    placeholder.style.backgroundPosition = "center";
    const icon = placeholder.querySelector("i");
    if (icon) {
      icon.style.display = "flex";
      icon.style.position = "absolute";
      icon.style.bottom = "8px";
      icon.style.left = "8px";
      icon.style.background = "rgba(0, 0, 0, 0.7)";
      icon.style.borderRadius = "6px";
      icon.style.padding = "6px";
      icon.style.zIndex = "100";
      icon.style.width = "auto";
      icon.style.height = "auto";
      icon.style.fontSize = "20px";
      if (icon.classList.contains("fa-play-circle")) {
        icon.style.color = "#3498db";
      } else {
        icon.style.color = "#f39c12";
      }
    }
  }

  _applyFolderThumbnail(placeholder, thumbnail) {
    placeholder.style.backgroundImage = `url('${thumbnail}')`;
    placeholder.style.backgroundSize = "cover";
    placeholder.style.backgroundPosition = "center";
    const icon = placeholder.querySelector("i");
    if (icon) {
      icon.style.display = "flex";
      icon.style.position = "absolute";
      icon.style.bottom = "8px";
      icon.style.left = "8px";
      icon.style.background = "rgba(0, 0, 0, 0.7)";
      icon.style.borderRadius = "6px";
      icon.style.padding = "6px";
      icon.style.zIndex = "100";
      icon.style.width = "auto";
      icon.style.height = "auto";
      icon.style.fontSize = "20px";
      icon.style.color = "#f39c12";
    }
  }
}
