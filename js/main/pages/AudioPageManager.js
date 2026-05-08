import { AlbumLibrary } from "../../ui/album-library/AlbumLibrary.js";
import { AlbumModal } from "../../ui/album-modal.js";
import { TrackList } from "../../ui/track-list.js";
import { PlaylistPopup } from "../../ui/playlist-popup/PlaylistPopup.js";

export class AudioPageManager {
  constructor(core, playbackManager) {
    this.core = core;
    this.playbackManager = playbackManager;
    this.albumLibrary = null;
    this.albumModal = null;
    this.playlistPopup = null;
    this._isInitialized = false;
  }

  async onPageLoaded() {
    this._updateUI();
    await this.playbackManager.checkExistingPlaybacks("audio");
    this._initAlbumModal();
    await this._initAlbumLibrary();
    this._initPlaylistPopup();
    this._cacheTrackNames();
    setTimeout(() => this._checkExistingPlayback(), 500);
    this._isInitialized = true;
  }

  _updateUI() {
    if (this.core._updateUIForPage) {
      this.core._updateUIForPage("audio");
    }
  }

  _initAlbumModal() {
    if (this.albumModal) {
      this.albumModal.hide();
      this.albumModal = null;
    }
    this.albumModal = new AlbumModal(this.core.events, this.core.musicApi);
    const trackList = new TrackList(this.core.events);
    this.albumModal.setTrackList(trackList);
    this.core.albumModal = this.albumModal;
  }

  async _initAlbumLibrary() {
    if (this.albumLibrary) {
      this.albumLibrary.destroy();
      this.albumLibrary = null;
    }
    this.albumLibrary = new AlbumLibrary(this.core.musicApi, this.core.events);
    await this.albumLibrary.init();
    this.core.albumLibrary = this.albumLibrary;
  }

  _initPlaylistPopup() {
    if (!this.playlistPopup && typeof PlaylistPopup !== "undefined") {
      this.playlistPopup = new PlaylistPopup(
        this.playbackManager.playback,
        this.core.events,
        this.albumLibrary,
      );
      this.core.playlistPopup = this.playlistPopup;
    } else if (this.playlistPopup) {
      this.playlistPopup.albumLibrary = this.albumLibrary;
      if (this.playlistPopup.tracksCache)
        this.playlistPopup.tracksCache.clear();
      if (this.playlistPopup.refresh) this.playlistPopup.refresh();
    }
  }

  _cacheTrackNames() {
    if (!this.playbackManager.playback?._trackNameCache) return;
    if (!this.albumLibrary?.albums) return;
    for (const album of this.albumLibrary.albums) {
      for (const track of album.tracks) {
        if (track.path && track.title) {
          this.playbackManager.playback._trackNameCache.set(
            track.path,
            track.title,
          );
        }
      }
    }
    if (this.playbackManager.universalPlayer) {
      this.playbackManager.universalPlayer.syncWithPlayback();
    }
  }

  async _checkExistingPlayback() {
    if (this.playbackManager.universalPlayer?.checkExistingPlayback) {
      await this.playbackManager.universalPlayer.checkExistingPlayback("audio");
    }
    if (this.playbackManager.universalPlayer?.core?.currentFile) {
      if (this.playbackManager.universalPlayer.show) {
        this.playbackManager.universalPlayer.show();
      }
    }
  }

  getAlbumLibrary() {
    return this.albumLibrary;
  }

  getAlbumModal() {
    return this.albumModal;
  }

  destroy() {
    if (this.albumLibrary) {
      this.albumLibrary.destroy();
      this.albumLibrary = null;
    }
    if (this.albumModal) {
      this.albumModal.hide();
      this.albumModal = null;
    }
    this._isInitialized = false;
  }
}
