import { VideoLibraryState } from "./VideoLibraryState.js";
import { VideoLibraryDOM } from "./VideoLibraryDOM.js";
import { VideoLibraryRenderer } from "./VideoLibraryRenderer.js";
import { VideoLibraryThumbnailLoader } from "./VideoLibraryThumbnailLoader.js";
import { VideoLibraryEvents } from "./VideoLibraryEvents.js";

export class VideoLibrary {
  constructor(apiClient, events, navigationManager) {
    this.api = apiClient;
    this.events = events;
    this.navigation = navigationManager;
    this.state = new VideoLibraryState();
    this.dom = new VideoLibraryDOM();
    this.renderer = new VideoLibraryRenderer(this.dom, this.state);
    this.thumbnailLoader = new VideoLibraryThumbnailLoader(
      this.api,
      this.state,
    );
    this.eventsHandler = null;
    this._init();
  }

  _init() {
    this.eventsHandler = new VideoLibraryEvents(
      this.api,
      this.events,
      this.state,
      this.dom,
      this.renderer,
      this.thumbnailLoader,
      (path) => this.playVideo(path),
      (path, addToHistory) => this.loadDirectory(path, addToHistory),
    );
    this.eventsHandler.bindEvents();
    this.loadDirectory(this.state.getCurrentPath(), false);
  }

  playVideo(path) {
    console.log("[VideoLibrary] playVideo called with path:", path);
    this.events.emit("video:play", path);
    const modal = document.getElementById("videoPreviewModal");
    if (modal) modal.classList.remove("active");
  }

  async loadDirectory(path, addToHistory = true) {
    console.log("[VideoLibrary] loadDirectory called with path:", path);
    this.state.setCurrentPath(path, addToHistory);
    this._updateBreadcrumbs();
    this.dom.showLoading();
    const data = await this.api.post("/api/list", { path });
    if (data.success) {
      console.log("[VideoLibrary] Items count:", data.items?.length);
      this.renderer.render(data.items);
      this.eventsHandler.attachItemEvents(this.dom.getContainer());
      await this.thumbnailLoader.loadVisibleThumbnails(this.dom.getContainer());
      await this.thumbnailLoader.loadVisibleFolderPreviews(
        this.dom.getContainer(),
      );
      this.renderer.ensureIconsVisible();
      this.dom.adjustBottomPadding();
    } else {
      console.error("[VideoLibrary] Error:", data.error);
      this.dom.showError(data.error || "Ошибка загрузки");
    }
  }

  _updateBreadcrumbs() {
    const rootPath = "/mnt/video";
    if (this.state.getCurrentPath() === rootPath) {
      this.dom.updateBreadcrumbs(
        [],
        () => this.loadDirectory(rootPath, true),
        () => {},
      );
      return;
    }
    let relativePath = this.state.getCurrentPath().substring(rootPath.length);
    if (relativePath.startsWith("/")) relativePath = relativePath.substring(1);
    const pathParts = relativePath.split("/").filter((part) => part.length > 0);
    let currentPath = rootPath;
    const parts = [];
    for (let i = 0; i < pathParts.length; i++) {
      const part = pathParts[i];
      currentPath += "/" + part;
      parts.push({ name: part, path: currentPath });
    }
    this.dom.updateBreadcrumbs(
      parts,
      () => this.loadDirectory(rootPath, true),
      (path) => this.loadDirectory(path, true),
    );
  }

  async deleteItem(path, name, isDirectory) {
    await this.eventsHandler.onDeleteItem({ path, name, isDir: isDirectory });
  }

  refresh() {
    this.eventsHandler.onRefresh();
  }

  goBack() {
    const previousPath = this.state.goBack();
    if (previousPath) {
      this.loadDirectory(previousPath, false);
    }
  }

  getCurrentPath() {
    return this.state.getCurrentPath();
  }

  async refreshCurrentDirectory() {
    await this.loadDirectory(this.state.getCurrentPath(), false);
  }

  destroy() {
    const container = this.dom.getContainer();
    if (container) {
      const cards = container.querySelectorAll(".item-card");
      cards.forEach((card) => {
        if (card._cleanupSwipe) card._cleanupSwipe();
      });
      container.innerHTML = "";
    }
    this.state.reset();
  }
}
