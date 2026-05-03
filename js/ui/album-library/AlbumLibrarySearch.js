export class AlbumLibrarySearch {
  constructor(state, renderer) {
    this.state = state;
    this.renderer = renderer;
    this._currentTerm = "";
  }

  search(term) {
    this.renderer.closeAllSwipes();
    this._currentTerm = term;
    if (!term.trim()) {
      this.state.filteredAlbums = [...this.state.albums];
    } else {
      const lowerTerm = term.toLowerCase();
      this.state.filteredAlbums = this.state.albums.filter(
        (a) =>
          a.title.toLowerCase().includes(lowerTerm) ||
          a.artist.toLowerCase().includes(lowerTerm),
      );
    }
    this.renderer.clear();
    this.renderer.renderAlbums();
  }

  getCurrentTerm() {
    return this._currentTerm;
  }

  reset() {
    this._currentTerm = "";
    this.state.filteredAlbums = [...this.state.albums];
    this.renderer.clear();
    this.renderer.renderAlbums();
  }
}
