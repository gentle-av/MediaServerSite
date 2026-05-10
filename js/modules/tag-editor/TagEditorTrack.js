export class TagEditorTrack {
  constructor(api, modal) {
    this.api = api;
    this.modal = modal;
  }

  _showNotification(message, type = "info") {
    if (window.showNotification) {
      window.showNotification(message, type);
    } else {
    }
  }

  showEditor(track, album = null) {
    const trackName =
      track.name ||
      track.title ||
      (track.path
        ? decodeURIComponent(track.path.split("/").pop()).replace(
            /\.(flac|mp3|m4a|wav)$/i,
            "",
          )
        : "Без названия");
    const modal = this.modal.show(`
      <div class="tag-editor-overlay"></div>
      <div class="tag-editor-container">
        <div class="tag-editor-header">
          <h3>Редактирование тегов трека</h3>
          <button class="tag-editor-close"><i class="fas fa-times"></i></button>
        </div>
        <div class="tag-editor-content">
          <div class="tag-editor-field">
            <label>Название трека:</label>
            <input type="text" id="editTrackTitle" value="${this.modal.escapeHtml(trackName)}" placeholder="Название трека">
          </div>
          <div class="tag-editor-field">
            <label>Исполнитель:</label>
            <input type="text" id="editTrackArtist" value="${album ? this.modal.escapeHtml(album.artist) : ""}" placeholder="Исполнитель">
          </div>
          <div class="tag-editor-field">
            <label>Альбом:</label>
            <input type="text" id="editTrackAlbum" value="${album ? this.modal.escapeHtml(album.title) : ""}" placeholder="Альбом">
          </div>
          <div class="tag-editor-field">
            <label>Номер трека:</label>
            <input type="number" id="editTrackNumber" value="${track.trackNumber || track.number || ""}" placeholder="Номер трека">
          </div>
          <div class="tag-editor-field">
            <label>Год:</label>
            <input type="text" id="editTrackYear" value="${album ? album.year || "" : ""}" placeholder="Год выпуска">
          </div>
          <div class="tag-editor-actions">
            <button class="tag-editor-save">Сохранить</button>
            <button class="tag-editor-cancel">Отмена</button>
          </div>
        </div>
      </div>
    `);
    this.modal.bindCloseHandlers(modal);
    this._bindEvents(modal, track, album);
  }

  _bindEvents(modal, track, album) {
    const saveBtn = modal.querySelector(".tag-editor-save");
    saveBtn.addEventListener("click", async () => {
      const tags = {};
      const newTitle = document.getElementById("editTrackTitle").value.trim();
      const newArtist = document.getElementById("editTrackArtist").value.trim();
      const newAlbum = document.getElementById("editTrackAlbum").value.trim();
      const newTrackNumber = document
        .getElementById("editTrackNumber")
        .value.trim();
      const newYear = document.getElementById("editTrackYear").value.trim();
      if (newTitle) tags.title = newTitle;
      if (newArtist) tags.artist = newArtist;
      if (newAlbum) tags.album = newAlbum;
      if (newTrackNumber) tags.track = parseInt(newTrackNumber);
      if (newYear) tags.year = parseInt(newYear);
      if (Object.keys(tags).length === 0) {
        this._showNotification("Нет изменений для сохранения", "info");
        this.modal.hide();
        return;
      }
      const success = await this.api.updateTags(track.path, tags);
      if (success) {
        if (tags.title && album) {
          const trackIndex = album.tracks?.findIndex(
            (t) => t.path === track.path,
          );
          if (trackIndex !== -1 && trackIndex !== undefined) {
            album.tracks[trackIndex].title = tags.title;
            album.tracks[trackIndex].name = tags.title;
            const tracksContainer = document.getElementById("modalTracksList");
            if (tracksContainer && window.albumModal) {
              await window.albumModal.tracks.render(album, true);
            }
          }
        }
        window.dispatchEvent(new CustomEvent("albumTagsUpdated"));
      } else {
        this._showNotification("Ошибка при сохранении тегов", "error");
      }
      this.modal.hide();
    });
  }

  _updateCardElements(element, tags) {
    const titleEl = element.querySelector(".album-card-title");
    const artistEl = element.querySelector(".album-card-artist");
    const yearEl = element.querySelector(".album-card-year");
    if (tags.album && titleEl) titleEl.textContent = tags.album;
    if (tags.artist && artistEl) artistEl.textContent = tags.artist;
    if (tags.year && yearEl) yearEl.textContent = tags.year;
  }
}
