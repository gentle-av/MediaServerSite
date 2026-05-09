export class PowerButton {
  constructor(api, device, onUpdate) {
    this.api = api;
    this.device = device;
    this.onUpdate = onUpdate;
    this.isOn = false;
  }

  render(container) {
    this.container = container;
    this.container.innerHTML = `
      <div class="sys-power-status">
        <span class="sys-status-dot" id="sysPowerDot"></span>
        <span class="sys-status-text" id="sysPowerText">—</span>
      </div>
      <button class="sys-power-btn" id="sysPowerBtn">
        <i class="fas fa-power-off"></i> <span>${this.device === "tv" ? "ТВ" : "Компьютер"}</span>
      </button>
    `;
    this.container
      .querySelector("#sysPowerBtn")
      ?.addEventListener("click", () => this.toggle());
    this._load();
  }

  async toggle() {
    if (this.device === "tv") {
      await this._tvPower();
    } else {
      await this._computerSleep();
    }
  }

  async _tvPower() {
    try {
      await this.api.post("/api/adb/connect", { address: "192.168.50.13" });
      await this.api.post("/api/adb/keyevent", { keycode: 26 });
      this.isOn = !this.isOn;
      this._updateUI();
      this.onUpdate?.({ device: this.device, isOn: this.isOn });
    } catch (error) {
      console.error("Failed to toggle TV:", error);
    }
  }

  async _computerSleep() {
    try {
      await this.api.post("/api/system/sleep");
      this.onUpdate?.({ device: this.device, action: "sleep" });
    } catch (error) {
      console.error("Failed to sleep computer:", error);
    }
  }

  async _load() {
    if (this.device === "tv") {
      try {
        const res = await this.api.get("/api/power/tv-state");
        if (res.success && res.data) {
          this.isOn = res.data.screen_on === true;
        }
      } catch (error) {
        this.isOn = false;
      }
    } else {
      this.isOn = true;
    }
    this._updateUI();
  }

  _updateUI() {
    const dot = this.container.querySelector("#sysPowerDot");
    const text = this.container.querySelector("#sysPowerText");
    const btn = this.container.querySelector("#sysPowerBtn");
    if (dot) dot.classList.toggle("on", this.isOn);
    if (text) text.textContent = this.isOn ? "Включен" : "Выключен";
    if (btn) btn.classList.toggle("active", this.isOn);
  }
}
