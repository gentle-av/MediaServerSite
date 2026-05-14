export class AlbumModalTracks {
  constructor(container, trackList, musicApi, universalPlayer) {
    this.container = container;
    this.trackList = trackList;
    this.musicApi = musicApi;
    this.universalPlayer = universalPlayer;
  }

  setTrackList(trackList) {
    this.trackList = trackList;
  }

  showLoading() {
    if (this.container) {
      this.container.innerHTML =
        '<div class="loading"><i class="fas fa-spinner fa-spin"></i> Загрузка треков...</div>';
    }
  }

  showError() {
    if (this.container) {
      this.container.innerHTML =
        '<div class="empty"><i class="fas fa-exclamation-triangle"></i> Ошибка загрузки треков</div>';
    }
  }

  showEmpty() {
    if (this.container) {
      this.container.innerHTML =
        '<div class="empty"><i class="fas fa-exclamation-triangle"></i> Нет треков</div>';
    }
  }

  _formatDuration(seconds) {
    if (!seconds || seconds <= 0) return "";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  }
  async render(album, force = false) {
    if (!this.container) return;
    if (album.tracks && album.tracks.length > 0 && !force) {
      if (this.trackList) {
        this.trackList.render(
          this.container,
          album,
          this._onEditTrack.bind(this),
          this.universalPlayer,
        );
      } else {
        this._renderTracksDirect(album);
      }
      return;
    }
    this.showLoading();
    if (this.musicApi) {
      try {
        const tracksData = await this.musicApi.getTracks(
          album.title,
          album.artist,
          true,
        );
        const coverUrl = await this.musicApi.fetchAlbumCover(
          album.title,
          album.artist,
        );
        const normalizedTracks = (tracksData || []).map((track, idx) => ({
          ...track,
          title:
            track.title || track.name || this._extractNameFromPath(track.path),
          displayName:
            track.title || track.name || this._extractNameFromPath(track.path),
          trackNumber: track.track || idx + 1,
          displayDuration: this._formatDuration(track.duration), // Добавляем форматированную длительность
        }));
        album.tracks = normalizedTracks;
        album.coverUrl = coverUrl;
        if (this.trackList) {
          this.trackList.render(
            this.container,
            album,
            this._onEditTrack.bind(this),
            this.universalPlayer,
          );
        } else {
          this._renderTracksDirect(album);
        }
      } catch (error) {
        console.error("Error loading tracks:", error);
        this.showError();
      }
    } else {
      this.showEmpty();
    }
  }

  _renderTracksDirect(album) {
    if (!this.container || !album.tracks) return;
    this.container.innerHTML = album.tracks
      .map((track, idx) => {
        const trackTitle = track.displayName || track.title || "Unknown";
        const duration =
          track.displayDuration || this._formatDuration(track.duration);
        return `
          <div class="track-item" data-track-index="${idx}">
            <span class="track-number">${(idx + 1).toString().padStart(2, "0")}</span>
            <span class="track-name" title="${this._escape(trackTitle)}">${this._escape(trackTitle)}</span>
            <span class="track-duration">${duration || ""}</span>
            <div class="track-actions">
              <button class="track-play-btn" data-index="${idx}" title="Воспроизвести">
                <i class="fas fa-play"></i>
              </button>
              <button class="track-edit-btn" data-index="${idx}" title="Редактировать метаданные">
                <i class="fas fa-edit"></i>
              </button>
            </div>
          </div>
        `;
      })
      .join("");

    this._attachDirectEvents(album);
  }

  _attachDirectEvents(album) {
    this.container.querySelectorAll(".track-play-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const index = parseInt(btn.dataset.index);
        const track = album.tracks[index];
        if (this.universalPlayer && track && track.path) {
          this.universalPlayer.startPlayback(track.path, "audio");
        }
      });
    });
    this.container.querySelectorAll(".track-edit-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const index = parseInt(btn.dataset.index);
        const track = album.tracks[index];
        this._onEditTrack(track, album);
      });
    });
  }

  _onEditTrack(track, album) {
    if (!album.id) {
      const card = document.querySelector(
        `.album-card .album-card-title:contains("${album.title}")`,
      );
      if (card) {
        const albumCard = card.closest(".album-card");
        if (albumCard) {
          album.id = albumCard.getAttribute("data-album-id");
        }
      }
      if (!album.id) {
        album.id = `album_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      }
    }
    if (window.TagEditor && window.TagEditor.showTrackTagEditor) {
      window.TagEditor.showTrackTagEditor(track, album);
    } else {
      if (window.showNotification) {
        window.showNotification("Редактор тегов недоступен", "error");
      }
    }
  }

  _extractNameFromPath(path) {
    if (!path) return "Без названия";
    const fileName = path.split("/").pop();
    return fileName.replace(/\.(flac|mp3|m4a|wav)$/i, "");
  }

  _escape(str) {
    if (!str) return "";
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }
}
