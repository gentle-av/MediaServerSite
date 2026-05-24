import { PollingStrategy } from "./PollingStrategy.js";

export class VideoPollingStrategy extends PollingStrategy {
  constructor(api, core, uiUpdater, progress, onStateChange) {
    super(api, core, uiUpdater, progress, onStateChange);
  }

  async execute() {
    const status = await this.api.getVideoStatus();
    if (!status) return;
    if (status.success && status.currentFile) {
      await this._handleFileChange(status);
      this._handlePlaybackState(status);
      this._handleProgress(status);
    }
  }

  async _handleFileChange(status) {
    if (status.currentFile !== this.core.currentFile) {
      this.core.currentFile = status.currentFile;
      this.uiUpdater.updateFileInfo(this.core.currentFile);
      const thumbnail = await this.api.getVideoThumbnail(this.core.currentFile);
      if (thumbnail) {
        this.uiUpdater.showPreviewImage(thumbnail);
      } else {
        this.uiUpdater.updateMediaIcon("video");
      }
    }
  }

  _handlePlaybackState(status) {
    const isPlaying = !status.paused;
    if (this.core.isPlaying !== isPlaying) {
      this.core.setPlaying(isPlaying);
      this.uiUpdater.updatePlayPauseButton(isPlaying);
    }
  }

  _handleProgress(status) {
    const currentTime = status.currentTime || 0;
    const duration = status.duration || 0;
    this.progress.update(currentTime, duration);
  }
}
