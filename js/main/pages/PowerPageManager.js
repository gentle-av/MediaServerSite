import { initPowerManagement } from "../../modules/power-management/index.js";

export class PowerPageManager {
  constructor(core) {
    this.core = core;
    this.powerManagement = null;
    this._isInitialized = false;
  }

  onPageLoaded() {
    this._updateUI();
    if (!this.powerManagement) {
      this.powerManagement = initPowerManagement(
        this.core.api,
        this.core.events,
        { tvAddress: "192.168.50.13" },
      );
      this.core.powerManagement = this.powerManagement;
    }
    this._isInitialized = true;
  }

  _updateUI() {
    if (this.core._updateUIForPage) {
      this.core._updateUIForPage("power");
    }
  }

  destroy() {
    if (this.powerManagement?.destroy) {
      this.powerManagement.destroy();
    }
    this.powerManagement = null;
    this._isInitialized = false;
  }
}
