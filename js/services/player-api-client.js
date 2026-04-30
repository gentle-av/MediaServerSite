class PlayerApiClient extends ApiClient {
  constructor() {
    super();
    this._available = false;
  }

  async checkAvailability() {
    try {
      const response = await fetch(`${this.baseUrl}/api/new/playbackState`);
      this._available = response.ok;
      return this._available;
    } catch {
      this._available = false;
      return false;
    }
  }

  async addToPlaylist(track) {
    return this.post("/api/new/add", { track });
  }

  get isAvailable() {
    return this._available;
  }

  async getPlaybackState() {
    const response = await this.get("/api/new/playbackState");
    if (response.success && response.data) {
      if (
        response.data.currentTrack &&
        typeof response.data.currentTrack === "string"
      ) {
        try {
          const decodedPath = decodeURIComponent(response.data.currentTrack);
          const fileName = decodedPath
            .split("/")
            .pop()
            .replace(/\.(flac|mp3|m4a|wav)$/i, "");
          response.data.currentTrackName = fileName;
        } catch (e) {
          response.data.currentTrackName = "";
        }
      }
    }
    return response;
  }

  async getPlaylist() {
    return this.get("/api/new/getPlaylist");
  }

  async getCurrentTime() {
    return this.get("/api/new/currentTime");
  }

  async play() {
    return this.post("/api/new/play");
  }

  async pause() {
    return this.post("/api/new/pause");
  }

  async stop() {
    return this.post("/api/new/stop");
  }

  async next() {
    return this.post("/api/new/next");
  }

  async previous() {
    return this.post("/api/new/previous");
  }

  async seek(position) {
    return this.post("/api/new/seek", { position });
  }

  async setPlaylist(tracks) {
    return this.post("/api/new/setPlaylist", { tracks });
  }

  async clearPlaylist() {
    return this.post("/api/new/clear");
  }

  async playIndex(index) {
    return this.post("/api/new/playIndex", { index });
  }
}
