export class PollingStrategy {
  constructor(api, core, uiUpdater, progress, onStateChange) {
    this.api = api;
    this.core = core;
    this.uiUpdater = uiUpdater;
    this.progress = progress;
    this.onStateChange = onStateChange;
    this.state = {};
  }

  async execute() {
    throw new Error("Method 'execute()' must be implemented.");
  }

  cleanup() {}
}
