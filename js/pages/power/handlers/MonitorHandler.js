export class MonitorHandler {
  constructor(monitorService, monitorUI, eventEmitter) {
    this.monitorService = monitorService;
    this.monitorUI = monitorUI;
    this.events = eventEmitter;
    this._isMonitorOn = true;
  }

  async load() {
    try {
      this._isMonitorOn = true;
      this.monitorUI?.update(this._isMonitorOn);
    } catch (error) {
      console.error("Load monitor error:", error);
      this.monitorUI?.setError();
    }
  }

  async turnOn() {
    try {
      const response = await this.monitorService.turnOnMonitor();
      if (response && response.success) {
        this._isMonitorOn = true;
        this.monitorUI?.update(true);
        this.events?.emit("notification:show", {
          message: response.message || "Монитор включен",
          type: "success",
        });
      }
      return response;
    } catch (error) {
      console.error("Turn on monitor error:", error);
      this.monitorUI?.setError();
      this.events?.emit("notification:show", {
        message: `Ошибка включения монитора: ${error.message}`,
        type: "error",
      });
      throw error;
    }
  }

  async turnOff() {
    try {
      const response = await this.monitorService.turnOffMonitor();
      if (response && response.success) {
        this._isMonitorOn = false;
        this.monitorUI?.update(false);
        this.events?.emit("notification:show", {
          message: response.message || "Монитор выключен",
          type: "success",
        });
      }
      return response;
    } catch (error) {
      console.error("Turn off monitor error:", error);
      this.monitorUI?.setError();
      this.events?.emit("notification:show", {
        message: `Ошибка выключения монитора: ${error.message}`,
        type: "error",
      });
      throw error;
    }
  }

  async checkIdleAndTurnOff() {
    try {
      const res = await this.monitorService.isSessionIdle();
      if (res.success && res.isIdle && this._isMonitorOn) {
        await this.turnOff();
        this.events?.emit("notification:show", {
          message: "Монитор выключен из-за бездействия",
          type: "info",
        });
      }
      return res;
    } catch (error) {
      console.error("Check idle error:", error);
      return null;
    }
  }

  get isMonitorOn() {
    return this._isMonitorOn;
  }
}
