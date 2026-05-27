export class MonitorHandler {
  constructor(monitorService, monitorUI, eventEmitter) {
    this.monitorService = monitorService;
    this.monitorUI = monitorUI;
    this.events = eventEmitter;
    this._isIdle = false;
    this._isOn = true;
    this._pollingInterval = null;
  }

  async load() {
    await this.updateStatus();
  }

  async updateStatus() {
    try {
      const res = await this.monitorService.getStatus();
      if (res.success && res.data) {
        this._isIdle = res.data.is_idle || false;
        this.monitorUI?.update(this._isIdle, this._isOn);
        console.log(`Monitor idle: ${this._isIdle}, on: ${this._isOn}`);
      }
    } catch (error) {
      console.error("Update monitor status error:", error);
      this.monitorUI?.setError();
    }
  }

  async toggle() {
    console.log("Monitor toggle called");
    if (this._isOn) {
      await this.turnOff();
    } else {
      await this.turnOn();
    }
  }

  async turnOn() {
    console.log("Turning monitor on");
    try {
      const response = await this.monitorService.turnOnMonitor();
      if (response && response.success) {
        this._isOn = true;
        // Сразу обновляем UI, не дожидаясь поллинга
        this.monitorUI?.update(this._isIdle, true);
        this.events?.emit("notification:show", {
          message: "Монитор включен",
          type: "success",
        });
      }
      return response;
    } catch (error) {
      console.error("Turn on monitor error:", error);
      this.monitorUI?.setError();
      throw error;
    }
  }

  async turnOff() {
    console.log("Turning monitor off");
    try {
      const response = await this.monitorService.turnOffMonitor();
      if (response && response.success) {
        this._isOn = false;
        // Сразу обновляем UI, не дожидаясь поллинга
        this.monitorUI?.update(this._isIdle, false);
        this.events?.emit("notification:show", {
          message: "Монитор выключен",
          type: "success",
        });
      }
      return response;
    } catch (error) {
      console.error("Turn off monitor error:", error);
      this.monitorUI?.setError();
      throw error;
    }
  }

  startPolling(intervalMs = 5000) {
    if (this._pollingInterval) {
      clearInterval(this._pollingInterval);
    }
    this._pollingInterval = setInterval(() => {
      this.updateStatus();
    }, intervalMs);
  }

  stopPolling() {
    if (this._pollingInterval) {
      clearInterval(this._pollingInterval);
      this._pollingInterval = null;
    }
  }

  get isIdle() {
    return this._isIdle;
  }

  get isOn() {
    return this._isOn;
  }
}
