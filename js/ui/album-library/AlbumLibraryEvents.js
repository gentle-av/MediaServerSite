export class AlbumLibraryEvents {
  constructor(api, events, state, loader, renderer, onRefresh, search) {
    this.api = api;
    this.events = events;
    this.state = state;
    this.loader = loader;
    this.renderer = renderer;
    this.onRefresh = onRefresh;
    this.search = search;
    this._currentContextMenu = null;
    this._lastClickedAlbum = null;
    this._lastClickTime = 0;
  }

  bind() {
    this.events.on("albumDelete", (album) => this._handleAlbumDelete(album));
    this.events.on("albumEdit", (album) => this._handleAlbumEdit(album));
    this.events.on("albumContextMenu", ({ x, y, album }) =>
      this._showContextMenu(x, y, album),
    );
    this.events.on("albumClick", (album) => this._handleAlbumClick(album));
    window.addEventListener("albumTagsUpdated", () => this._refreshAlbumData());
  }

  _showDeleteConfirmDialog(album, onConfirm) {
    if (window.MediaCenter && window.MediaCenter._showOverlay) {
      window.MediaCenter._showOverlay();
    }
    const modal = document.createElement("div");
    modal.className = "custom-delete-modal";
    modal.innerHTML = `
      <div class="custom-delete-dialog">
        <div class="custom-delete-header">
          <i class="fas fa-trash-alt"></i>
          <h3>Удаление альбома</h3>
        </div>
        <div class="custom-delete-body">
          <div class="custom-delete-message">
            Вы уверены, что хотите удалить этот альбом?
          </div>
          <div class="custom-delete-filename" title="${this._escape(album.title)}">
            <i class="fas fa-compact-disc"></i>
            ${this._escape(album.title)}
          </div>
          <div class="custom-delete-artist" title="${this._escape(album.artist)}">
            <i class="fas fa-user"></i>
            ${this._escape(album.artist)}
          </div>
          <div class="custom-delete-warning">
            <i class="fas fa-exclamation-triangle"></i>
            <span>Все треки альбома будут перемещены в корзину</span>
          </div>
        </div>
        <div class="custom-delete-actions">
          <button class="custom-delete-btn custom-delete-btn-cancel">
            <i class="fas fa-times"></i>
            <span>Отмена</span>
          </button>
          <button class="custom-delete-btn custom-delete-btn-delete">
            <i class="fas fa-trash-alt"></i>
            <span>Удалить</span>
          </button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
    const closeModal = () => {
      modal.classList.add("closing");
      setTimeout(() => {
        modal.remove();
        if (window.MediaCenter && window.MediaCenter._hideOverlay) {
          window.MediaCenter._hideOverlay();
        }
      }, 200);
    };
    modal
      .querySelector(".custom-delete-btn-cancel")
      .addEventListener("click", closeModal);
    modal
      .querySelector(".custom-delete-btn-delete")
      .addEventListener("click", () => {
        closeModal();
        if (onConfirm) onConfirm();
      });
    modal.addEventListener("click", (e) => {
      if (e.target === modal) closeModal();
    });
  }

  async _handleAlbumDelete(album) {
    this._showDeleteConfirmDialog(album, async () => {
      try {
        const response = await fetch("/api/music/delete-album", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ album: album.title, artist: album.artist }),
        });
        const data = await response.json();
        if (data.status === "success") {
          const index = this.state.albums.findIndex(
            (a) => a.title === album.title && a.artist === album.artist,
          );
          if (index !== -1) {
            this.state.albums.splice(index, 1);
            this.state.filteredAlbums = [...this.state.albums];
            this.renderer.clear();
            this.renderer.renderAlbums();
          }
          if (window.showNotification) {
            window.showNotification(
              `Альбом "${album.title}" удалён`,
              "success",
            );
          }
        } else {
          if (window.showNotification) {
            window.showNotification("Ошибка при удалении альбома", "error");
          }
        }
      } catch (error) {
        console.error("Delete error:", error);
        if (window.showNotification) {
          window.showNotification("Ошибка при удалении альбома", "error");
        }
      }
    });
  }

  async _handleAlbumEdit(album) {
    if (window.TagEditor && window.TagEditor.showAlbumTagEditor) {
      window.TagEditor.showAlbumTagEditor(album);
    }
  }

  async _refreshAlbumData() {
    const currentSearchTerm = this.search?.getCurrentTerm?.() || "";
    for (let i = 0; i < this.state.albums.length; i++) {
      const album = this.state.albums[i];
      const cards = document.querySelectorAll(".album-card");
      const cardIndex = Array.from(cards).findIndex((card) => {
        const titleEl = card.querySelector(".album-title");
        const artistEl = card.querySelector(".album-artist");
        return (
          titleEl &&
          artistEl &&
          titleEl.textContent === album.title &&
          artistEl.textContent === album.artist
        );
      });
      if (cardIndex !== -1) {
        const card = cards[cardIndex];
        const titleEl = card.querySelector(".album-title");
        const artistEl = card.querySelector(".album-artist");
        const yearEl = card.querySelector(".album-year");
        if (titleEl && album.title) titleEl.textContent = album.title;
        if (artistEl && album.artist) artistEl.textContent = album.artist;
        if (yearEl && album.year) yearEl.textContent = album.year;
      }
    }
  }

  _handleAlbumClick(album) {
    if (
      this._lastClickedAlbum === album.title &&
      Date.now() - this._lastClickTime < 500
    ) {
      return;
    }
    this._lastClickedAlbum = album.title;
    this._lastClickTime = Date.now();
    this.events.emit("album:open", album);
  }

  _showContextMenu(x, y, album) {
    const existingMenu = document.querySelector(".album-context-menu");
    if (existingMenu) existingMenu.remove();
    const menu = document.createElement("div");
    menu.className = "album-context-menu";
    menu.style.left = x + "px";
    menu.style.top = y + "px";
    menu.innerHTML = `
      <div class="context-menu-item" data-action="delete">
        <i class="fas fa-trash-alt"></i> Удалить альбом
      </div>
      <div class="context-menu-item" data-action="edit">
        <i class="fas fa-edit"></i> Редактировать теги
      </div>
    `;
    document.body.appendChild(menu);
    if (window.MediaCenter && window.MediaCenter._showOverlay) {
      window.MediaCenter._showOverlay();
    }
    const closeMenuWithOverlay = () => {
      menu.remove();
      if (window.MediaCenter && window.MediaCenter._hideOverlay) {
        window.MediaCenter._hideOverlay();
      }
    };
    menu
      .querySelector('[data-action="delete"]')
      .addEventListener("click", () => {
        this.events.emit("albumDelete", album);
        closeMenuWithOverlay();
      });
    menu.querySelector('[data-action="edit"]').addEventListener("click", () => {
      this.events.emit("albumEdit", album);
      closeMenuWithOverlay();
    });
    const closeMenu = (e) => {
      if (!menu.contains(e.target)) {
        closeMenuWithOverlay();
        document.removeEventListener("click", closeMenu);
      }
    };
    setTimeout(() => document.addEventListener("click", closeMenu), 0);
  }

  _escape(str) {
    if (!str) return "";
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  unbind() {
    this.events.off("albumDelete", this._handleAlbumDelete);
    this.events.off("albumEdit", this._handleAlbumEdit);
    this.events.off("albumContextMenu");
    this.events.off("albumClick");
    window.removeEventListener("albumTagsUpdated", this._refreshAlbumData);
  }
}
