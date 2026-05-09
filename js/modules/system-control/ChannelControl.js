export class ChannelControl {
  constructor(api, onUpdate) {
    this.api = api;
    this.onUpdate = onUpdate;
    this.currentChannel = 1;
  }

  render(container) {
    this.container = container;
    this.container.innerHTML = `
      <div class="sys-channel-control">
        <div class="sys-channel-quick">
          <input type="number" id="sysChannelInput" placeholder="Номер канала" min="1">
          <button id="sysChannelGo"><i class="fas fa-arrow-right"></i> Перейти</button>
        </div>
        <div class="sys-channel-keypad">
          <button data-channel="1">1</button><button data-channel="2">2</button><button data-channel="3">3</button>
          <button data-channel="4">4</button><button data-channel="5">5</button><button data-channel="6">6</button>
          <button data-channel="7">7</button><button data-channel="8">8</button><button data-channel="9">9</button>
          <button data-channel="0">0</button>
          <button data-action="up"><i class="fas fa-chevron-up"></i></button>
          <button data-action="down"><i class="fas fa-chevron-down"></i></button>
        </div>
      </div>
    `;
    this._bindEvents();
  }

  _bindEvents() {
    this.container.querySelectorAll("[data-channel]").forEach((btn) => {
      btn.addEventListener("click", () =>
        this.set(parseInt(btn.dataset.channel)),
      );
    });
    this.container
      .querySelector('[data-action="up"]')
      ?.addEventListener("click", () => this.up());
    this.container
      .querySelector('[data-action="down"]')
      ?.addEventListener("click", () => this.down());
    this.container
      .querySelector("#sysChannelGo")
      ?.addEventListener("click", () => {
        const input = this.container.querySelector("#sysChannelInput");
        if (input.value) this.set(parseInt(input.value));
      });
    this.container
      .querySelector("#sysChannelInput")
      ?.addEventListener("keypress", (e) => {
        if (e.key === "Enter") this.set(parseInt(e.target.value));
      });
  }

  async set(channel) {
    this.currentChannel = channel;
    try {
      await this.api.post("/api/tv/channel", { channel });
    } catch (error) {
      console.warn("Failed to set channel:", error);
    }
    this.onUpdate?.({ channel });
  }

  async up() {
    try {
      const res = await this.api.post("/api/tv/channel/up");
      if (res && res.success && res.data) {
        this.currentChannel = res.data.channel;
      }
    } catch (error) {
      console.warn("Failed to channel up:", error);
    }
    this.onUpdate?.({ channel: this.currentChannel });
  }

  async down() {
    try {
      const res = await this.api.post("/api/tv/channel/down");
      if (res && res.success && res.data) {
        this.currentChannel = res.data.channel;
      }
    } catch (error) {
      console.warn("Failed to channel down:", error);
    }
    this.onUpdate?.({ channel: this.currentChannel });
  }
}
