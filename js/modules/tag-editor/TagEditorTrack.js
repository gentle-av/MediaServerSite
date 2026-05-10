export class TagEditorTrack {
  constructor(api, modal) {
    this.api = api;
    this.modal = modal;
  }

  _showNotification(message, type = "info") {
    if (window.showNotification) {
      window.showNotification(message, type);
    } else {
      console.log(`[${type}] ${message}`);
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
      console.log("1. Save button clicked");
      const tags = {};
      const newTitle = document.getElementById("editTrackTitle").value.trim();
      const newArtist = document.getElementById("editTrackArtist").value.trim();
      const newAlbum = document.getElementById("editTrackAlbum").value.trim();
      const newTrackNumber = document
        .getElementById("editTrackNumber")
        .value.trim();
      const newYear = document.getElementById("editTrackYear").value.trim();
      console.log("2. Values read:", {
        newTitle,
        newArtist,
        newAlbum,
        newTrackNumber,
        newYear,
      });
      if (newTitle) tags.title = newTitle;
      if (newArtist) tags.artist = newArtist;
      if (newAlbum) tags.album = newAlbum;
      if (newTrackNumber) tags.track = parseInt(newTrackNumber);
      if (newYear) tags.year = parseInt(newYear);
      console.log("3. Tags to save:", tags);
      if (Object.keys(tags).length === 0) {
        this._showNotification("Нет изменений для сохранения", "info");
        this.modal.hide();
        return;
      }
      console.log("4. Calling API updateTags for path:", track.path);
      const success = await this.api.updateTags(track.path, tags);
      console.log("5. API success:", success);
      if (success) {
        console.log(
          "6. Success, checking tags.title:",
          tags.title,
          "album:",
          album,
        );
        if (tags.title && album) {
          console.log("7. Entering update block");
          const trackIndex = album.tracks?.findIndex(
            (t) => t.path === track.path,
          );
          console.log("8. Track index:", trackIndex);
          if (trackIndex !== -1 && trackIndex !== undefined) {
            album.tracks[trackIndex].title = tags.title;
            album.tracks[trackIndex].name = tags.title;
            console.log("9. Updated album track title");
            const tracksContainer = document.getElementById("modalTracksList");
            console.log("10. tracksContainer:", tracksContainer);
            console.log("11. window.albumModal:", window.albumModal);
            if (tracksContainer && window.albumModal) {
              console.log("12. Calling render");
              await window.albumModal.tracks.render(album, true);
              console.log("13. Render complete");
            }
          }
        } else {
          console.log("7b. Skip update - no title change or no album");
        }
        console.log("14. Dispatching event");
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
