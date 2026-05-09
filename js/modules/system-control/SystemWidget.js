import { PowerButton } from "./PowerButton.js";
import { VolumeControl } from "./VolumeControl.js";
import { ComputerControl } from "./ComputerControl.js";

export class SystemWidget {
  constructor(api, events, options = {}) {
    this.api = api;
    this.events = events;
    this.tvAddress = options.tvAddress || "192.168.50.13";
    this.container = null;
    this.modules = [];
    this.isVisible = false;
    this.tvAvailable = false;
  }

  async init() {
    await this._checkTvAvailability();
    const response = await fetch("/pages/system-control.html");
    const html = await response.text();
    this.container = document.createElement("div");
    this.container.innerHTML = html;
    this.container = this.container.firstElementChild;
    if (!this.tvAvailable) {
      const tvSection = this.container.querySelector(
        ".sys-section:nth-child(2)",
      );
      if (tvSection) tvSection.style.display = "none";
    }
    this._initModules();
    this._bindEvents();
    document.body.appendChild(this.container);
    this.hide();
    return this;
  }

  async _checkTvAvailability() {
    try {
      const res = await this.api.get("/api/power/tv-state");
      this.tvAvailable = res.success && res.data;
    } catch {
      this.tvAvailable = false;
    }
  }

  _initModules() {
    const volume = new VolumeControl(this.api, (v) => {
      this.events.emit("system:volume", v);
    });
    volume.render(this.container.querySelector("#sysVolume"));
    this.modules.push(volume);

    if (this.tvAvailable) {
      const tvPower = new PowerButton(this.api, "tv", (s) => {
        this.events.emit("system:tvPower", s);
      });
      tvPower.render(this.container.querySelector("#sysTvPower"));
      this.modules.push(tvPower);
    }

    const computer = new ComputerControl(this.api, (c) => {
      this.events.emit("system:computer", c);
    });
    computer.render(this.container.querySelector("#sysComputer"));
    this.modules.push(computer);
  }

  _bindEvents() {
    const closeBtn = this.container.querySelector(".sys-close");
    closeBtn?.addEventListener("click", () => this.hide());
    document.addEventListener("click", (e) => {
      if (this.isVisible && !this.container.contains(e.target)) {
        const trigger = e.target.closest('[data-action="show-system"]');
        if (!trigger) this.hide();
      }
    });
  }

  show() {
    if (this.container) {
      this.container.classList.add("visible");
      this.isVisible = true;
    }
  }

  hide() {
    if (this.container) {
      this.container.classList.remove("visible");
      this.isVisible = false;
    }
  }

  toggle() {
    this.isVisible ? this.hide() : this.show();
  }

  destroy() {
    this.modules.forEach((m) => m.destroy?.());
    this.container?.remove();
    this.container = null;
  }
}
