import { PlaybackStrategy } from "./PlaybackStrategy.js";

export class AudioPlaybackStrategy extends PlaybackStrategy {
  constructor(api) {
    super();
    this.api = api;
    this.core = null;
    this.uiUpdater = null;
    this.progress = null;
  }

  setCore(core) {
    this.core = core;
  }
  setUIUpdater(uiUpdater) {
    this.uiUpdater = uiUpdater;
  }
  setProgress(progress) {
    this.progress = progress;
  }

  async start(path) {
    await this.api.closeVideo();
    const metadata = await this.api.getFileMetadata(path);
    this.uiUpdater.updateFullscreenButtonVisibility("audio");
    let artist = "",
      title = "",
      coverUrl = null;
    if (metadata?.data) {
      if (metadata.data.file) {
        artist = metadata.data.file.artist || "";
        title = metadata.data.file.title || "";
        coverUrl = metadata.data.file.cover || null;
      }
      if (!title && metadata.data.database) {
        title = metadata.data.database.title || "";
        artist = metadata.data.database.artist || "";
      }
      if (!coverUrl && title) {
        coverUrl = await this.api.getAlbumCover(path, title, artist);
      }
    }
    if (!title) {
      let fileName = path.split("/").pop();
      fileName = fileName.replace(/\.(flac|mp3|m4a|wav|ogg|aac)$/i, "");
      const match = fileName.match(/^\d+\s*[-.]?\s*(.+)$/);
      title = match ? match[1] : fileName;
    }
    this.uiUpdater.updateTrackFullInfo(title, artist, coverUrl);
    this.uiUpdater.updatePlayPauseButton(true);
    this.core.setPlaying(true);
    setTimeout(async () => {
      const timeInfo = await this.api.getAudioCurrentTime();
      if (timeInfo?.success) {
        this.progress.update(timeInfo.currentTime || 0, timeInfo.duration || 0);
      }
    }, 500);
    setTimeout(async () => {
      const timeInfo = await this.api.getAudioCurrentTime();
      if (timeInfo?.success) {
        this.progress.update(timeInfo.currentTime || 0, timeInfo.duration || 0);
      }
    }, 1500);
  }

  async stop() {
    await this.api.audioStop();
  }

  async togglePlayPause() {
    const state = await this.api.getAudioPlaybackState();
    if (state?.success && state.totalTracks > 0) {
      if (this.core.isPlaying) {
        await this.api.audioPause();
      } else {
        await this.api.audioPlay();
      }
      this.core.setPlaying(!this.core.isPlaying);
      this.uiUpdater.updatePlayPauseButton(this.core.isPlaying);
    } else {
      Utils.showNotification("Плейлист пуст", "info");
    }
  }

  async seek(time) {
    await this.api.audioSeek(time);
    this.progress.update(time, this.progress.duration);
  }

  async previous() {
    await this.api.audioPrevious();
  }

  async next() {
    await this.api.audioNext();
  }

  async getStatus() {
    return this.api.getAudioPlaybackState();
  }

  async getCurrentTime() {
    return this.api.getAudioCurrentTime();
  }

  updateUI() {
    this.uiUpdater.updateFullscreenButtonVisibility("audio");
  }
}
