export class VideoEventHandlers {
  constructor(core, videoPageManager) {
    this.core = core;
    this.videoPageManager = videoPageManager;
    this._boundHandlers = new Map();
  }

  setup() {
    this._register("video:refresh", this._handleVideoRefresh.bind(this));
    this._register("player:clearState", this._handleClearState.bind(this));
  }

  _register(event, handler) {
    this.core.events.on(event, handler);
    this._boundHandlers.set(event, handler);
  }

  _handleVideoRefresh() {
    const library = this.videoPageManager.videoLibrary;
    if (library?.refresh) {
      library.refresh();
    }
  }

  _handleClearState() {
    if (this.core.universalPlayer?.clearState) {
      this.core.universalPlayer.clearState();
    }
  }

  destroy() {
    for (const [event, handler] of this._boundHandlers) {
      this.core.events.off(event, handler);
    }
    this._boundHandlers.clear();
  }
}
