export class PowerManagementAPI {
  constructor(apiClient, events) {
    this.api = apiClient;
    this.events = events;
  }

  async getTVState() {
    console.log("[API] getTVState called");
    try {
      console.log("[API] calling /api/power/tv-state");
      const response = await this.api.get("/api/power/tv-state");
      console.log("[API] response received:", response);
      if (response.success && response.data) {
        console.log("[API] TV state - screen_on:", response.data.screen_on);
        return { success: true, isOn: response.data.screen_on };
      }
      console.log("[API] response.success false or no data");
      return { success: false, isOn: null };
    } catch (error) {
      console.error("[API] Failed to check TV status:", error);
      return { success: false, error: error.message };
    }
  }

  async connectToTV(address) {
    console.log("[API] connectToTV called with address:", address);
    try {
      console.log("[API] killing existing ADB server");
      await this.api.post("/api/adb/kill-server");
      console.log("[API] starting ADB server");
      await this.api.post("/api/adb/start-server");
      console.log("[API] connecting to TV at:", address);
      await this.api.post("/api/adb/connect", { address });
      console.log("[API] connection successful");
      return { success: true };
    } catch (error) {
      console.error("[API] Failed to connect to TV:", error);
      return { success: false, error: error.message };
    }
  }

  async sendKeyEvent(keycode) {
    console.log("[API] sendKeyEvent called with keycode:", keycode);
    try {
      console.log("[API] sending keyevent:", keycode);
      const response = await this.api.post("/api/adb/keyevent", { keycode });
      console.log("[API] keyevent response:", response);
      return { success: response.success };
    } catch (error) {
      console.error("[API] Failed to send key event:", error);
      return { success: false, error: error.message };
    }
  }

  async sleepComputer() {
    try {
      const response = await this.api.post("/api/system/sleep");
      return { success: response.success };
    } catch (error) {
      console.error("Failed to sleep computer:", error);
      return { success: false, error: error.message };
    }
  }
}
