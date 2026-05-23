export class AudioOutputHandler {
  constructor(audioOutputService, audioOutputUI) {
    this.audioOutputService = audioOutputService;
    this.audioOutputUI = audioOutputUI;
    this._currentOutput = "speakers";
  }

  async load() {
    try {
      const res = await this.audioOutputService.getCurrentOutput();
      if (res.success && res.data && res.data.current) {
        this._currentOutput = res.data.current;
        this.audioOutputUI.update(this._currentOutput);
      }
    } catch (error) {
      console.error("Load audio output error:", error);
    }
  }

  async switchToSpeakers() {
    try {
      const res = await this.audioOutputService.switchToSpeakers();
      if (res && res.success) {
        this._currentOutput = "speakers";
        this.audioOutputUI.update(this._currentOutput);
      }
    } catch (error) {
      console.error("Switch to speakers error:", error);
    }
  }

  async switchToHeadphones() {
    try {
      const res = await this.audioOutputService.switchToHeadphones();
      if (res && res.success) {
        this._currentOutput = "headphones";
        this.audioOutputUI.update(this._currentOutput);
      }
    } catch (error) {
      console.error("Switch to headphones error:", error);
    }
  }
}
