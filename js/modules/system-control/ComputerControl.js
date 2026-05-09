export class ComputerControl {
  constructor(api, onUpdate) {
    this.api = api;
    this.onUpdate = onUpdate;
  }

  render(container) {
    this.container = container;
    this.container.innerHTML = `
      <div class="sys-computer-info">
        <i class="fas fa-desktop"></i>
        <span>Компьютер активен</span>
      </div>
      <button class="sys-sleep-btn" id="sysSleepBtn">
        <i class="fas fa-moon"></i> Сон
      </button>
    `;
    this.container
      .querySelector("#sysSleepBtn")
      ?.addEventListener("click", () => this.sleep());
  }

  async sleep() {
    await this.api.post("/api/system/sleep");
    this.onUpdate?.({ action: "sleep" });
  }
}
