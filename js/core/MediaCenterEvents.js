export class MediaCenterEvents {
  constructor(events) {
    this.events = events;
    this._handlers = new Map();
  }

  setupCoreEvents(handlers) {
    this._registerHandler("page:videoLoaded", handlers.onVideoPageLoaded);
    this._registerHandler("page:audioLoaded", handlers.onAudioPageLoaded);
    this._registerHandler("page:powerLoaded", handlers.onPowerPageLoaded);
    this._registerHandler("player:show", handlers.onPlayerShow);
    this._registerHandler("player:clearState", handlers.onPlayerClearState);
    this._registerHandler("video:refresh", handlers.onVideoRefresh);
  }

  setupAlbumEvents(handlers) {
    this._registerHandler("album:play", handlers.onAlbumPlay);
    this._registerHandler("album:addToPlaylist", handlers.onAlbumAddToPlaylist);
    this._registerHandler("album:open", handlers.onAlbumOpen);
    this._registerHandler("album:playMusium", handlers.onAlbumPlayMusium);
    this._registerHandler(
      "album:replacePlaylist",
      handlers.onAlbumReplacePlaylist,
    );
    this._registerHandler("album:playTrack", handlers.onAlbumPlayTrack);
  }

  _registerHandler(event, handler) {
    if (handler) {
      this.events.on(event, handler);
      this._handlers.set(event, handler);
    }
  }

  emit(event, data) {
    this.events.emit(event, data);
  }

  destroy() {
    for (const [event, handler] of this._handlers) {
      this.events.off(event, handler);
    }
    this._handlers.clear();
  }
}
