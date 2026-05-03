export class PlaybackActions {
  constructor(api, state, events) {
    this.api = api;
    this.state = state;
    this.events = events;
  }

  async play() {
    await this.api.play();
    this.state.isPlaying = true;
    this._updatePlayerUI(true);
  }

  async pause() {
    await this.api.pause();
    this.state.isPlaying = false;
    this._updatePlayerUI(false);
  }

  async stop() {
    await this.api.stop();
    this.state.reset();
    this._updatePlayerUI(false);
  }

  async next() {
    await this.api.next();
    setTimeout(() => this._updateTrackName(), 50);
  }

  async previous() {
    await this.api.previous();
    setTimeout(() => this._updateTrackName(), 50);
  }

  async seek(percent, progressBar) {
    const rect = progressBar.getBoundingClientRect();
    const timeInfo = await this.api.getCurrentTime();
    if (timeInfo?.data?.duration) {
      const seekTime = timeInfo.data.duration * percent;
      await this.api.seek(seekTime);
    }
  }

  async togglePlayPause() {
    const state = await this.api.getPlaybackState();
    if (state?.data?.isPlaying) {
      await this.pause();
    } else {
      await this.play();
    }
  }

  _updatePlayerUI(isPlaying) {
    const player = window.universalPlayerInstance;
    if (player && player.uiUpdater) {
      player.uiUpdater.updatePlayPauseButton(isPlaying);
      player.core?.setPlaying(isPlaying);
    }
  }

  async _updateTrackName() {
    const state = await this.api.getPlaybackState();
    if (!state?.success) return;
    let trackName = this.state.getTrackNameByPath(state.data.currentTrack);
    if (!trackName && this.state.currentAlbum) {
      const track = this.state.currentAlbum.tracks.find(
        (t) => t.path === state.data.currentTrack,
      );
      if (track && track.title) {
        trackName = track.title;
        this.state.trackNameCache.set(state.data.currentTrack, trackName);
      }
    }
    this.events.emit("stateChange", {
      ...state.data,
      currentTrackName: trackName,
    });
  }
}
