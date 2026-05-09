export class PlayerEvents {
  constructor(handlers) {
    this.handlers = handlers;
    this.boundHandlers = new Map();
  }

  attach(dom) {
    const elements = dom.getAll();
    this._attachClick(elements.universalBottomPlayPauseBtn, () =>
      this.handlers.onTogglePlayPause?.(),
    );
    this._attachClick(elements.universalBottomPrevBtn, () =>
      this.handlers.onPrev?.(),
    );
    this._attachClick(elements.universalBottomNextBtn, () =>
      this.handlers.onNext?.(),
    );
    this._attachClick(elements.universalBottomStopBtn, () =>
      this.handlers.onStop?.(),
    );
    this._attachClick(elements.universalBottomFullscreenBtn, () =>
      this.handlers.onFullscreen?.(),
    );
    this._attachClick(elements.universalMinimizeBar, () =>
      this.handlers.onToggleMinimize?.(),
    );
    this._attachClick(elements.universalBottomSettingsToggle, () =>
      this.handlers.onToggleSettings?.(),
    );
    this._attachClick(elements.universalBottomVolumeDown, () =>
      this.handlers.onVolumeDown?.(),
    );
    this._attachClick(elements.universalBottomVolumeUp, () =>
      this.handlers.onVolumeUp?.(),
    );
    this._attachClick(elements.universalBottomVolumeMute, () =>
      this.handlers.onToggleMute?.(),
    );
    this._attachClick(elements.universalBottomSpeakersBtn, () =>
      this.handlers.onSpeakers?.(),
    );
    this._attachClick(elements.universalBottomHeadphonesBtn, () =>
      this.handlers.onHeadphones?.(),
    );
    if (elements.universalBottomProgressBar) {
      const handler = (e) => this.handlers.onProgressClick?.(e);
      elements.universalBottomProgressBar.addEventListener("click", handler);
      this.boundHandlers.set("progressClick", handler);
    }
    this._attachChannelEvents();
  }

  _attachChannelEvents() {
    const channelInput = document.getElementById("sysChannelInput");
    const channelGo = document.getElementById("sysChannelGo");
    if (channelGo && this.handlers.onChannelGo) {
      channelGo.addEventListener("click", this.handlers.onChannelGo);
      this.boundHandlers.set("channelGo", this.handlers.onChannelGo);
    }
    if (channelInput && this.handlers.onChannelEnter) {
      const handler = this.handlers.onChannelEnter;
      channelInput.addEventListener("keypress", handler);
      this.boundHandlers.set("channelEnter", handler);
    }
  }

  _attachClick(element, handler) {
    if (element && handler) {
      element.addEventListener("click", handler);
      this.boundHandlers.set(element.id, handler);
    }
  }

  detach(dom) {
    const elements = dom.getAll();
    for (const [id, handler] of this.boundHandlers) {
      const element = elements[id];
      if (element) {
        element.removeEventListener("click", handler);
      }
    }
    const channelInput = document.getElementById("sysChannelInput");
    const channelGo = document.getElementById("sysChannelGo");
    if (channelGo && this.boundHandlers.has("channelGo")) {
      channelGo.removeEventListener(
        "click",
        this.boundHandlers.get("channelGo"),
      );
    }
    if (channelInput && this.boundHandlers.has("channelEnter")) {
      channelInput.removeEventListener(
        "keypress",
        this.boundHandlers.get("channelEnter"),
      );
    }
    this.boundHandlers.clear();
  }
}
