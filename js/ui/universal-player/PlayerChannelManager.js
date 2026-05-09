export class PlayerChannelManager {
  constructor(apiClient, events, dom) {
    this.apiClient = apiClient;
    this.events = events;
    this.dom = dom;
    this.channelControl = null;
  }

  async init(tvApi) {
    if (!tvApi) return;
    const module = await import("../modules/system-control/ChannelControl.js");
    this.channelControl = new module.ChannelControl(tvApi, (data) => {
      this.events.emit("channel:changed", data);
    });
    this.dom.setChannelControl(this.channelControl);
    this.dom.renderChannelControl();
  }

  getChannelControl() {
    return this.channelControl;
  }

  updateChannelDisplay(channel) {
    const channelDisplay = document.getElementById(
      "universalBottomChannelDisplay",
    );
    if (channelDisplay) {
      channelDisplay.textContent = `Канал ${channel}`;
    }
  }
}
