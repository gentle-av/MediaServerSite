import { ConfirmDialog } from "../../../ui/components/ConfirmDialog.js";

export class ComputerSleepHandler {
  constructor(computerService, eventEmitter) {
    this.computerService = computerService;
    this.events = eventEmitter;
    this.confirmDialog = new ConfirmDialog();
  }
  async sleep() {
    const confirmed = await this.confirmDialog.confirm(
      "Режим сна",
      "Отправить компьютер в режим сна?",
    );
    if (!confirmed) return null;
    this.events?.emit("notification:show", {
      message: "Компьютер уходит в сон...",
      type: "info",
    });
    try {
      const response = await this.computerService.sleep();
      if (response && response.success) {
        this.events?.emit("notification:show", {
          message: response.message || "Система засыпает",
          type: "success",
        });
      } else {
        throw new Error(response?.message || "Ошибка");
      }
      return response;
    } catch (error) {
      console.error("Sleep error:", error);
      this.events?.emit("notification:show", {
        message: `Ошибка: ${error.message}`,
        type: "error",
      });
      throw error;
    }
  }
}
