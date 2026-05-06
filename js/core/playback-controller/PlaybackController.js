import { PlaybackState } from "./PlaybackState.js";
import { PlaybackPolling } from "./PlaybackPolling.js";
import { PlaybackActions } from "./PlaybackActions.js";
import { PlaylistManager } from "./PlaylistManager.js";

export class PlaybackController {
  constructor(playerApi, eventBus) {
    this.api = playerApi;
    this.events = eventBus;
    this.state = new PlaybackState();
    this.polling = null;
    this.actions = null;
    this.playlistManager = null;
  }

  async init() {
    await this.api.checkAvailability();
    this.polling = new PlaybackPolling(this.api, this.state, this.events, null);
    this.actions = new PlaybackActions(this.api, this.state, this.events);
    this.playlistManager = new PlaylistManager(
      this.api,
      this.state,
      this.events,
    );
    this.polling.start();
  }

  getTrackNameByPath(path) {
    return this.state.getTrackNameByPath(path);
  }

  async playAlbum(album) {
    return this.playlistManager.playAlbum(album);
  }

  async playTrack(album, trackIndex) {
    return this.playlistManager.playTrack(album, trackIndex);
  }

  async addAlbumToPlaylist(album) {
    return this.playlistManager.addAlbumToPlaylist(album);
  }

  async addTrackAfterCurrent(album, trackIndex) {
    return this.playlistManager.addTrackAfterCurrent(album, trackIndex);
  }

  async togglePlayPause() {
    return this.actions.togglePlayPause();
  }

  async next(mediaType = "audio") {
    return this.actions.next(mediaType);
  }

  async previous(mediaType = "audio") {
    return this.actions.previous(mediaType);
  }

  async seekRelative(seconds) {
    return this.actions.seekRelative(seconds);
  }

  async stop() {
    return this.actions.stop();
  }

  async seek(percent, progressBar) {
    return this.actions.seek(percent, progressBar);
  }

  async play() {
    return this.actions.play();
  }

  async pause() {
    return this.actions.pause();
  }

  destroy() {
    if (this.polling) {
      this.polling.stop();
    }
  }
}
