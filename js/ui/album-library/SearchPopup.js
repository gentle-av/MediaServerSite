export class SearchPopup {
  constructor(onSearch, onClear, getCurrentTerm) {
    this.onSearch = onSearch;
    this.onClear = onClear;
    this.getCurrentTerm = getCurrentTerm;
    this.isOpen = false;
    this.modal = null;
    this.searchInput = null;
    this._shouldClearOnClose = false;
    this._isHiding = false;
    this._boundHandleKeydown = this._handleKeydown.bind(this);
    this._onCloseCallback = null;
  }

  show() {
    console.log("[SearchPopup] show called, isOpen:", this.isOpen);
    if (this.isOpen) return;
    this._shouldClearOnClose = false;
    this._isHiding = false;
    this._createModal();
    this.isOpen = true;
    document.addEventListener("keydown", this._boundHandleKeydown);
    const currentTerm = this.getCurrentTerm ? this.getCurrentTerm() : "";
    console.log("[SearchPopup] currentTerm:", currentTerm);
    if (this.searchInput) {
      this.searchInput.value = currentTerm;
      this.searchInput.focus();
      if (currentTerm) {
        this.searchInput.setSelectionRange(
          currentTerm.length,
          currentTerm.length,
        );
      }
    }
  }

  hide() {
    console.log(
      "[SearchPopup] hide called, _isHiding:",
      this._isHiding,
      "isOpen:",
      this.isOpen,
    );
    if (this._isHiding || !this.isOpen) {
      console.log("[SearchPopup] hide skipped");
      return;
    }
    this._isHiding = true;
    console.log("[SearchPopup] _shouldClearOnClose:", this._shouldClearOnClose);
    if (this._shouldClearOnClose && this.onClear) {
      console.log("[SearchPopup] calling onClear");
      this.onClear();
    } else if (this.searchInput && this.onSearch) {
      console.log(
        "[SearchPopup] calling onSearch with value:",
        this.searchInput.value,
      );
      this.onSearch(this.searchInput.value);
    }
    if (this.modal && this.modal.parentNode) {
      this.modal.classList.add("closing");
      setTimeout(() => {
        if (this.modal && this.modal.parentNode) {
          this.modal.remove();
        }
      }, 200);
    }
    this.isOpen = false;
    document.removeEventListener("keydown", this._boundHandleKeydown);
    this._shouldClearOnClose = false;
    setTimeout(() => {
      this._isHiding = false;
    }, 300);
    if (this._onCloseCallback) {
      this._onCloseCallback();
      this._onCloseCallback = null;
    }
  }

  setOnClose(callback) {
    this._onCloseCallback = callback;
  }

  _createModal() {
    console.log("[SearchPopup] _createModal");
    if (this.modal && this.modal.parentNode) {
      this.modal.remove();
    }
    this.modal = document.createElement("div");
    this.modal.className = "search-popup-modal";
    this.modal.innerHTML = `
      <div class="search-popup-overlay"></div>
      <div class="search-popup-container">
        <div class="search-popup-header">
          <i class="fas fa-search"></i>
          <input type="text" class="search-popup-input" placeholder="Поиск альбомов или исполнителей..." autocomplete="off">
          <button class="search-popup-close">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="search-popup-content">
          <div class="search-popup-hints">
            <div class="search-hint">
              <i class="fas fa-music"></i>
              <span>Поиск по названию альбома</span>
            </div>
            <div class="search-hint">
              <i class="fas fa-user"></i>
              <span>Поиск по имени исполнителя</span>
            </div>
          </div>
        </div>
        <div class="search-popup-actions">
          <button class="search-popup-btn search-popup-clear-btn">
            <i class="fas fa-trash-alt"></i>
            <span>Очистить</span>
          </button>
          <button class="search-popup-btn search-popup-apply-btn">
            <i class="fas fa-check"></i>
            <span>Применить</span>
          </button>
        </div>
      </div>
    `;
    document.body.appendChild(this.modal);
    this.searchInput = this.modal.querySelector(".search-popup-input");
    const closeBtn = this.modal.querySelector(".search-popup-close");
    const overlay = this.modal.querySelector(".search-popup-overlay");
    const clearBtn = this.modal.querySelector(".search-popup-clear-btn");
    const applyBtn = this.modal.querySelector(".search-popup-apply-btn");
    closeBtn.addEventListener("click", () => {
      console.log("[SearchPopup] closeBtn click");
      this._shouldClearOnClose = true;
      this.hide();
    });
    overlay.addEventListener("click", () => {
      console.log("[SearchPopup] overlay click");
      this._shouldClearOnClose = false;
      this.hide();
    });
    clearBtn.addEventListener("click", () => {
      console.log("[SearchPopup] clearBtn click");
      this.searchInput.value = "";
      if (this.onClear) {
        this.onClear();
      }
      this._shouldClearOnClose = true;
      this.hide();
    });
    applyBtn.addEventListener("click", () => {
      console.log("[SearchPopup] applyBtn click");
      this._shouldClearOnClose = false;
      this.hide();
    });
    this.searchInput.addEventListener("input", (e) => {
      console.log("[SearchPopup] input event, value:", e.target.value);
      if (this.onSearch) {
        this.onSearch(e.target.value);
      }
    });
    this.searchInput.addEventListener("keydown", (e) => {
      console.log("[SearchPopup] keydown event, key:", e.key);
      e.stopPropagation();
      if (e.key === "Enter") {
        console.log("[SearchPopup] Enter pressed");
        e.preventDefault();
        this._shouldClearOnClose = false;
        this.hide();
      } else if (e.key === "Escape") {
        console.log("[SearchPopup] Escape pressed");
        e.preventDefault();
        e.stopPropagation();
        this._shouldClearOnClose = true;
        this.hide();
      }
    });
  }

  _handleKeydown(e) {
    console.log(
      "[SearchPopup] document keydown, key:",
      e.key,
      "isOpen:",
      this.isOpen,
    );
    if (e.key === "Escape" && this.isOpen && !this._isHiding) {
      console.log("[SearchPopup] Escape on document");
      e.preventDefault();
      e.stopPropagation();
      this._shouldClearOnClose = true;
      this.hide();
    }
  }
}
