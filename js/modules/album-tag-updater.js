class AlbumTagUpdater {
  constructor() {
    this.serverUrl = `http://${window.location.hostname}:${window.location.port}`;
  }

  getServerUrl() {
    return this.serverUrl;
  }

  async updateAlbumTags(album, newArtist, newAlbum, newYear) {
    if (!album || !album.tracks || album.tracks.length === 0) {
      Utils.showNotification("Альбом не содержит треков", "error");
      return false;
    }
    let successCount = 0;
    let errorCount = 0;
    for (const track of album.tracks) {
      const tags = {};
      if (newArtist && newArtist !== album.artist) {
        tags.artist = newArtist;
      }
      if (newAlbum && newAlbum !== album.title) {
        tags.album = newAlbum;
      }
      if (newYear && newYear !== album.year) {
        tags.year = parseInt(newYear);
      }
      if (Object.keys(tags).length === 0) {
        continue;
      }
      const success = await this.updateTrackTags(track.path, tags);
      if (success) {
        successCount++;
      } else {
        errorCount++;
      }
    }
    if (successCount > 0) {
      Utils.showNotification(
        `Обновлено ${successCount} треков${errorCount > 0 ? `, ошибок: ${errorCount}` : ""}`,
        "success",
      );
      window.dispatchEvent(new CustomEvent("albumTagsUpdated"));
      return true;
    } else {
      Utils.showNotification("Ошибка при обновлении тегов", "error");
      return false;
    }
  }

  async updateTrackTags(filePath, tags) {
    try {
      const payload = {
        path: filePath,
        ...tags,
      };
      const response = await fetch(
        `${this.getServerUrl()}/api/music/update-tags`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      const data = await response.json();
      return data.status === "success";
    } catch (error) {
      console.error("Error updating tags:", error);
      return false;
    }
  }

  showTrackTagEditor(track, album) {
    const modal = document.createElement("div");
    modal.className = "album-tag-editor-modal";
    modal.innerHTML = `
      <div class="album-tag-editor-overlay"></div>
      <div class="album-tag-editor-container">
        <div class="album-tag-editor-header">
          <h3><i class="fas fa-tags"></i> Редактирование трека</h3>
          <button class="album-tag-editor-close"><i class="fas fa-times"></i></button>
        </div>
        <div class="album-tag-editor-content">
          <div class="album-tag-editor-field">
            <label><i class="fas fa-user"></i> Исполнитель:</label>
            <input type="text" id="editTrackArtist" value="${this.escapeHtml(track.artist || album.artist)}" placeholder="Исполнитель">
          </div>
          <div class="album-tag-editor-field">
            <label><i class="fas fa-music"></i> Название:</label>
            <input type="text" id="editTrackTitle" value="${this.escapeHtml(track.title || track.name)}" placeholder="Название трека">
          </div>
          <div class="album-tag-editor-field">
            <label><i class="fas fa-compact-disc"></i> Альбом:</label>
            <input type="text" id="editTrackAlbum" value="${this.escapeHtml(album.title)}" placeholder="Название альбома">
          </div>
          <div class="album-tag-editor-field">
            <label><i class="fas fa-hashtag"></i> Номер трека:</label>
            <input type="number" id="editTrackNumber" value="${track.trackNumber || 0}" placeholder="Номер трека">
          </div>
          <div class="album-tag-editor-actions">
            <button class="album-tag-editor-save" data-action="save"><i class="fas fa-save"></i> Сохранить</button>
            <button class="album-tag-editor-cancel"><i class="fas fa-times"></i> Отмена</button>
          </div>
          <div class="album-tag-editor-note">
            <i class="fas fa-info-circle"></i>
            <span>Изменения применятся только к этому треку</span>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
    const overlay = modal.querySelector(".album-tag-editor-overlay");
    const closeBtn = modal.querySelector(".album-tag-editor-close");
    const cancelBtn = modal.querySelector(".album-tag-editor-cancel");
    const saveBtn = modal.querySelector("[data-action='save']");
    const closeModal = () => {
      modal.classList.add("closing");
      setTimeout(() => modal.remove(), 200);
    };
    overlay.addEventListener("click", closeModal);
    closeBtn.addEventListener("click", closeModal);
    cancelBtn.addEventListener("click", closeModal);
    saveBtn.addEventListener("click", async () => {
      const newArtist = document.getElementById("editTrackArtist").value.trim();
      const newTitle = document.getElementById("editTrackTitle").value.trim();
      const newAlbum = document.getElementById("editTrackAlbum").value.trim();
      const newTrackNumber =
        parseInt(document.getElementById("editTrackNumber").value) || 0;
      const tags = {};
      if (newArtist && newArtist !== (track.artist || album.artist))
        tags.artist = newArtist;
      if (newTitle && newTitle !== (track.title || track.name))
        tags.title = newTitle;
      if (newAlbum && newAlbum !== album.title) tags.album = newAlbum;
      if (newTrackNumber > 0 && newTrackNumber !== track.trackNumber)
        tags.track = newTrackNumber;
      if (Object.keys(tags).length === 0) {
        Utils.showNotification("Нет изменений для сохранения", "info");
        closeModal();
        return;
      }
      const success = await this.updateTrackTags(track.path, tags);
      if (success) {
        Utils.showNotification("Теги трека обновлены", "success");
        window.dispatchEvent(new CustomEvent("albumTagsUpdated"));
      } else {
        Utils.showNotification("Ошибка при обновлении тегов", "error");
      }
      closeModal();
    });
  }

  escapeHtml(str) {
    if (!str) return "";
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }
}

const AlbumTagUpdaterInstance = new AlbumTagUpdater();
window.TagEditor = AlbumTagUpdaterInstance;
