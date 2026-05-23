export class AudioOutputService {
  constructor(api) {
    this.api = api;
  }

  async switchToSpeakers() {
    const response = await this.api.post("/api/audio/output/speakers");
    return response;
  }

  async switchToHeadphones() {
    const response = await this.api.post("/api/audio/output/headphones");
    return response;
  }

  async getCurrentOutput() {
    const response = await this.api.get("/api/audio/output");
    return response;
  }
}
