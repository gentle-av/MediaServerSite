export class PlayerPolling {
  constructor(api, core, progress, uiUpdater, onStateChange) {
    this.api = api;
    this.core = core;
    this.progress = progress;
    this.uiUpdater = uiUpdater;
    this.onStateChange = onStateChange;
    this._progressInterval = null;
    this._isPollingStarted = false;
    this._lastCurrentTime = 0;
  }

  start() {
    console.log("[Polling] start called, core.mediaType:", this.core.mediaType);
    if (this._progressInterval) {
      console.log("[Polling] Clearing existing interval");
      clearInterval(this._progressInterval);
      this._progressInterval = null;
    }
    this._isPollingStarted = true;
    this._progressInterval = setInterval(async () => {
      if (this.core.isDestroyed()) return;
      if (this.core.shouldIgnorePolling()) return;
      try {
        if (this.core.isAudio() && this.api.playerApi) {
          console.log("[Polling] Polling audio...");
          await this._pollAudio();
        } else if (this.core.isVideo()) {
          console.log("[Polling] Polling video...");
          await this._pollVideo();
        } else {
          console.log("[Polling] No active media type:", this.core.mediaType);
        }
      } catch (error) {
        console.error("[Polling] error:", error);
      }
    }, 500);
    console.log("[Polling] Interval started, id:", this._progressInterval);
  }

  async _pollAudio() {
    console.log(
      "[Polling] _pollAudio called, core.isAudio:",
      this.core.isAudio(),
    );
    const timeInfo = await this.api.getAudioCurrentTime();
    console.log("[Polling] timeInfo:", timeInfo);
    if (timeInfo && timeInfo.success) {
      console.log(
        "[Polling] Updating progress:",
        timeInfo.currentTime,
        timeInfo.duration,
      );
      this.progress.update(timeInfo.currentTime || 0, timeInfo.duration || 0);
    } else {
      console.log("[Polling] No valid timeInfo");
    }
    const state = await this.api.getAudioPlaybackState();
    console.log("[Polling] audio state:", state);
    if (state && state.success) {
      const trackChanged =
        state.currentTrack && state.currentTrack !== this.core.currentFile;
      if (trackChanged) {
        console.log("[Polling] Track changed to:", state.currentTrack);
        this.core.currentFile = state.currentTrack;
        this.uiUpdater.updateFileInfo(this.core.currentFile);
        const metadata = await this.api.getFileMetadata(this.core.currentFile);
        let artist = "";
        let title = "";
        let coverUrl = null;
        if (metadata?.data) {
          if (metadata.data.file) {
            artist = metadata.data.file.artist || "";
            title = metadata.data.file.title || "";
            coverUrl = metadata.data.file.cover || null;
          }
          if (!title && metadata.data.database) {
            title = metadata.data.database.title || "";
            artist = metadata.data.database.artist || "";
          }
          if (!coverUrl && title) {
            coverUrl = await this.api.getAlbumCover(
              this.core.currentFile,
              title,
              artist,
            );
          }
        }
        if (!title) {
          let fileName = this.core.currentFile.split("/").pop();
          fileName = fileName.replace(/\.(flac|mp3|m4a|wav|ogg|aac)$/i, "");
          const match = fileName.match(/^\d+\s*[-.]?\s*(.+)$/);
          title = match ? match[1] : fileName;
        }
        this.uiUpdater.updateTrackFullInfo(title, artist, coverUrl);
        if (this.onStateChange) this.onStateChange(state);
      }
      const wasPlaying = this.core.isPlaying;
      this.core.isPlaying = state.isPlaying || false;
      if (wasPlaying !== this.core.isPlaying) {
        console.log("[Polling] Playing state changed to:", this.core.isPlaying);
        this.uiUpdater.updatePlayPauseButton(this.core.isPlaying);
      }
      if (state.currentIndex !== undefined && state.totalTracks !== undefined) {
        this.uiUpdater.updateTrackCount(state.currentIndex, state.totalTracks);
      }
    }
  }

  async _pollVideo() {
    const status = await this.api.getVideoStatus();
    if (!status) {
      return;
    }
    if (status.success && status.currentFile) {
      if (status.currentFile !== this.core.currentFile) {
        this.core.currentFile = status.currentFile;
        this.uiUpdater.updateFileInfo(this.core.currentFile);
      }
      const isPlaying = !status.paused;
      if (this.core.isPlaying !== isPlaying) {
        this.core.setPlaying(isPlaying);
        this.uiUpdater.updatePlayPauseButton(isPlaying);
      }
      const currentTime = status.currentTime || 0;
      const duration = status.duration || 0;
      this.progress.update(currentTime, duration);
    }
  }

  stop() {
    if (this._progressInterval) {
      clearInterval(this._progressInterval);
      this._progressInterval = null;
      this._isPollingStarted = false;
    }
  }
}
