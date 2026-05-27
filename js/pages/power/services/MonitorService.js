export class MonitorService {
  constructor(api, eventEmitter) {
    this.api = api;
    this.events = eventEmitter;
  }

  async getStatus() {
    console.log("Calling /api/monitor/status");
    const response = await this.api.get("/api/monitor/status");
    console.log("Status response:", response);
    return response;
  }

  async turnOnMonitor() {
    console.log("Calling /api/monitor/turn_on");
    const response = await this.api.post("/api/monitor/turn_on");
    console.log("Turn on response:", response);
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
    console.log("Calling /api/monitor/turn_off");
    const response = await this.api.post("/api/monitor/turn_off");
    console.log("Turn off response:", response);
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
