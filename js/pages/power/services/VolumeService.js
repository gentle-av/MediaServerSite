export class VolumeService {
  constructor(api) {
    this.api = api;
  }

  async setVolume(volume) {
    await this.api.post("/api/audio/volume", { volume });
  }

  async toggleMute() {
    await this.api.post("/api/audio/mute");
    const response = await this.api.get("/api/audio/volume");
    return response;
  }

  async getVolume() {
    const response = await this.api.get("/api/audio/volume");
    return response;
  }
}
