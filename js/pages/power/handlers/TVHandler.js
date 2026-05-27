export class TVHandler {
  constructor(tvService, tvStatusUI, eventEmitter = null) {
    this.tvService = tvService;
    this.tvStatusUI = tvStatusUI;
    this.events = eventEmitter;
  }

  async toggle() {
    const currentDot = document.querySelector("#tvStatus .status-dot");
    const isCurrentlyOn = currentDot?.classList.contains("on");
    this.tvStatusUI.setStatusText(
      isCurrentlyOn ? "Выключение..." : "Включение...",
    );
    try {
      await this.tvService.toggle();
      setTimeout(() => this.updateStatus(), 2000);
    } catch (error) {
      console.error("TV toggle error:", error);
      this.tvStatusUI.setStatusText("Ошибка");
      this.events?.emit("notification:show", {
        message: `Ошибка: ${error.message}`,
        type: "error",
      });
      throw error;
    }
  }

  async updateStatus() {
    try {
      const res = await this.tvService.getStatus();
      if (res.success && res.data) {
        this.tvStatusUI.update(res.data.screen_on);
      }
    } catch (error) {
      console.error("Update TV status error:", error);
      this.tvStatusUI.setError();
    }
  }
}
