import { TrackMetadataHelper } from "./TrackMetadataHelper.js";
import { PlaylistPopupUI } from "./PlaylistPopupUI.js";
import { PlaylistRenderer } from "./PlaylistRenderer.js";

export class PlaylistPopup {
  constructor(playbackController, events, albumLibrary) {
    this.playback = playbackController;
    this.events = events;
    this.musicApi = window.musicApi || null;
    this.metadataHelper = new TrackMetadataHelper(albumLibrary, this.musicApi);
    this.ui = new PlaylistPopupUI(
      "headerPlaylistBtn",
      "playlistPopup",
      "playlistPopupClose",
    );
    this.renderer = null;
    this._init();
  }

  async _init() {
    const onTrackClick = async (index) => {
      const playlistData = await this.playback.api.getPlaylist();
      const tracks = playlistData?.data || [];
      const trackPath = tracks[index];
      const path = typeof trackPath === "string" ? trackPath : trackPath?.path;
      if (path) {
        await this.playback.api.playIndex(index);
        if (window.universalPlayerInstance) {
          const metadata = await this.metadataHelper.fetchMetadata(path);
          window.universalPlayerInstance.core.setCurrentFile(path);
          window.universalPlayerInstance.core.setMediaType("audio");
          window.universalPlayerInstance.core.setPlaying(true);
          window.universalPlayerInstance.uiUpdater.updateFileInfo(path);
          window.universalPlayerInstance.uiUpdater.updateTrackFullInfo(
            metadata.title,
            metadata.artist,
            null,
          );
          window.universalPlayerInstance.uiUpdater.updatePlayPauseButton(true);
          window.universalPlayerInstance.show();
          if (window.universalPlayerInstance.polling) {
            window.universalPlayerInstance.polling.stop();
            window.universalPlayerInstance.polling.start();
          }
        }
        this.events.emit("playback:audioStart", path);
        this.events.emit("playlistTrackPlayed", { index, path });
        this.ui.hide();
      }
    };
    this.renderer = new PlaylistRenderer(
      "playlistContainer",
      onTrackClick,
      async (index) => {
        await this.playback.api.post("/api/removeFromPlaylist", { index });
        this.metadataHelper.clearCache();
        await this.refresh();
        this.events.emit("playlistChanged");
      },
    );
    this.ui.onOpen = () => this.refresh();
    this.ui.onClose = () => this.events.emit("playlistHidden");
    this._attachClearButton();
    this._attachEvents();
    await this.refresh();
    setInterval(() => this.refresh(), 5000);
  }

  _attachClearButton() {
    const clearBtn = document.getElementById("playlistClearBtn");
    if (clearBtn) {
      clearBtn.addEventListener("click", async () => {
        await this.playback.api.clearPlaylist();
        this.metadataHelper.clearCache();
        await this.refresh();
        this.events.emit("playlistCleared");
        this.ui.hide();
      });
    }
  }

  _attachEvents() {
    this.events.on("playlistChanged", () => this.refresh());
    this.events.on("playlistCleared", () => this.refresh());
  }

  async refresh() {
    const playlistData = await this.playback.api.getPlaylist();
    const state = await this.playback.api.getPlaybackState();
    const currentPath = state?.data?.currentTrack;
    const currentIndex = state?.data?.currentIndex ?? -1;
    let tracks = playlistData?.data || [];
    if (!Array.isArray(tracks)) tracks = [];
    const tracksWithMetadata = await Promise.all(
      tracks.map(async (track, idx) => {
        const path = typeof track === "string" ? track : track.path;
        const metadata = await this.metadataHelper.fetchMetadata(path);
        return { path, ...metadata, index: idx };
      }),
    );
    this.renderer.render(tracksWithMetadata, currentPath, currentIndex);
    this._updateCount(tracksWithMetadata.length);
    setTimeout(() => this.renderer.scrollToCurrentTrack(), 100);
  }

  _updateCount(count) {
    const countElement = document.getElementById("playlistTrackCount");
    if (countElement) {
      countElement.textContent = `${count} ${this._getTracksWord(count)}`;
    }
  }

  _getTracksWord(count) {
    if (count % 10 === 1 && count % 100 !== 11) return "трек";
    if (
      count % 10 >= 2 &&
      count % 10 <= 4 &&
      (count % 100 < 10 || count % 100 >= 20)
    )
      return "трека";
    return "треков";
  }
}
