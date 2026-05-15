export class AlbumLibraryScroll {
  constructor(loader, renderer, state, onLoadMore) {
    this.loader = loader;
    this.renderer = renderer;
    this.state = state;
    this.onLoadMore = onLoadMore;
    this._boundHandleScroll = this._handleScroll.bind(this);
    this._scrollTimeout = null;
    this._isLoading = false;
  }

  init() {
    const scrollable = document.getElementById("scrollableContent");
    if (scrollable) {
      scrollable.addEventListener("scroll", this._boundHandleScroll);
    } else {
      window.addEventListener("scroll", this._boundHandleScroll);
    }
  }

  destroy() {
    const scrollable = document.getElementById("scrollableContent");
    if (scrollable) {
      scrollable.removeEventListener("scroll", this._boundHandleScroll);
    } else {
      window.removeEventListener("scroll", this._boundHandleScroll);
    }
    if (this._scrollTimeout) clearTimeout(this._scrollTimeout);
  }

  async _handleScroll() {
    if (this._isLoading) return;
    if (
      this.state.isDestroyed ||
      this.state.isLoadingMore ||
      this.state.loading
    )
      return;
    if (this._scrollTimeout) clearTimeout(this._scrollTimeout);
    this._scrollTimeout = setTimeout(async () => {
      const scrollable = document.getElementById("scrollableContent");
      if (!scrollable) return;
      const scrollHeight = scrollable.scrollHeight;
      const scrollTop = scrollable.scrollTop;
      const clientHeight = scrollable.clientHeight;
      if (scrollHeight - scrollTop - clientHeight < 500) {
        this._isLoading = true;
        try {
          const hasMore = await this.loader.loadMoreAlbums();
          this.renderer.renderAlbums();
          if (hasMore && this.onLoadMore) {
            this.onLoadMore();
          }
        } finally {
          this._isLoading = false;
        }
      }
    }, 150);
  }
}
