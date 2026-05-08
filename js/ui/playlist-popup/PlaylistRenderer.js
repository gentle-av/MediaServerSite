export class PlaylistRenderer {
  constructor(containerId, onTrackClick, onTrackRemove) {
    this.container = document.getElementById(containerId);
    this.onTrackClick = onTrackClick;
    this.onTrackRemove = onTrackRemove;
    this._boundHandlers = new Map();
  }

  render(tracks, currentPath, currentIndex) {
    if (!this.container) return;
    if (!tracks.length) {
      this.container.innerHTML =
        '<div class="playlist-empty"><i class="fas fa-music"></i><p>Плейлист пуст</p></div>';
      return;
    }

    let html = '<div class="playlist-tracks-list">';
    let currentArtist = "";
    for (const [i, track] of tracks.entries()) {
      const isCurrent = track.path === currentPath || i === currentIndex;
      const trackNumber = i + 1;
      const artist = this._getArtist(track);
      if (artist !== currentArtist) {
        currentArtist = artist;
        html += `<div class="playlist-artist-separator" style="padding: 12px 0 6px 0; font-size: 0.8rem; font-weight: 600; color: var(--yellow); border-bottom: 1px solid var(--bg3); margin-top: 8px;"><i class="fas fa-user"></i> ${this._escape(artist)}</div>`;
      }
      html += `<div class="playlist-track-item ${isCurrent ? "current" : ""}" data-index="${i}" data-path="${this._escape(track.path)}">
        <div class="playlist-track-number">${String(trackNumber).padStart(2, "0")}</div>
        <div class="playlist-track-info">
          <div class="playlist-track-name">${this._escape(track.title)}</div>
          ${track.album ? `<div class="playlist-track-album" style="font-size: 0.65rem; color: var(--fg3); margin-top: 2px;"><i class="fas fa-compact-disc"></i> ${this._escape(track.album)}</div>` : ""}
        </div>
        <div class="playlist-track-remove-btn" data-index="${i}"><i class="fas fa-trash"></i></div>
      </div>`;
    }
    html += "</div>";
    this.container.innerHTML = html;
    this._attachEvents();
  }

  _getArtist(track) {
    if (track.artist && track.artist !== "Неизвестный исполнитель")
      return track.artist;
    const parts = track.path.split("/");
    const musicIndex = parts.findIndex((part) => part === "music");
    if (musicIndex !== -1 && parts.length > musicIndex + 1)
      return parts[musicIndex + 1];
    return "Неизвестный исполнитель";
  }

  _attachEvents() {
    this.container.querySelectorAll(".playlist-track-item").forEach((item) => {
      const handler = () => this.onTrackClick(parseInt(item.dataset.index));
      item.removeEventListener("click", item._clickHandler);
      item._clickHandler = handler;
      item.addEventListener("click", handler);
    });
    this.container
      .querySelectorAll(".playlist-track-remove-btn")
      .forEach((btn) => {
        const handler = (e) => {
          e.stopPropagation();
          this.onTrackRemove(parseInt(btn.dataset.index));
        };
        btn.removeEventListener("click", btn._removeHandler);
        btn._removeHandler = handler;
        btn.addEventListener("click", handler);
      });
  }

  scrollToCurrentTrack() {
    if (!this.container) return;
    const currentItem = this.container.querySelector(
      ".playlist-track-item.current",
    );
    if (currentItem) {
      currentItem.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }

  _escape(str) {
    if (!str) return "";
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }
}
