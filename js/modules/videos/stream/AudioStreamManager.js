import { AudioStream } from "./AudioStream.js";
import { ApiClient } from "../../../core/api/ApiClient.js";

export class AudioStreamManager {
  constructor(apiClient = null) {
    this.api = apiClient || new ApiClient();
    this.cache = new Map();
    this.currentPath = null;
    this.selectedIdx = null;
    this.listeners = [];
  }

  setApi(api) {
    this.api = api;
  }

  async getStreams(videoPath) {
    if (this.cache.has(videoPath)) return this.cache.get(videoPath);
    if (!this.api) return [];
    try {
      const [selectedRes, tracksRes] = await Promise.all([
        this.api.get("/api/mpv/property/aid"),
        this.api.get(`/api/mkv/tracks?path=${encodeURIComponent(videoPath)}`),
      ]);
      let selectedIdx = -1;
      if (
        selectedRes.success &&
        selectedRes.value !== undefined &&
        selectedRes.value !== null &&
        selectedRes.value !== ""
      ) {
        selectedIdx = parseInt(selectedRes.value) || -1;
      }
      if (!tracksRes.success || !tracksRes.tracks) return [];
      const streams = tracksRes.tracks.map(
        (t) =>
          new AudioStream({
            stream_index: t.stream_index,
            codec_name: t.codec_name,
            language: t.language,
            title: t.title,
            channels: t.channels,
            is_default: t.is_default,
            is_forced: t.is_forced,
            is_selected: t.stream_index === selectedIdx,
          }),
      );
      this.selectedIdx = selectedIdx;
      this.cache.set(videoPath, streams);
      this.currentPath = videoPath;
      this._notify("loaded", { videoPath, streams, selectedIdx });
      return streams;
    } catch (error) {
      console.error("Error fetching audio streams:", error);
      return [];
    }
  }

  async refreshSelected(videoPath = this.currentPath) {
    if (!videoPath) return null;
    try {
      const selectedRes = await this.api.get("/api/mpv/property/aid");
      if (!selectedRes.success) return this.getSelected();
      let newSelectedIdx = -1;
      if (
        selectedRes.value !== undefined &&
        selectedRes.value !== null &&
        selectedRes.value !== ""
      ) {
        newSelectedIdx = parseInt(selectedRes.value) || -1;
      }
      if (newSelectedIdx !== this.selectedIdx) {
        this.selectedIdx = newSelectedIdx;
        const streams = this.cache.get(videoPath);
        if (streams) {
          streams.forEach(
            (s) => (s.isSelected = s.streamIndex === newSelectedIdx),
          );
          this._notify("selected", { videoPath, streamIdx: newSelectedIdx });
        }
      }
      return this.getSelected();
    } catch (error) {
      console.error("Error refreshing selected track:", error);
      return null;
    }
  }

  getCurrentStreams() {
    return this.currentPath ? this.cache.get(this.currentPath) || [] : [];
  }

  getSelected() {
    const streams = this.getCurrentStreams();
    return (
      streams.find((s) => s.streamIndex === this.selectedIdx) ||
      streams[0] ||
      null
    );
  }

  async selectTrack(streamIdx, videoPath = this.currentPath) {
    if (!videoPath || !this.api) return false;
    try {
      const res = await this.api.post("/api/video/audio/track", {
        stream_index: streamIdx,
      });
      if (!res.success) return false;
      this.selectedIdx = streamIdx;
      const streams = this.cache.get(videoPath);
      if (streams)
        streams.forEach((s) => (s.isSelected = s.streamIndex === streamIdx));
      this._notify("selected", { videoPath, streamIdx });
      return true;
    } catch (error) {
      console.error("Error selecting audio track:", error);
      return false;
    }
  }

  refresh(videoPath) {
    this.cache.delete(videoPath);
    return this.getStreams(videoPath);
  }

  clear(videoPath = null) {
    if (videoPath) this.cache.delete(videoPath);
    else {
      this.cache.clear();
      this.currentPath = null;
      this.selectedIdx = null;
    }
  }

  getByIndex(idx, videoPath = this.currentPath) {
    return (
      this.cache.get(videoPath)?.find((s) => s.streamIndex === idx) || null
    );
  }

  getLanguages(videoPath = this.currentPath) {
    return [
      ...new Set(
        (this.cache.get(videoPath) || [])
          .filter((s) => s.language && s.language !== "und")
          .map((s) => s.language),
      ),
    ];
  }

  _notify(event, data) {
    this.listeners.forEach((fn) => fn(event, data));
  }

  addListener(fn) {
    this.listeners.push(fn);
  }

  removeListener(fn) {
    this.listeners = this.listeners.filter((l) => l !== fn);
  }
}
