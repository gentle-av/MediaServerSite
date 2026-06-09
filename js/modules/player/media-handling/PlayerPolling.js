import { PollingStrategyFactory } from "./polling/PollingStrategyFactory.js";

export class PlayerPolling {
  constructor(api, core, progress, uiUpdater, onStateChange) {
    this.api = api;
    this.core = core;
    this.progress = progress;
    this.uiUpdater = uiUpdater;
    this.onStateChange = onStateChange;
    this._intervalId = null;
    this._currentStrategy = null;
    this._lastMediaType = null;
    this.interval = 1000;
  }

  start() {
    if (this._intervalId) {
      return;
    }
    this._intervalId = setInterval(() => {
      this._poll();
    }, this.interval);
  }

  stop() {
    if (this._intervalId) {
      clearInterval(this._intervalId);
      this._intervalId = null;
    }
  }

  async _poll() {
    const currentType = PollingStrategyFactory.getType(this.core);
    if (currentType !== this._lastMediaType) {
      this._cleanupStrategy();
      if (currentType) {
        this._currentStrategy = PollingStrategyFactory.create(
          currentType,
          this.api,
          this.core,
          this.uiUpdater,
          this.progress,
          this.onStateChange,
        );
      }
      this._lastMediaType = currentType;
    }
    if (this._currentStrategy) {
      await this._currentStrategy.execute();
    }
  }

  _cleanupStrategy() {
    if (this._currentStrategy) {
      this._currentStrategy.cleanup();
      this._currentStrategy = null;
    }
  }
}
