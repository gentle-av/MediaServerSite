class PlaybackController {
  constructor(playerApi, eventBus) {
    this.api = playerApi;
    this.events = eventBus;
    this._currentAlbum = null;
    this._currentTrackIndex = -1;
    this._isPlaying = false;
    this._isSwitching = false;
    this._playlist = [];
    this._pollingInterval = null;
  }

  async init() {
    await this.api.checkAvailability();
    this._startPolling();
  }

  _startPolling() {
    if (this._pollingInterval) {
      clearInterval(this._pollingInterval);
    }
    this._pollingInterval = setInterval(async () => {
      if (!this._isSwitching) {
        const state = await this.api.getPlaybackState();
        if (state?.success) {
          this._isPlaying = state.data.isPlaying;
          const trackName =
            state.data.currentTrackName ||
            (state.data.currentTrack
              ? decodeURIComponent(
                  state.data.currentTrack.split("/").pop(),
                ).replace(/\.(flac|mp3|m4a|wav)$/i, "")
              : "");
          if (trackName && this._currentAlbum) {
            this.events.emit("stateChange", {
              ...state.data,
              currentTrackName: trackName,
            });
          } else {
            this.events.emit("stateChange", state.data);
          }
        }
      }
    }, 1000);
    console.log("[PlaybackController] Polling started");
  }

  _stopPolling() {
    if (this._pollingInterval) {
      clearInterval(this._pollingInterval);
      this._pollingInterval = null;
      console.log("[PlaybackController] Polling stopped");
    }
  }

  async playAlbum(album) {
    console.log("[PlaybackController] playAlbum:", album?.title);
    if (this._isSwitching) return;
    this._isSwitching = true;
    this._currentAlbum = album;
    this._playlist = [...album.tracks];
    await this.api.stop();
    await this.api.setPlaylist(album.getTrackPaths());
    this._currentTrackIndex = 0;
    await this.api.play();
    this._isSwitching = false;
    this.events.emit("albumChanged", album);
  }

  async playTrack(album, trackIndex) {
    console.log("[PlaybackController] playTrack:", album?.title, trackIndex);
    if (this._isSwitching) return;
    this._isSwitching = true;
    this._currentAlbum = album;
    this._playlist = [...album.tracks];
    this._currentTrackIndex = trackIndex;
    await this.api.stop();
    await this.api.setPlaylist([album.tracks[trackIndex].path]);
    await this.api.play();
    this._isSwitching = false;
    this.events.emit("trackChanged", { album, trackIndex });
  }

  async addAlbumToPlaylist(album) {
    console.log("[PlaybackController] addAlbumToPlaylist:", album?.title);
    for (const trackPath of album.getTrackPaths()) {
      await this.api.addToPlaylist(trackPath);
    }
    this.events.emit("playlistChanged");
  }

  async addTrackAfterCurrent(album, trackIndex) {
    console.log("[PlaybackController] addTrackAfterCurrent");
    const state = await this.api.getPlaybackState();
    const currentIndex = state?.data?.currentIndex ?? -1;
    const currentPlaylist = await this.api.getPlaylist();
    let existingTracks =
      currentPlaylist?.data?.tracks || currentPlaylist?.data || [];
    const newPlaylist = [...existingTracks];
    newPlaylist.splice(currentIndex + 1, 0, album.tracks[trackIndex].path);
    await this.api.setPlaylist(newPlaylist);
    this.events.emit("playlistChanged");
  }

  async togglePlayPause() {
    console.log("[PlaybackController] togglePlayPause");
    const state = await this.api.getPlaybackState();
    if (state?.data?.isPlaying) {
      await this.api.pause();
    } else {
      await this.api.play();
    }
  }

  async next() {
    console.log("[PlaybackController] next");
    await this.api.next();
  }

  async previous() {
    console.log("[PlaybackController] previous");
    await this.api.previous();
  }

  async stop() {
    console.log("[PlaybackController] stop");
    await this.api.stop();
  }

  async seek(percent, progressBar) {
    const rect = progressBar.getBoundingClientRect();
    const timeInfo = await this.api.getCurrentTime();
    if (timeInfo?.data?.duration) {
      const seekTime = timeInfo.data.duration * percent;
      console.log("[PlaybackController] seek to:", seekTime);
      await this.api.seek(seekTime);
    }
  }
}
