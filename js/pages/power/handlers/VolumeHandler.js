export class VolumeHandler {
  constructor(volumeService, volumeUI) {
    this.volumeService = volumeService;
    this.volumeUI = volumeUI;
    this._currentVolume = 50;
    this._isMuted = false;
  }

  async load() {
    try {
      const res = await this.volumeService.getVolume();
      if (res.success && res.data) {
        if (res.data.volume !== undefined)
          this._currentVolume = res.data.volume;
        if (res.data.muted !== undefined) this._isMuted = res.data.muted;
        this.volumeUI.update(this._currentVolume, this._isMuted);
      }
    } catch (error) {
      console.error("Load volume error:", error);
    }
  }

  async changeVolume(delta) {
    const newVol = Math.min(100, Math.max(0, this._currentVolume + delta));
    await this.setVolume(newVol);
  }

  async setVolume(volume) {
    if (this._currentVolume === volume && !this._isMuted) return;
    this._currentVolume = volume;
    if (this._isMuted && volume > 0) {
      this._isMuted = false;
    }
    this.volumeUI.update(this._currentVolume, this._isMuted);
    try {
      await this.volumeService.setVolume(this._currentVolume);
    } catch (error) {
      console.error("Set volume error:", error);
    }
  }

  async toggleMute() {
    try {
      const res = await this.volumeService.toggleMute();
      if (res.success && res.data) {
        if (res.data.muted !== undefined) this._isMuted = res.data.muted;
        if (res.data.volume !== undefined)
          this._currentVolume = res.data.volume;
        this.volumeUI.update(this._currentVolume, this._isMuted);
      }
    } catch (error) {
      console.error("Toggle mute error:", error);
      this._isMuted = !this._isMuted;
      this.volumeUI.update(this._currentVolume, this._isMuted);
    }
  }
}
