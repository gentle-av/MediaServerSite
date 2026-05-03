export class VideoLibraryState {
  constructor() {
    this.currentPath = "/mnt/video";
    this.history = [];
    this.thumbnailCache = new Map();
    this._debounceTimeout = null;
  }

  getCurrentPath() {
    return this.currentPath;
  }

  setCurrentPath(path, addToHistory = true) {
    this.currentPath = path;
    if (addToHistory) {
      this.history.push(path);
    }
  }

  goBack() {
    if (this.history.length > 1) {
      this.history.pop();
      return this.history[this.history.length - 1];
    }
    return null;
  }

  getThumbnail(path) {
    return this.thumbnailCache.get(path);
  }

  setThumbnail(path, thumbnail) {
    this.thumbnailCache.set(path, thumbnail);
  }

  clearCache() {
    this.thumbnailCache.clear();
  }

  reset() {
    this.currentPath = "/mnt/video";
    this.history = [];
    this.clearCache();
  }
}
