export class PlaylistManager {
  constructor(api, state, events) {
    this.api = api;
    this.state = state;
    this.events = events;
  }

  setTrackList(tracks) {
    this.trackList = tracks;
  }

  setCurrentIndex(index) {
    this.currentIndex = index;
  }

  async playAlbum(album) {
    if (this.state.isSwitching) return;
    this.state.isSwitching = true;
    this.state.currentAlbum = album;
    this.state.fillTrackCache(album);
    this.state.playlist = [...album.tracks];
    await this.api.stop();
    await this.api.setPlaylist(album.getTrackPaths());
    this.state.currentTrackIndex = 0;
    await this.api.play();
    this.state.isSwitching = false;
    this.events.emit("albumChanged", album);
    setTimeout(() => this._updateCurrentTrackName(), 50);
  }

  async playTrack(album, trackIndex) {
    if (this.state.isSwitching) return;
    this.state.isSwitching = true;
    this.state.currentAlbum = album;
    this.state.fillTrackCache(album);
    this.state.playlist = [...album.tracks];
    this.state.currentTrackIndex = trackIndex;
    await this.api.stop();
    await this.api.setPlaylist([album.tracks[trackIndex].path]);
    await this.api.play();
    this.state.isSwitching = false;
    this.events.emit("trackChanged", { album, trackIndex });
    setTimeout(() => this._updateCurrentTrackName(), 50);
  }

  async addAlbumToPlaylist(album) {
    this.state.fillTrackCache(album);
    for (const trackPath of album.getTrackPaths()) {
      await this.api.addToPlaylist(trackPath);
    }
    this.events.emit("playlistChanged");
  }

  async addTrackAfterCurrent(album, trackIndex) {
    this.state.fillTrackCache(album);
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

  async _updateCurrentTrackName() {
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
