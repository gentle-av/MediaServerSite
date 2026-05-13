export class AlbumLibraryScroll {
  constructor(loader, renderer, state, onLoadMore) {
    this.loader = loader;
    this.renderer = renderer;
    this.state = state;
    this.onLoadMore = onLoadMore;
    this._boundHandleScroll = this._handleScroll.bind(this);
  }

  init() {
    window.addEventListener("scroll", this._boundHandleScroll);
  }

  destroy() {
    window.removeEventListener("scroll", this._boundHandleScroll);
  }

  async _handleScroll() {
    if (
      this.state.isDestroyed ||
      this.state.isLoadingMore ||
      this.state.loading
    )
      return;
    const scrollable = document.getElementById("scrollableContent");
    if (!scrollable) return;
    const scrollHeight = scrollable.scrollHeight;
    const scrollTop = scrollable.scrollTop;
    const clientHeight = scrollable.clientHeight;
    if (scrollHeight - scrollTop - clientHeight < 300) {
      const hasMore = await this.loader.loadMoreAlbums();
      this.renderer.renderAlbums();
      if (hasMore && this.onLoadMore) {
        this.onLoadMore();
      }
    }
  }
}
