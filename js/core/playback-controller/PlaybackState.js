export class PlaybackState {
  constructor() {
    this._currentAlbum = null;
    this._currentTrackIndex = -1;
    this._isPlaying = false;
    this._isSwitching = false;
    this._playlist = [];
    this._trackNameCache = new Map();
  }

  get currentAlbum() {
    return this._currentAlbum;
  }
  set currentAlbum(album) {
    this._currentAlbum = album;
  }
  get currentTrackIndex() {
    return this._currentTrackIndex;
  }
  set currentTrackIndex(index) {
    this._currentTrackIndex = index;
  }
  get isPlaying() {
    return this._isPlaying;
  }
  set isPlaying(playing) {
    this._isPlaying = playing;
  }
  get isSwitching() {
    return this._isSwitching;
  }
  set isSwitching(switching) {
    this._isSwitching = switching;
  }
  get playlist() {
    return this._playlist;
  }
  set playlist(playlist) {
    this._playlist = playlist;
  }
  get trackNameCache() {
    return this._trackNameCache;
  }

  getTrackNameByPath(path) {
    if (!path) return "";
    const cached = this._trackNameCache.get(path);
    if (cached) return cached;
    let filename = path.split("/").pop();
    filename = filename.replace(/\.(flac|mp3|m4a|wav)$/i, "");
    return filename;
  }

  fillTrackCache(album) {
    album.fillTrackCache(this._trackNameCache);
  }

  reset() {
    this._currentAlbum = null;
    this._currentTrackIndex = -1;
    this._isPlaying = false;
    this._isSwitching = false;
    this._playlist = [];
  }
}
