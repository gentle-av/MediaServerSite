export class TagEditorModal {
  constructor() {
    this.currentModal = null;
  }

  show(contentHtml) {
    if (window.MediaCenter && window.MediaCenter._showOverlay) {
      window.MediaCenter._showOverlay();
    }
    this.currentModal = document.createElement("div");
    this.currentModal.className = "tag-editor-modal";
    this.currentModal.innerHTML = contentHtml;
    document.body.appendChild(this.currentModal);
    return this.currentModal;
  }

  hide() {
    if (!this.currentModal) return;
    this.currentModal.classList.add("closing");
    setTimeout(() => {
      this.currentModal.remove();
      this.currentModal = null;
      if (window.MediaCenter && window.MediaCenter._hideOverlay) {
        window.MediaCenter._hideOverlay();
      }
    }, 200);
  }

  bindCloseHandlers(modal, customHandler = null) {
    const overlay = modal.querySelector(".tag-editor-overlay");
    const closeBtn = modal.querySelector(".tag-editor-close");
    const cancelBtn = modal.querySelector(".tag-editor-cancel");

    const closeHandler = () => {
      if (customHandler) customHandler();
      this.hide();
    };

    if (overlay) overlay.addEventListener("click", closeHandler);
    if (closeBtn) closeBtn.addEventListener("click", closeHandler);
    if (cancelBtn) cancelBtn.addEventListener("click", closeHandler);
  }

  escapeHtml(str) {
    if (!str) return "";
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }
}
