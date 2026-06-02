export class TagEditorCover {
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

  async uploadAlbumArtForAlbum(album, imageFile) {
    if (!album.tracks || album.tracks.length === 0) {
      this._showNotification("У альбома нет треков", "error");
      return false;
    }
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!allowedTypes.includes(imageFile.type)) {
      this._showNotification(
        "Поддерживаются только JPEG, PNG, GIF и WEBP",
        "error",
      );
      return false;
    }
    const maxSize = 5 * 1024 * 1024;
    if (imageFile.size > maxSize) {
      this._showNotification("Размер файла не должен превышать 5 МБ", "error");
      return false;
    }
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        let base64Data = e.target.result;
        const commaIndex = base64Data.indexOf(",");
        if (commaIndex !== -1) {
          base64Data = base64Data.substring(commaIndex + 1);
        }
        let successCount = 0;
        for (const track of album.tracks) {
          try {
            const success = await this.api.uploadAlbumArt(
              track.path,
              base64Data,
            );
            if (success) successCount++;
          } catch (err) {
            console.error(`Ошибка загрузки обложки для ${track.path}:`, err);
          }
        }
        if (successCount > 0) {
          window.dispatchEvent(new CustomEvent("albumArtUpdated"));
          this._showNotification(
            `Обложка добавлена к ${successCount} трекам`,
            "success",
          );
          resolve(true);
        } else {
          this._showNotification(
            "Не удалось загрузить обложку ни для одного трека",
            "error",
          );
          resolve(false);
        }
      };
      reader.onerror = () => {
        this._showNotification("Ошибка чтения файла", "error");
        resolve(false);
      };
      reader.readAsDataURL(imageFile);
    });
  }
}
