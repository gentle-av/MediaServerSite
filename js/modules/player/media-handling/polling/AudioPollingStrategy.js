import { MetadataExtractor } from "../../utils/MetadataExtractor.js";
import { PollingStrategy } from "./PollingStrategy.js";

export class AudioPollingStrategy extends PollingStrategy {
  constructor(api, core, uiUpdater, progress, onStateChange) {
    super(api, core, uiUpdater, progress, onStateChange);
    this._lastTrackEnded = false;
    this._stuckCounter = 0;
    this._lastSkipTime = 0;
    this._lastKnownTrack = null;
  }

  async execute() {
    const timeInfo = await this.api.getAudioCurrentTime();
    const state = await this.api.getAudioPlaybackState();
    if (!state || !state.success) return;
    const totalTracks = state.totalTracks || 0;
    const currentIndex = state.currentIndex || 0;
    const isLastTrack = currentIndex >= totalTracks - 1;
    const now = Date.now();
    if (timeInfo && timeInfo.success) {
      const duration = timeInfo.duration || 0;
      const currentTime = timeInfo.currentTime || 0;
      this.progress.update(currentTime, duration);
      this._handleTrackStuckLogic(currentTime, duration, isLastTrack, now);
      this._handleTrackEndLogic(currentTime, duration, isLastTrack, now);
    }
    await this._handleMetadataUpdate(state);
    this._updateUiState(state);
  }

  _handleTrackStuckLogic(currentTime, duration, isLastTrack, now) {
    if (
      duration === 0 &&
      currentTime === 0 &&
      !isLastTrack &&
      !this._lastTrackEnded
    ) {
      this._stuckCounter++;
      if (this._stuckCounter >= 4 && now - this._lastSkipTime > 3000) {
        this._triggerNextTrack(now);
      }
    } else {
      if (this._stuckCounter > 0) this._stuckCounter = 0;
    }
  }

  _handleTrackEndLogic(currentTime, duration, isLastTrack, now) {
    if (
      duration > 0 &&
      currentTime > 0 &&
      duration - currentTime < 0.5 &&
      !this._lastTrackEnded &&
      !isLastTrack
    ) {
      this._triggerNextTrack(now);
    } else if (duration > 0 && currentTime > 0 && duration - currentTime > 1) {
      if (this._lastTrackEnded) this._lastTrackEnded = false;
    }
  }

  async _triggerNextTrack(now) {
    this._lastTrackEnded = true;
    this._lastSkipTime = now;
    this._stuckCounter = 0;
    await this.api.audioNext();
    setTimeout(() => {
      this._lastTrackEnded = false;
    }, 3000);
  }

  async _handleMetadataUpdate(state) {
    const trackChanged =
      state.currentTrack && state.currentTrack !== this.core.currentFile;
    if (trackChanged) {
      this.core.currentFile = state.currentTrack;
      this.uiUpdater.updateFileInfo(this.core.currentFile);
      try {
        const { title, artist, coverUrl } =
          await MetadataExtractor.extractTrackInfo(
            this.api,
            this.core.currentFile,
          );
        this.uiUpdater.updateTrackFullInfo(title, artist, coverUrl);
      } catch (e) {
        console.warn("Failed to extract metadata", e);
      }
      if (this.onStateChange) this.onStateChange(state);
    }
  }

  _updateUiState(state) {
    const wasPlaying = this.core.isPlaying;
    this.core.isPlaying = state.isPlaying || false;
    if (wasPlaying !== this.core.isPlaying) {
      this.uiUpdater.updatePlayPauseButton(this.core.isPlaying);
    }
    if (state.currentIndex !== undefined && state.totalTracks !== undefined) {
      this.uiUpdater.updateTrackCount(state.currentIndex, state.totalTracks);
    }
  }

  cleanup() {
    this._stuckCounter = 0;
    this._lastTrackEnded = false;
  }
}
