// js/main/managers/PlaybackManager.js
import { PlaybackController } from "../../core/playback-controller/PlaybackController.js";
import { PlayerAPI } from "../../ui/universal-player/PlayerApi.js";
import { UniversalPlayer } from "../../ui/universal-player.js";

export class PlaybackManager {
  constructor(core) {
    this.core = core;
    this.playback = null;
    this.universalPlayer = null;
    this._isInitialized = false;
  }

  async init() {
    this.playback = new PlaybackController(
      this.core.playerApi,
      this.core.events,
    );
    await this.playback.init();
    const playerAPI = new PlayerAPI(
      this.core.api,
      this.core.musicApi,
      this.core.playerApi,
    );
    this.universalPlayer = new UniversalPlayer(
      playerAPI,
      this.core.events,
      this.core.musicApi,
      this.core.playerApi,
      this.core.api,
    );
    window.universalPlayerInstance = this.universalPlayer;
    this.core.universalPlayer = this.universalPlayer;
    this._isInitialized = true;
    return this;
  }

  async checkExistingPlaybacks(type = null) {
    if (!this.universalPlayer?.checkExistingPlayback) return;
    if (!type || type === "audio") {
      await this.universalPlayer.checkExistingPlayback("audio");
    }
    if (!type || type === "video") {
      await this.universalPlayer.checkExistingPlayback("video");
    }
  }

  setupVideoEvents() {
    this.core.events.on("player:clearState", () => {
      if (this.universalPlayer) {
        this.universalPlayer.clearState();
      }
    });
  }

  syncWithPlayback() {
    if (this.universalPlayer?.syncWithPlayback) {
      this.universalPlayer.syncWithPlayback();
    }
  }

  async addAlbumToPlaylist(album) {
    if (this.playback?.addAlbumToPlaylist) {
      await this.playback.addAlbumToPlaylist(album);
    }
  }

  playTrack(album, trackIndex) {
    if (this.playback?.playTrack) {
      this.playback.playTrack(album, trackIndex);
    }
  }

  async clearPlaylist() {
    if (this.playback?.api?.clearPlaylist) {
      await this.playback.api.clearPlaylist();
    }
  }

  destroy() {
    if (this.universalPlayer?.destroy) {
      this.universalPlayer.destroy();
    }
    this._isInitialized = false;
  }
}
