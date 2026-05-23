import { DOMLoader } from "./power/components/DOMLoader.js";
import { TVStatusUI } from "./power/components/TVStatusUI.js";
import { VolumeUI } from "./power/components/VolumeUI.js";
import { AudioOutputUI } from "./power/components/AudioOutputUI.js";
import { TVService } from "./power/services/TVService.js";
import { ComputerService } from "./power/services/ComputerService.js";
import { VolumeService } from "./power/services/VolumeService.js";
import { AudioOutputService } from "./power/services/AudioOutputService.js";
import { TVHandler } from "./power/handlers/TVHandler.js";
import { ComputerHandler } from "./power/handlers/ComputerHandler.js";
import { VolumeHandler } from "./power/handlers/VolumeHandler.js";
import { AudioOutputHandler } from "./power/handlers/AudioOutputHandler.js";

export class PowerPageManager {
  constructor(core) {
    this.core = core;
    this._isInitialized = false;
    this._tvStatusInterval = null;
    this._reconnectAttempts = 0;
    this.domLoader = new DOMLoader();
    this.tvStatusUI = new TVStatusUI();
    this.volumeUI = new VolumeUI();
    this.audioOutputUI = new AudioOutputUI();
    this.tvService = new TVService(core.api, core.events);
    this.computerService = new ComputerService(core.api);
    this.volumeService = new VolumeService(core.api);
    this.audioOutputService = new AudioOutputService(core.api);
    this.tvHandler = new TVHandler(
      this.tvService,
      this.tvStatusUI,
      core.events,
    );
    this.computerHandler = new ComputerHandler(
      this.computerService,
      core.events,
    );
    this.volumeHandler = new VolumeHandler(this.volumeService, this.volumeUI);
    this.audioOutputHandler = new AudioOutputHandler(
      this.audioOutputService,
      this.audioOutputUI,
    );
  }

  async onPageLoaded() {
    await this.domLoader.load("powerPageContainer");
    await this._loadInitialData();
    this._bindAllEvents();
    this._startTVStatusPolling();
    this._isInitialized = true;
  }

  async _loadInitialData() {
    await Promise.all([
      this.volumeHandler.load(),
      this.tvHandler.updateStatus(),
      this.audioOutputHandler.load(),
    ]);
    this._updateUI();
  }

  _bindAllEvents() {
    this._bindPowerEvents();
    this._bindVolumeEvents();
    this._bindAudioOutputEvents();
  }

  _startTVStatusPolling() {
    if (this._tvStatusInterval) {
      clearInterval(this._tvStatusInterval);
    }
    this._tvStatusInterval = setInterval(() => {
      this.tvHandler.updateStatus();
    }, 10000);
  }

  _bindPowerEvents() {
    const tvCard = document.getElementById("tvCard");
    if (tvCard) {
      tvCard.addEventListener("click", async () => {
        await this.tvHandler.toggle();
      });
    }
    const computerCard = document.getElementById("computerCard");
    if (computerCard) {
      computerCard.addEventListener("click", async () => {
        await this.computerHandler.sleep();
      });
    }
  }

  _bindVolumeEvents() {
    const volumeDown = document.getElementById("systemVolumeDown");
    const volumeUp = document.getElementById("systemVolumeUp");
    const volumeMute = document.getElementById("systemVolumeMute");
    const volumeRange = document.getElementById("systemVolumeRange");
    if (volumeDown) {
      volumeDown.addEventListener("click", () =>
        this.volumeHandler.changeVolume(-5),
      );
    }
    if (volumeUp) {
      volumeUp.addEventListener("click", () =>
        this.volumeHandler.changeVolume(5),
      );
    }
    if (volumeMute) {
      volumeMute.addEventListener("click", () =>
        this.volumeHandler.toggleMute(),
      );
    }
    if (volumeRange) {
      volumeRange.addEventListener("input", (e) => {
        this.volumeHandler.setVolume(parseInt(e.target.value));
      });
    }
  }

  _bindAudioOutputEvents() {
    const speakersBtn = document.getElementById("audioSpeakersBtn");
    const headphonesBtn = document.getElementById("audioHeadphonesBtn");
    if (speakersBtn) {
      speakersBtn.addEventListener("click", async () => {
        speakersBtn.disabled = true;
        await this.audioOutputHandler.switchToSpeakers();
        speakersBtn.disabled = false;
      });
    }
    if (headphonesBtn) {
      headphonesBtn.addEventListener("click", async () => {
        headphonesBtn.disabled = true;
        await this.audioOutputHandler.switchToHeadphones();
        headphonesBtn.disabled = false;
      });
    }
  }

  async reconnect() {
    console.log("Восстановление соединения после сна...");
    this._reconnectAttempts = 0;
    await this._tryReconnect();
  }

  async _tryReconnect() {
    this._reconnectAttempts++;
    try {
      await this.core.api.get("/api/ping");
      console.log("Соединение восстановлено");
      await this._loadInitialData();
      if (this._reconnectAttempts > 1) {
        this.core.events?.emit("notification:show", {
          message: "Соединение восстановлено",
          type: "success",
        });
      }
    } catch (error) {
      console.log(`Попытка переподключения ${this._reconnectAttempts}...`);
      if (this._reconnectAttempts < 10) {
        setTimeout(() => this._tryReconnect(), 3000);
      }
    }
  }

  _updateUI() {
    if (this.core._updateUIForPage) {
      this.core._updateUIForPage("power");
    }
  }

  destroy() {
    if (this._tvStatusInterval) {
      clearInterval(this._tvStatusInterval);
      this._tvStatusInterval = null;
    }
    this._isInitialized = false;
  }
}
