export class AlbumLibrarySearch {
  constructor(state, renderer) {
    this.state = state;
    this.renderer = renderer;
    this._currentTerm = "";
    this._searchTimeout = null;
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
    this.renderer.restoreScrollPosition();
    this.renderer._fixScroll();
  }

  refreshFilter() {
    this._applyFilter();
  }

  getCurrentTerm() {
    return this._currentTerm;
  }

  reset() {
    this._currentTerm = "";
    this.state.filteredAlbums = [...this.state.albums];
    this.renderer.clear();
    this.renderer.renderAlbums();
    this.renderer._fixScroll();
  }

  search(term) {
    if (this._searchTimeout) clearTimeout(this._searchTimeout);
    this.renderer.closeAllSwipes();
    this._currentTerm = term;
    this._searchTimeout = setTimeout(() => {
      this._applyFilter();
    }, 300);
  }
}
