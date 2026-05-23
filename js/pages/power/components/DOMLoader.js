export class DOMLoader {
  constructor() {
    this._htmlLoaded = false;
  }

  async load(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return false;
    if (!this._htmlLoaded) {
      const response = await fetch("/pages/power.html");
      const html = await response.text();
      container.innerHTML = html;
      this._htmlLoaded = true;
    }
    return true;
  }
}
