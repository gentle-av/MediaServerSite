export class VideoLibraryEvents {
  constructor(
    api,
    events,
    state,
    dom,
    renderer,
    thumbnailLoader,
    onPlayVideo,
    onLoadDirectory,
    getVideoCloseModal,
  ) {
    this.api = api;
    this.events = events;
    this.state = state;
    this.dom = dom;
    this.renderer = renderer;
    this.thumbnailLoader = thumbnailLoader;
    this.onPlayVideo = onPlayVideo;
    this.onLoadDirectory = onLoadDirectory;
    this.getVideoCloseModal = getVideoCloseModal;
    this._currentContextMenu = null;
  }

  bindEvents() {
    this.events.on("video:delete", (data) => this.onDeleteItem(data));
    this.events.on("navigation:videoPage", () => this.onRefresh());
    this.events.on("video:refresh", () => this.onRefresh());
    this.events.on("player:closeVideo", async (videoPath) => {
      const modal = this.getVideoCloseModal();
      if (modal) {
        await modal.show(videoPath);
      }
    });
  }

  attachItemEvents(container) {
    if (!container) return;
    container.querySelectorAll(".item-card").forEach((card) => {
      if (card._eventsAttached) return;
      card._eventsAttached = true;
      const path = card.dataset.path;
      const isDir = card.dataset.isDir === "true";
      const name = card.querySelector(".item-name")?.textContent || "";
      let clickTimeout = null;
      const clickHandler = async (e) => {
        if (e.target.closest(".swipe-delete-btn")) return;
        if (clickTimeout) {
          clearTimeout(clickTimeout);
          clickTimeout = null;
          return;
        }
        clickTimeout = setTimeout(async () => {
          clickTimeout = null;
          if (isDir) {
            await this.onLoadDirectory(path, true);
          } else {
            this.onPlayVideo(path);
          }
        }, 200);
      };
      card.addEventListener("click", clickHandler);
      card._clickHandler = clickHandler;
      this._attachDeleteButton(card, path, name, isDir);
      this._attachContextMenu(card, path, name, isDir);
    });
  }

  _attachDeleteButton(card, path, name, isDir) {
    const deleteBtn = card.querySelector(".swipe-delete-btn");
    if (deleteBtn && !deleteBtn._handlerAdded) {
      deleteBtn._handlerAdded = true;
      const deleteHandler = async (e) => {
        e.stopPropagation();
        if (
          window.deleteDialog &&
          typeof window.deleteDialog.showConfirm === "function"
        ) {
          const confirmed = await window.deleteDialog.showConfirm(name, isDir);
          if (confirmed) {
            await this.onDeleteItem({ path, name, isDir: isDir });
          }
        } else {
          const confirmed = confirm(
            `Удалить ${isDir ? "папку" : "файл"} "${name}"?`,
          );
          if (confirmed) {
            await this.onDeleteItem({ path, name, isDir: isDir });
          }
        }
      };
      deleteBtn.addEventListener("click", deleteHandler);
      deleteBtn._deleteHandler = deleteHandler;
    }
  }

  _attachContextMenu(card, path, name, isDir) {
    const contextHandler = (e) => {
      e.preventDefault();
      e.stopPropagation();
      this._showContextMenu(e.clientX, e.clientY, path, name, isDir);
    };
    if (!card._contextHandler) {
      card.addEventListener("contextmenu", contextHandler);
      card._contextHandler = contextHandler;
    }
  }

  _showContextMenu(x, y, path, name, isDirectory) {
    this._hideContextMenu();
    const menu = document.createElement("div");
    menu.className = "context-menu";
    menu.style.left = x + "px";
    menu.style.top = y + "px";
    menu.innerHTML = `<div class="context-menu-item delete-item" data-action="delete"><i class="fas fa-trash-alt"></i><span>Удалить</span></div>`;
    document.body.appendChild(menu);
    this._currentContextMenu = menu;
    const deleteBtn = menu.querySelector(".delete-item");
    deleteBtn.addEventListener("click", async (e) => {
      e.stopPropagation();
      this._hideContextMenu();
      if (
        window.deleteDialog &&
        typeof window.deleteDialog.showConfirm === "function"
      ) {
        const confirmed = await window.deleteDialog.showConfirm(
          name,
          isDirectory,
        );
        if (confirmed) {
          await this.onDeleteItem({ path, name, isDir: isDirectory });
        }
      } else {
        const confirmed = confirm(
          `Удалить ${isDirectory ? "папку" : "файл"} "${name}"?`,
        );
        if (confirmed) {
          await this.onDeleteItem({ path, name, isDir: isDirectory });
        }
      }
    });
    const closeMenu = (e) => {
      if (!menu.contains(e.target)) {
        this._hideContextMenu();
        document.removeEventListener("click", closeMenu);
        document.removeEventListener("contextmenu", closeMenu);
      }
    };
    setTimeout(() => {
      document.addEventListener("click", closeMenu);
      document.addEventListener("contextmenu", closeMenu);
    }, 0);
  }

  _hideContextMenu() {
    if (this._currentContextMenu && this._currentContextMenu.parentNode) {
      this._currentContextMenu.parentNode.removeChild(this._currentContextMenu);
      this._currentContextMenu = null;
    }
  }

  async onDeleteItem({ path, name, isDir }) {
    const endpoint = isDir ? "/api/delete-directory" : "/api/trash";
    const response = await this.api.post(endpoint, { path });
    if (response && response.success) {
      if (typeof Utils !== "undefined" && Utils.showNotification) {
        Utils.showNotification(
          `${isDir ? "Папка" : "Файл"} "${name}" ${isDir ? "удалена" : "удален"}`,
          "success",
        );
      }
      this.state.clearCache();
      await this.onLoadDirectory(this.state.getCurrentPath(), false);
    } else {
      const errorMsg = response?.error || "Ошибка удаления";
      if (typeof Utils !== "undefined" && Utils.showNotification) {
        Utils.showNotification(errorMsg, "error");
      } else {
      }
    }
  }

  onRefresh() {
    if (this.state.getCurrentPath()) {
      this.state.clearCache();
      this.onLoadDirectory(this.state.getCurrentPath(), false);
      if (this.renderer) {
        this.renderer.ensureIconsVisible();
      }
      if (this.dom) {
        this.dom.adjustBottomPadding();
      }
    }
  }
}
