export class PlaybackPolling {
  constructor(api, state, events, uiUpdater) {
    this.api = api;
    this.state = state;
    this.events = events;
    this.uiUpdater = uiUpdater;
    this._pollingInterval = null;
  }

  getMediaTypeFromPath(filePath) {
    const videoExtensions = [
      ".mp4",
      ".mkv",
      ".avi",
      ".mov",
      ".webm",
      ".m4v",
      ".flv",
      ".wmv",
    ];
    const ext = filePath.substring(filePath.lastIndexOf(".")).toLowerCase();
    return videoExtensions.includes(ext) ? "video" : "audio";
  }

  start() {
    if (this._pollingInterval) {
      clearInterval(this._pollingInterval);
    }
    this._pollingInterval = setInterval(async () => {
      if (!this.state.isSwitching) {
        const pollState = await this.api.getPlaybackState();
        if (pollState?.success) {
          this.state.isPlaying = pollState.data.isPlaying;
          this._updateUniversalPlayer(pollState);
        }
      }
    }, 2000);
  }

  _updateUniversalPlayer(pollState) {
    if (!pollState.data.currentTrack) return;
    const player = window.universalPlayerInstance;
    if (!player) return;
    const mediaType = this.getMediaTypeFromPath(pollState.data.currentTrack);
    player.mediaType = mediaType;
    if (
      !player.currentFile ||
      player.currentFile !== pollState.data.currentTrack
    ) {
      player.currentFile = pollState.data.currentTrack;
      if (player.uiUpdater) {
        player.uiUpdater.updateFileInfo(pollState.data.currentTrack);
        player.uiUpdater.updateMediaIcon(mediaType);
        player.uiUpdater.updatePlayPauseButton(pollState.data.isPlaying);
      } else {
        player._updateFileInfo(pollState.data.currentTrack);
        player._updateMediaIcon();
        player._updatePlayPauseButton(pollState.data.isPlaying);
      }
      if (player._loadAlbumCover && mediaType === "audio") {
        player._loadAlbumCover(pollState.data.currentTrack);
      }
      player.show();
    }
  }

  stop() {
    if (this._pollingInterval) {
      clearInterval(this._pollingInterval);
      this._pollingInterval = null;
    }
  }
}
