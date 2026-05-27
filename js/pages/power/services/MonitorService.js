export class MonitorService {
  constructor(api, eventEmitter) {
    this.api = api;
    this.events = eventEmitter;
  }

  async isSessionIdle() {
    const response = await this.api.get("/api/monitor/is_idle");
    return response;
  }

  async turnOnMonitor() {
    const response = await this.api.post("/api/monitor/turn_on");
    if (response && response.success) {
      this.events?.emit("notification:show", {
        message: response.message || "Монитор включен",
        type: "success",
      });
    } else {
      throw new Error(response?.message || "Ошибка включения монитора");
    }
    return response;
  }

  async turnOffMonitor() {
    const response = await this.api.post("/api/monitor/turn_off");
    if (response && response.success) {
      this.events?.emit("notification:show", {
        message: response.message || "Монитор выключен",
        type: "success",
      });
    } else {
      throw new Error(response?.message || "Ошибка выключения монитора");
    }
    return response;
  }
}
