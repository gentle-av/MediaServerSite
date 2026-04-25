class AlbumLibrary {
  constructor(musicApi, events) {
    this.api = musicApi;
    this.events = events;
    this.albums = [];
    this.filteredAlbums = [];
    this.container = document.getElementById("albumsGrid");
    this._loading = false;
    this._isDestroyed = false;
  }

  destroy() {
    this._loading = false;
    this._isDestroyed = true;
    this.albums = [];
    this.filteredAlbums = [];
    if (this.container) {
      this.container.innerHTML = "";
    }
  }

  async init() {
    await this._loadAlbumsAsync();
    this.events.on("albumDelete", () => this._loadAlbumsAsync());
    this.events.on("albumEdit", () => this._loadAlbumsAsync());
    this.events.on("albumContextMenu", ({ x, y, album }) =>
      this._showContextMenu(x, y, album),
    );
    this.events.on("albumClick", (album) => {
      this.events.emit("album:open", album);
    });
    window.addEventListener("albumTagsUpdated", () => this._loadAlbumsAsync());
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
    menu
      .querySelector('[data-action="delete"]')
      .addEventListener("click", () => {
        this.events.emit("albumDelete", album);
        menu.remove();
      });
    menu.querySelector('[data-action="edit"]').addEventListener("click", () => {
      this.events.emit("albumEdit", album);
      menu.remove();
    });
    const closeMenu = (e) => {
      if (!menu.contains(e.target)) {
        menu.remove();
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

  _extractNameFromPath(path) {
    if (!path) return "Без названия";
    const fileName = path.split("/").pop();
    return fileName.replace(/\.(flac|mp3|m4a|wav)$/i, "");
  }

  async _loadAlbumsAsync() {
    if (this._loading || this._isDestroyed) return;
    this._loading = true;
    if (this.container) {
      this.container.innerHTML =
        '<div class="loading"><i class="fas fa-spinner fa-spin"></i> Загрузка альбомов...</div>';
    }
    const artistsData = await this.api.getArtists();
    console.log("[DEBUG] artistsData:", artistsData);
    if (!artistsData?.artists || this._isDestroyed) {
      if (!this._isDestroyed) this._showError();
      this._loading = false;
      return;
    }
    this.albums = [];
    this.filteredAlbums = [];
    const uniqueAlbums = new Map();
    for (const artist of artistsData.artists) {
      if (this._isDestroyed) break;
      const albumsData = await this.api.getAlbums(artist);
      console.log("[DEBUG] albumsData for", artist, ":", albumsData);
      if (albumsData?.albums) {
        for (const albumData of albumsData.albums) {
          if (this._isDestroyed) break;
          const key = `${albumData.artist}|${albumData.album}`;
          if (!uniqueAlbums.has(key)) {
            const tracksData = await this.api.getTracks(
              albumData.album,
              albumData.artist,
            );
            console.log(
              "[DEBUG] tracksData for",
              albumData.album,
              ":",
              tracksData,
            );
            console.log("[DEBUG] tracksData.tracks:", tracksData?.tracks);
            if (tracksData?.tracks && tracksData.tracks.length > 0) {
              console.log("[DEBUG] First track:", tracksData.tracks[0]);
            }
            const coverUrl = await this.api.fetchAlbumCover(
              albumData.album,
              albumData.artist,
            );
            const normalizedTracks = (tracksData.tracks || []).map((track) => ({
              ...track,
              title:
                track.title ||
                track.name ||
                this._extractNameFromPath(track.path),
            }));
            console.log("[DEBUG] normalizedTracks:", normalizedTracks);
            const album = new Album({
              title: albumData.album,
              artist: albumData.artist,
              year: albumData.year,
              tracks: normalizedTracks,
              coverUrl,
            });
            console.log("[DEBUG] Created album:", album);
            uniqueAlbums.set(key, album);
            this.albums.push(album);
            if (window.MediaCenter && window.MediaCenter.playback) {
              for (const track of album.tracks) {
                if (track.path && track.title) {
                  window.MediaCenter.playback._trackNameCache.set(
                    track.path,
                    track.title,
                  );
                }
              }
            }
          }
        }
      }
    }
    this.albums = Array.from(uniqueAlbums.values());
    this.filteredAlbums = [...this.albums];
    console.log("[DEBUG] Total albums loaded:", this.albums.length);
    console.log("[DEBUG] First album tracks:", this.albums[0]?.tracks);
    this._render();
    this._loading = false;
  }

  _render() {
    if (!this.container || this._isDestroyed) return;
    if (this.filteredAlbums.length === 0) {
      this.container.innerHTML =
        '<div class="empty"><i class="fas fa-music"></i> Альбомы не найдены</div>';
      return;
    }
    this.container.innerHTML = "";
    for (let i = 0; i < this.filteredAlbums.length; i++) {
      const album = this.filteredAlbums[i];
      const card = new AlbumCard(album, this.events);
      this.container.appendChild(card.render());
    }
  }

  search(term) {
    this._closeAllSwipes();
    if (!term.trim()) {
      this.filteredAlbums = [...this.albums];
    } else {
      const lowerTerm = term.toLowerCase();
      this.filteredAlbums = this.albums.filter(
        (a) =>
          a.title.toLowerCase().includes(lowerTerm) ||
          a.artist.toLowerCase().includes(lowerTerm),
      );
    }
    this._render();
  }

  _closeAllSwipes() {
    if (!this.container) return;
    const cards = this.container.querySelectorAll(".album-card");
    cards.forEach((card) => {
      card.classList.remove("swipe-left");
      card.style.transform = "translateX(0)";
    });
  }

  _showError() {
    if (this.container && !this._isDestroyed) {
      this.container.innerHTML =
        '<div class="empty"><i class="fas fa-exclamation-triangle"></i> Ошибка загрузки</div>';
    }
  }
}
