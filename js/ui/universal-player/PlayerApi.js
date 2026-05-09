export class PlayerAPI {
  constructor(apiClient, musicApi = null, playerApi = null) {
    this.api = apiClient;
    this.musicApi = musicApi;
    this.playerApi = playerApi;
  }

  async getVideoStatus() {
    return this.api.get("/api/video/status");
  }

  async controlVideo(command) {
    return this.api.post("/api/mpv/control", { command });
  }

  async seekVideo(time) {
    return this.api.post("/api/mpv/seek", { time });
  }

  async closeVideo() {
    return this.api.post("/api/video/close").catch(() => {});
  }

  async openFile(path) {
    return this.api.post("/api/open", { path });
  }

  async getAudioPlaybackState() {
    if (!this.playerApi) return null;
    const result = await this.playerApi.getPlaybackState();
    if (result?.success && result.data) {
      return {
        success: true,
        currentTrack: result.data.currentTrack,
        currentIndex: result.data.currentIndex,
        totalTracks: result.data.totalTracks,
        isPlaying: result.data.isPlaying,
        ...result.data,
      };
    }
    return result;
  }

  async getAudioCurrentTime() {
    if (!this.playerApi) return null;
    return this.playerApi.getCurrentTime();
  }

  async audioPlay() {
    if (!this.playerApi) return;
    return this.playerApi.play();
  }

  async audioPause() {
    if (!this.playerApi) return;
    return this.playerApi.pause();
  }

  async audioStop() {
    if (!this.playerApi) return;
    return this.playerApi.stop();
  }

  async audioNext() {
    if (!this.playerApi) return;
    return this.playerApi.next();
  }

  async audioPrevious() {
    if (!this.playerApi) return;
    return this.playerApi.previous();
  }

  async audioSeek(time) {
    if (!this.playerApi) return;
    return this.playerApi.seek(time);
  }

  async getFileMetadata(path) {
    if (!this.musicApi) {
      return null;
    }
    try {
      const result = await this.musicApi.getFileMetadata(path);
      return result;
    } catch (error) {
      console.error("[DEBUG] getFileMetadata error:", error);
      return null;
    }
  }

  async getVideoThumbnail(path) {
    const response = await fetch(
      `/api/thumbnail?path=${encodeURIComponent(path)}`,
    );
    const data = await response.json();
    return data.success && data.thumbnail ? data.thumbnail : null;
  }

  async getAlbumCover(filePath, title, artist) {
    let coverUrl = null;
    const encodedPath = encodeURIComponent(filePath);
    const directUrl = `/api/music/albumart?path=${encodedPath}`;
    const directResponse = await fetch(directUrl);
    if (directResponse.ok) {
      const blob = await directResponse.blob();
      coverUrl = URL.createObjectURL(blob);
      return coverUrl;
    }
    if (title && title !== "Unknown") {
      let url = `/api/music/albumart/album/${encodeURIComponent(title)}`;
      if (artist && artist !== "Unknown") {
        url += `?artist=${encodeURIComponent(artist)}`;
      }
      const response = await fetch(url);
      if (response.ok) {
        const blob = await response.blob();
        coverUrl = URL.createObjectURL(blob);
        return coverUrl;
      }
    }
    return null;
  }

  async getPlaylist() {
    return this.api.get("/api/audio/getPlaylist");
  }
}
