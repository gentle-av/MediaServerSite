export class TVService {
  constructor(api, eventEmitter) {
    this.api = api;
    this.events = eventEmitter;
  }

  async toggle() {
    const response = await this.api.post("/api/power/tv-on");
    if (response && response.success) {
      this.events?.emit("notification:show", {
        message: response.message || "Команда отправлена",
        type: "success",
      });
    } else {
      throw new Error(response?.message || "Ошибка");
    }
    return response;
  }

  async getStatus() {
    const response = await this.api.get("/api/power/tv-state");
    return response;
  }
}
