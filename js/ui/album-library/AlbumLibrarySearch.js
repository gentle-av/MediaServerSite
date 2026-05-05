export class AlbumLibrarySearch {
  constructor(state, renderer) {
    this.state = state;
    this.renderer = renderer;
    this._currentTerm = "";
  }

  _applyFilter() {
    if (!this._currentTerm.trim()) {
      this.state.filteredAlbums = [...this.state.albums];
    } else {
      const lowerTerm = this._currentTerm.toLowerCase();
      this.state.filteredAlbums = this.state.albums.filter(
        (a) =>
          a.title.toLowerCase().includes(lowerTerm) ||
          a.artist.toLowerCase().includes(lowerTerm),
      );
    }
    this.renderer.clear();
    this.renderer.renderAlbums();
  }

  refreshFilter() {
    this._applyFilter();
  }

  getCurrentTerm() {
    return this._currentTerm;
  }

  reset() {
    console.log(
      "[AlbumLibrarySearch] reset called, albums count:",
      this.state.albums.length,
    );
    this._currentTerm = "";
    this.state.filteredAlbums = [...this.state.albums];
    console.log(
      "[AlbumLibrarySearch] filteredAlbums count:",
      this.state.filteredAlbums.length,
    );
    this.renderer.clear();
    this.renderer.renderAlbums();
  }

  search(term) {
    console.log("[AlbumLibrarySearch] search called, term:", term);
    this.renderer.closeAllSwipes();
    this._currentTerm = term;
    this._applyFilter();
  }

  _applyFilter() {
    console.log("[AlbumLibrarySearch] _applyFilter, term:", this._currentTerm);
    console.log("[AlbumLibrarySearch] albums count:", this.state.albums.length);
    if (!this._currentTerm.trim()) {
      this.state.filteredAlbums = [...this.state.albums];
    } else {
      const lowerTerm = this._currentTerm.toLowerCase();
      this.state.filteredAlbums = this.state.albums.filter(
        (a) =>
          a.title.toLowerCase().includes(lowerTerm) ||
          a.artist.toLowerCase().includes(lowerTerm),
      );
    }
    console.log(
      "[AlbumLibrarySearch] filteredAlbums count:",
      this.state.filteredAlbums.length,
    );
    this.renderer.clear();
    this.renderer.renderAlbums();
  }
}
