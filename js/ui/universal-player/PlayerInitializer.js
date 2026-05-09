export class PlayerInitializer {
  constructor(api, events, musicApi, playerApi, apiClient, tvApi) {
    this.api = api;
    this.events = events;
    this.musicApi = musicApi;
    this.playerApi = playerApi;
    this.apiClient = apiClient;
    this.tvApi = tvApi;
    this.dom = null;
    this.core = null;
    this.progress = null;
    this.uiUpdater = null;
    this.polling = null;
    this.volume = null;
    this.output = null;
    this.channelManager = null;
    this.mediaHandler = null;
    this.eventSubscriber = null;
    this.previewTooltip = null;
    this.videoCloseModal = null;
    this.isVisible = false;
  }

  async initialize() {
    this.dom = new PlayerDOM();
    const domReady = this.dom.init();
    if (!domReady) {
      setTimeout(() => this.initialize(), 100);
      return;
    }
    this.core = new PlayerCore();
    this.progress = new PlayerProgress(this.dom);
    this.uiUpdater = new PlayerUIUpdater(this.dom, this.progress);
    this.polling = new PlayerPolling(
      this.api,
      this.core,
      this.progress,
      this.uiUpdater,
      (state) => this.events.emit("playbackStateChange", state),
    );
    this.volume = new PlayerVolume(this.apiClient, this.dom, this.core);
    this.output = new PlayerOutput(this.apiClient, this.dom, this.core);
    this.channelManager = new PlayerChannelManager(
      this.apiClient,
      this.events,
      this.dom,
    );
    await this.channelManager.init(this.tvApi);
    this.mediaHandler = new PlayerMediaHandler(
      this.api,
      this.core,
      this.uiUpdater,
      this.progress,
      () => this.show(),
      () => this.hide(),
    );
    return this;
  }

  setVideoCloseModal(modal) {
    this.videoCloseModal = modal;
    if (this.mediaHandler) {
      this.mediaHandler.setVideoCloseModal(modal);
    }
  }

  show() {
    if (this.dom) {
      this.dom.show();
      this.isVisible = true;
    }
  }

  hide() {
    if (this.dom) {
      this.dom.hide();
      this.isVisible = false;
    }
  }

  destroy() {
    if (this.polling) this.polling.stop();
    if (this.volume) this.volume.stopPolling();
    if (this.output) this.output.stopPolling();
    if (this.eventSubscriber) this.eventSubscriber?.unsubscribe();
    if (this.previewTooltip) this.previewTooltip.destroy();
    if (this.core) this.core.destroy();
  }
}
