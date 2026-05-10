export class TagEditorCover {
  constructor(api, modal) {
    this.api = api;
    this.modal = modal;
  }

  async uploadAlbumArtForAlbum(album, imageFile) {
    if (!album.tracks || album.tracks.length === 0) return false;
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!allowedTypes.includes(imageFile.type)) {
      Utils.showNotification(
        "Поддерживаются только JPEG, PNG, GIF и WEBP",
        "error",
      );
      return false;
    }
    const maxSize = 5 * 1024 * 1024;
    if (imageFile.size > maxSize) {
      Utils.showNotification("Размер файла не должен превышать 5 МБ", "error");
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
          if (await this.api.uploadAlbumArt(track.path, base64Data))
            successCount++;
        }
        if (successCount > 0) {
          window.dispatchEvent(new CustomEvent("albumArtUpdated"));
        }
        resolve(successCount > 0);
      };
      reader.onerror = () => resolve(false);
      reader.readAsDataURL(imageFile);
    });
  }
}
