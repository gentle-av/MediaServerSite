import { PowerManagementState } from "./PowerManagementState.js";
import { PowerManagementUI } from "./PowerManagementUI.js";
import { PowerManagementTV } from "./PowerManagementTV.js";

export class PowerManagement {
  constructor(apiClient, events, options = {}) {
    this.api = apiClient;
    this.events = events;
    this.state = new PowerManagementState(options);
    this.ui = new PowerManagementUI(options.container, this.state);
    this.tvHandler = new PowerManagementTV(apiClient, events, this.state);
    this.sleepBtn = null;
    this.isDestroyed = false;
    this.init();
  }

  init() {
    console.log("[PowerManagement] init started");
    this.render();
    this.bindEvents();
    this.tvHandler.setUI(this.ui);
    this.tvHandler.checkTVStatus();
    this.tvHandler.startPolling();
  }

  render() {
    console.log("[PowerManagement] render started");
    this.ui.render();
    this.sleepBtn = document.getElementById("sleepBtn");
    console.log("[PowerManagement] sleepBtn found:", !!this.sleepBtn);
  }

  bindEvents() {
    console.log("[PowerManagement] bindEvents started");
    const tvPowerBtn = this.ui.getTVPowerBtn();
    console.log("[PowerManagement] tvPowerBtn found:", !!tvPowerBtn);
    if (tvPowerBtn) {
      console.log("[PowerManagement] adding click listener to tvPowerBtn");
      tvPowerBtn.addEventListener("click", (e) => {
        console.log("[PowerManagement] TV button CLICKED", e);
        this.tvHandler.toggleTV();
      });
    }
    if (this.sleepBtn) {
      console.log("[PowerManagement] adding click listener to sleepBtn");
      this.sleepBtn.addEventListener("click", () => this.sleepComputer());
    }
  }

  async sleepComputer() {
    try {
      const confirmed = confirm("Отправить компьютер в режим сна?");
      if (!confirmed) return;
      this.ui.showNotification(
        "Компьютер уходит в сон...",
        "info",
        this.events,
      );
      const response = await this.api.post("/api/system/sleep");
      if (response.success) {
        this.ui.showNotification("Система засыпает", "success", this.events);
      } else {
        this.ui.showNotification("Ошибка отправки в сон", "error", this.events);
      }
    } catch (error) {
      this.ui.showNotification(
        "Ошибка соединения с сервером",
        "error",
        this.events,
      );
    }
  }

  destroy() {
    this.isDestroyed = true;
    this.tvHandler.destroy();
    this.state.reset();
  }
}
