const NavigationManager = {
  currentPage: null,
  loadingPage: false,
  callbacks: {
    onPageChange: null,
  },
  initialized: false,
  debug: true,

  log(...args) {
    if (this.debug) console.log("[NavigationManager]", ...args);
  },

  init() {
    if (this.initialized) {
      this.log("Already initialized");
      return;
    }
    this.initialized = true;
    this.log("Init started");
    this.attachButtonHandlers();
    this.log("Init finished");
  },

  attachButtonHandlers() {
    this.log("attachButtonHandlers called");
    const navVideo = document.getElementById("navVideo");
    const navAudio = document.getElementById("navAudio");
    const navVideoBtn = document.getElementById("navVideoBtn");
    const navAudioBtn = document.getElementById("navAudioBtn");

    if (navVideo) {
      navVideo.removeEventListener("click", this.handleVideoClick);
      this.handleVideoClick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.log("Video button CLICKED");
        this.switchToPage("video");
      };
      navVideo.addEventListener("click", this.handleVideoClick);
      this.log("Video button handler attached");
    }

    if (navAudio) {
      navAudio.removeEventListener("click", this.handleAudioClick);
      this.handleAudioClick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.log("Audio button CLICKED");
        this.switchToPage("audio");
      };
      navAudio.addEventListener("click", this.handleAudioClick);
      this.log("Audio button handler attached");
    }

    if (navVideoBtn) {
      navVideoBtn.removeEventListener("click", this.handleVideoBtnClick);
      this.handleVideoBtnClick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.log("VideoBtn button CLICKED");
        this.switchToPage("video");
      };
      navVideoBtn.addEventListener("click", this.handleVideoBtnClick);
      this.log("VideoBtn button handler attached");
    }

    if (navAudioBtn) {
      navAudioBtn.removeEventListener("click", this.handleAudioBtnClick);
      this.handleAudioBtnClick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.log("AudioBtn button CLICKED");
        this.switchToPage("audio");
      };
      navAudioBtn.addEventListener("click", this.handleAudioBtnClick);
      this.log("AudioBtn button handler attached");
    }
  },

  async switchToPage(page) {
    this.log(
      "switchToPage called with:",
      page,
      "loadingPage:",
      this.loadingPage,
      "currentPage:",
      this.currentPage,
    );
    if (this.loadingPage) {
      this.log("Already loading, skip");
      return;
    }
    if (this.currentPage === page && this.currentPage !== null) {
      this.log("Already on page, skip");
      return;
    }
    this.log("Switching to page:", page);
    this.loadingPage = true;
    this.currentPage = page;
    if (this.callbacks.onPageChange) {
      this.log("Calling onPageChange callback");
      await this.callbacks.onPageChange(page);
    }
    this.loadingPage = false;
    this.log("Switch completed");
  },

  onPageChange(callback) {
    this.callbacks.onPageChange = callback;
  },

  getCurrentPage() {
    return this.currentPage;
  },
};
