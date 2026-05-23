export class ConfirmDialog {
  async confirm(title, message) {
    return new Promise((resolve) => {
      const existingModal = document.querySelector(".confirm-dialog-modal");
      if (existingModal) existingModal.remove();
      if (window.MediaCenter && window.MediaCenter._showOverlay) {
        window.MediaCenter._showOverlay();
      }
      const modal = document.createElement("div");
      modal.className = "confirm-dialog-modal";
      modal.innerHTML = `
        <div class="confirm-dialog-modal-content">
          <div class="confirm-dialog-modal-header">
            <i class="fas fa-power-off"></i>
            <h3>${this._escape(title)}</h3>
          </div>
          <div class="confirm-dialog-modal-body">
            <p>${this._escape(message)}</p>
          </div>
          <div class="confirm-dialog-modal-footer">
            <button class="confirm-dialog-modal-btn confirm-dialog-modal-cancel">
              <i class="fas fa-times"></i> Отмена
            </button>
            <button class="confirm-dialog-modal-btn confirm-dialog-modal-confirm">
              <i class="fas fa-check"></i> Подтвердить
            </button>
          </div>
        </div>
      `;
      document.body.appendChild(modal);
      const closeModal = (result) => {
        modal.classList.add("closing");
        setTimeout(() => {
          modal.remove();
          if (window.MediaCenter && window.MediaCenter._hideOverlay) {
            window.MediaCenter._hideOverlay();
          }
          resolve(result);
        }, 200);
      };
      const confirmBtn = modal.querySelector(".confirm-dialog-modal-confirm");
      const cancelBtn = modal.querySelector(".confirm-dialog-modal-cancel");
      confirmBtn.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        closeModal(true);
      };
      cancelBtn.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        closeModal(false);
      };
      modal.onclick = (e) => {
        if (e.target === modal) {
          closeModal(false);
        }
      };
    });
  }

  _escape(str) {
    if (!str) return "";
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }
}
