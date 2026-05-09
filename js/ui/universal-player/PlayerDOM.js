export class PlayerDOM {
  constructor() {
    this.element = null;
    this.elements = {};
    this._hasActivePlayback = false;
    this.channelControl = null;
  }

  init() {
    this.element = document.getElementById("universalBottomPlayer");
    if (!this.element) return false;
    this._cacheElements();
    this.element.style.display = "none";
    this.element.classList.remove("active");
    return true;
  }

  setChannelControl(control) {
    this.channelControl = control;
  }

  renderChannelControl() {
    const settings = this.elements.universalBottomSettings;
    if (!settings || !this.channelControl) return;
    let channelSection = settings.querySelector(
      ".universal-bottom-player-channel-section",
    );
    if (channelSection) return;
    channelSection = document.createElement("div");
    channelSection.className = "universal-bottom-player-channel-section";
    const channelDisplay = document.createElement("div");
    channelDisplay.id = "universalBottomChannelDisplay";
    channelDisplay.className = "universal-bottom-channel-display";
    channelDisplay.textContent = "Канал 1";
    const channelButtons = document.createElement("div");
    channelButtons.className = "universal-bottom-channel-buttons";
    for (let i = 1; i <= 9; i++) {
      const btn = document.createElement("button");
      btn.textContent = i;
      btn.dataset.channel = i;
      btn.addEventListener("click", () => {
        if (this.channelControl) this.channelControl.set(i);
      });
      channelButtons.appendChild(btn);
    }
    const zeroBtn = document.createElement("button");
    zeroBtn.textContent = "0";
    zeroBtn.dataset.channel = 0;
    zeroBtn.addEventListener("click", () => {
      if (this.channelControl) this.channelControl.set(0);
    });
    channelButtons.appendChild(zeroBtn);
    const upBtn = document.createElement("button");
    upBtn.innerHTML = '<i class="fas fa-chevron-up"></i>';
    upBtn.addEventListener("click", () => {
      if (this.channelControl) this.channelControl.up();
    });
    channelButtons.appendChild(upBtn);
    const downBtn = document.createElement("button");
    downBtn.innerHTML = '<i class="fas fa-chevron-down"></i>';
    downBtn.addEventListener("click", () => {
      if (this.channelControl) this.channelControl.down();
    });
    channelButtons.appendChild(downBtn);
    channelSection.appendChild(channelDisplay);
    channelSection.appendChild(channelButtons);
    settings.appendChild(channelSection);
    this.elements.universalBottomChannelDisplay = channelDisplay;
  }

  ensureOutputButtons() {
    const settings = this.elements.universalBottomSettings;
    if (!settings) return;
    let speakersBtn = this.elements.universalBottomSpeakersBtn;
    let headphonesBtn = this.elements.universalBottomHeadphonesBtn;
    if (speakersBtn && headphonesBtn) return;
    let outputSection = settings.querySelector(
      ".universal-bottom-player-output-section",
    );
    if (!outputSection) {
      outputSection = document.createElement("div");
      outputSection.className = "universal-bottom-player-output-section";
      const label = document.createElement("span");
      label.className = "universal-bottom-player-output-label";
      label.innerHTML = '<i class="fas fa-exchange-alt"></i> Аудиовыход:';
      outputSection.appendChild(label);
      settings.appendChild(outputSection);
    }
    if (!speakersBtn) {
      speakersBtn = document.createElement("button");
      speakersBtn.id = "universalBottomSpeakersBtn";
      speakersBtn.className = "universal-bottom-player-output-btn speakers-btn";
      speakersBtn.innerHTML =
        '<i class="fas fa-volume-up"></i><span>Колонки</span>';
      outputSection.appendChild(speakersBtn);
      this.elements.universalBottomSpeakersBtn = speakersBtn;
    }
    if (!headphonesBtn) {
      headphonesBtn = document.createElement("button");
      headphonesBtn.id = "universalBottomHeadphonesBtn";
      headphonesBtn.className =
        "universal-bottom-player-output-btn headphones-btn";
      headphonesBtn.innerHTML =
        '<i class="fas fa-headphones"></i><span>Наушники</span>';
      outputSection.appendChild(headphonesBtn);
      this.elements.universalBottomHeadphonesBtn = headphonesBtn;
    }
  }

  setHasActivePlayback(hasActive) {
    this._hasActivePlayback = hasActive;
    if (
      !this._hasActivePlayback &&
      this.element &&
      this.element.style.display === "flex"
    ) {
      this.hide();
    }
  }

  _cacheElements() {
    const ids = [
      "universalBottomPlayPauseBtn",
      "universalBottomPrevBtn",
      "universalBottomNextBtn",
      "universalBottomStopBtn",
      "universalBottomFullscreenBtn",
      "universalBottomProgressBar",
      "universalBottomProgressFill",
      "universalBottomTrackName",
      "universalBottomTrackArtist",
      "universalBottomTrackCount",
      "universalBottomCurrentTime",
      "universalBottomDuration",
      "universalBottomPreviewImg",
      "universalBottomPreviewIcon",
      "universalMinimizeBar",
      "universalBottomSettingsToggle",
      "universalBottomSettings",
      "universalBottomVolumeDown",
      "universalBottomVolumeUp",
      "universalBottomVolumeMute",
      "universalBottomVolumeValue",
      "universalBottomSpeakersBtn",
      "universalBottomHeadphonesBtn",
    ];
    ids.forEach((id) => {
      this.elements[id] = document.getElementById(id);
    });
  }

  get(id) {
    return this.elements[id];
  }

  getAll() {
    return this.elements;
  }

  show() {
    if (this.element) {
      this.element.classList.add("active");
      this.element.style.display = "flex";
    }
  }

  hide() {
    if (this.element) {
      this.element.classList.remove("active");
      this.element.style.display = "none";
    }
  }

  addClass(className) {
    this.element?.classList.add(className);
  }

  removeClass(className) {
    this.element?.classList.remove(className);
  }

  hasClass(className) {
    return this.element?.classList.contains(className);
  }

  toggleClass(className) {
    if (this.hasClass(className)) {
      this.removeClass(className);
    } else {
      this.addClass(className);
    }
  }
}
