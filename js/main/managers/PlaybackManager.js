import { UniversalPlayer } from "../../ui/universal-player/UniversalPlayer.js";
import { PlayerAPI } from "../../ui/universal-player/PlayerApi.js";

export class PlaybackManager {
  constructor(core) {
    console.log("[PlaybackManager] CONSTRUCTOR");
    this.core = core;
    this.universalPlayer = null;
    this._isInitialized = false;
    this._restored = false;
  }

  async init() {
    console.log("[PlaybackManager] init START");
    const playerAPI = new PlayerAPI(this.core.api, this.core.musicApi, null);
    console.log("[PlaybackManager] playerAPI created");
    this.universalPlayer = new UniversalPlayer(
      playerAPI,
      this.core.events,
      this.core.musicApi,
      null,
      this.core.api,
    );
    window.universalPlayerInstance = this.universalPlayer;
    this.core.universalPlayer = this.universalPlayer;
    this._isInitialized = true;
    console.log("[PlaybackManager] init DONE");
    return this;
  }

  async checkExistingPlaybacks() {
    console.log(
      "[PlaybackManager] checkExistingPlaybacks START, _restored:",
      this._restored,
    );
    if (this._restored) {
      console.log("[PlaybackManager] Already restored");
      return;
    }
    if (!this.universalPlayer) {
      console.log("[PlaybackManager] universalPlayer not ready");
      return;
    }
    this._restored = true;
    console.log(
      "[PlaybackManager] Calling universalPlayer.checkAndRestorePlayback",
    );
    await this.universalPlayer.checkAndRestorePlayback();
  }

  setupVideoEvents() {
    this.core.events.on("player:clearState", () => {
      if (this.universalPlayer) {
        this.universalPlayer.clearState();
      }
    });
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
