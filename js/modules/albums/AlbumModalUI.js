export class AlbumModalUI {
  constructor(modal) {
    this.modal = modal;
  }

  show() {
    if (this.modal) {
      this.modal.style.display = "flex";
      this.modal.classList.add("active");
      if (window.MediaCenter && window.MediaCenter._showOverlay) {
        window.MediaCenter._showOverlay();
      }
    }
  }

  hide() {
    if (this.modal) {
      this.modal.style.display = "none";
      this.modal.classList.remove("active");
      if (window.MediaCenter && window.MediaCenter._hideOverlay) {
        window.MediaCenter._hideOverlay();
      }
    }
  }
}
