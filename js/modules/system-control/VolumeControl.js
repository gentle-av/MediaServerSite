export class VolumeControl {
  constructor(api, onUpdate) {
    this.api = api;
    this.onUpdate = onUpdate;
    this.volume = 50;
    this.isMuted = false;
  }

  render(container) {
    this.container = container;
    this.container.innerHTML = `
      <div class="sys-volume-controls">
        <button class="sys-volume-down" data-action="vol-down">
          <i class="fas fa-minus"></i>
        </button>
        <div class="sys-volume-slider">
          <div class="sys-volume-fill" id="sysVolumeFill"></div>
          <input type="range" id="sysVolumeRange" min="0" max="100" value="50">
        </div>
        <button class="sys-volume-up" data-action="vol-up">
          <i class="fas fa-plus"></i>
        </button>
        <button class="sys-volume-mute" data-action="vol-mute">
          <i class="fas fa-volume-up"></i>
        </button>
        <span class="sys-volume-value" id="sysVolumeValue">50%</span>
      </div>
    `;
    this._bindEvents();
    this._load();
  }

  _bindEvents() {
    this.container
      .querySelector('[data-action="vol-down"]')
      ?.addEventListener("click", () => this.change(-10));
    this.container
      .querySelector('[data-action="vol-up"]')
      ?.addEventListener("click", () => this.change(10));
    this.container
      .querySelector('[data-action="vol-mute"]')
      ?.addEventListener("click", () => this.toggleMute());
    this.container
      .querySelector("#sysVolumeRange")
      ?.addEventListener("input", (e) => this.set(parseInt(e.target.value)));
  }

  async change(delta) {
    const newVol = Math.min(100, Math.max(0, this.volume + delta));
    await this.set(newVol);
  }

  async set(volume) {
    this.volume = volume;
    await this.api.post("/api/audio/volume", { volume });
    this._updateUI();
    this.onUpdate?.({ volume, muted: this.isMuted });
  }

  async toggleMute() {
    this.isMuted = !this.isMuted;
    await this.api.post("/api/audio/mute");
    this._updateUI();
    this.onUpdate?.({ volume: this.volume, muted: this.isMuted });
  }

  async _load() {
    try {
      const res = await this.api.get("/api/audio/volume");
      if (res.success && res.data) {
        this.volume = res.data.volume || 50;
        this._updateUI();
      }
    } catch (error) {
      console.warn("Failed to load volume:", error);
    }
  }

  _updateUI() {
    const fill = this.container.querySelector("#sysVolumeFill");
    const range = this.container.querySelector("#sysVolumeRange");
    const value = this.container.querySelector("#sysVolumeValue");
    const muteBtn = this.container.querySelector('[data-action="vol-mute"] i');
    if (fill) fill.style.width = `${this.volume}%`;
    if (range) range.value = this.volume;
    if (value) value.textContent = `${this.volume}%`;
    if (muteBtn) {
      if (this.isMuted || this.volume === 0) {
        muteBtn.className = "fas fa-volume-mute";
      } else if (this.volume < 30) {
        muteBtn.className = "fas fa-volume-off";
      } else if (this.volume < 70) {
        muteBtn.className = "fas fa-volume-down";
      } else {
        muteBtn.className = "fas fa-volume-up";
      }
    }
  }
}
