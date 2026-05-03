export class PlaybackPolling {
  constructor(api, state, events, uiUpdater) {
    this.api = api;
    this.state = state;
    this.events = events;
    this.uiUpdater = uiUpdater;
    this._pollingInterval = null;
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
    if (
      !player.currentFile ||
      player.currentFile !== pollState.data.currentTrack
    ) {
      player.currentFile = pollState.data.currentTrack;
      player.mediaType = "audio";
      if (player.uiUpdater) {
        player.uiUpdater.updateFileInfo(pollState.data.currentTrack);
        player.uiUpdater.updateMediaIcon("audio");
        player.uiUpdater.updatePlayPauseButton(pollState.data.isPlaying);
      } else {
        player._updateFileInfo(pollState.data.currentTrack);
        player._updateMediaIcon();
        player._updatePlayPauseButton(pollState.data.isPlaying);
      }
      if (player._loadAlbumCover) {
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
